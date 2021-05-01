var fs = require('fs');
var path = require('path');
var os = require('os');
var cluster = require('cluster');
var async = require('async');
var CliListener = require('./libs/cliListener.js');
var PoolWorker = require('./libs/poolWorker.js');
var PaymentProcessor = require('./libs/paymentProcessor.js');
var Website = require('./libs/website.js');
var algos = require('stratum-pool/lib/algoProperties.js');
delete require('http').OutgoingMessage.prototype.flush;
const loggerFactory = require('./libs/logger.js');
const logger = loggerFactory.getLogger('init.js', 'system');
JSON.minify = JSON.minify || require("node-json-minify");

if (!fs.existsSync('config.json')) {
	console.log('config.json file does not exist. Read the installation/setup instructions.');
	return;
}
var portalConfig = JSON.parse(JSON.minify(fs.readFileSync("config.json", {encoding: 'utf8'})));
var poolConfigs;
try {
	var posix = require('posix');
	try {
		posix.setrlimit('nofile', {soft: 100000, hard: 100000});
	} catch (e) {
		if (cluster.isMaster) {
			logger.warn('POSIX Connection Limit (Safe to ignore) Must be ran as root to increase resource limits');
		}
	}
	finally {
		var uid = parseInt(process.env.SUDO_UID);
		if (uid) {
			process.setuid(uid);
			logger.debug('POSIX Connection Limit Raised to 100K concurrent connections, now running as non-root user: %s', process.getuid());
		}
	}
}
catch (e) {
	if (cluster.isMaster) {
		logger.debug('POSIX Connection Limit (Safe to ignore) POSIX module not installed and resource (connection) limit was not raised');
	}
}
if (cluster.isWorker) {
	switch (process.env.workerType) {
		case 'pool':
		new PoolWorker();
		break;
		case 'paymentProcessor':
		new PaymentProcessor();
		break;
		case 'website':
		new Website();
		break;
	}
	return;
}
var buildPoolConfigs = function () {
	var configs = {};
	var configDir = 'pools/';
	var poolConfigFiles = [];
	fs.readdirSync(configDir).forEach(function (file) {
		if (!fs.existsSync(configDir + file) || path.extname(configDir + file) !== '.json') return;
		var poolOptions = JSON.parse(JSON.minify(fs.readFileSync(configDir + file, {encoding: 'utf8'})));
		if (!poolOptions.enabled) return;
		poolOptions.fileName = file;
		poolConfigFiles.push(poolOptions);
	});
	for (var i = 0; i < poolConfigFiles.length; i++) {
		var ports = Object.keys(poolConfigFiles[i].ports);
		for (var f = 0; f < poolConfigFiles.length; f++) {
			if (f === i) continue;
			var portsF = Object.keys(poolConfigFiles[f].ports);
			for (var g = 0; g < portsF.length; g++) {
				if (ports.indexOf(portsF[g]) !== -1) {
					logger.error(poolConfigFiles[f].fileName, 'Has same configured port of ' + portsF[g] + ' as ' + poolConfigFiles[i].fileName);
					process.exit(1);
					return;
				}
			}
			if (poolConfigFiles[f].coin === poolConfigFiles[i].coin) {
				logger.error(poolConfigFiles[f].fileName, 'Pool has same configured coin file coins/' + poolConfigFiles[f].coin + ' as ' + poolConfigFiles[i].fileName + ' pool');
				process.exit(1);
				return;
			}
		}
	}
	poolConfigFiles.forEach(function (poolOptions) {
		poolOptions.coinFileName = poolOptions.coin;
		var coinFilePath = 'coins/' + poolOptions.coinFileName;
		if (!fs.existsSync(coinFilePath)) {
			logger.error('[%s] could not find file %s ', poolOptions.coinFileName, coinFilePath);
			return;
		}
		var coinProfile = JSON.parse(JSON.minify(fs.readFileSync(coinFilePath, {encoding: 'utf8'})));
		poolOptions.coin = coinProfile;
		poolOptions.coin.name = poolOptions.coin.name.toLowerCase();
		if (poolOptions.coin.name in configs) {
			logger.error('%s coins/' + poolOptions.coinFileName + ' has same configured coin name '
			+ poolOptions.coin.name + ' as coins/'
			+ configs[poolOptions.coin.name].coinFileName + ' used by pool config '
			+ configs[poolOptions.coin.name].fileName, poolOptions.fileName);
			process.exit(1);
			return;
		}
		for (var option in portalConfig.defaultPoolConfigs) {
			if (!(option in poolOptions)) {
				var toCloneOption = portalConfig.defaultPoolConfigs[option];
				var clonedOption = {};
				if (toCloneOption.constructor === Object) {
					Object.assign(clonedOption, toCloneOption);
				} else {
					clonedOption = toCloneOption;
				}
				poolOptions[option] = clonedOption;
			}
		}
		configs[poolOptions.coin.name] = poolOptions;
		if (!(coinProfile.algorithm in algos)) {
			logger.error('[%s] Cannot run a pool for unsupported algorithm "' + coinProfile.algorithm + '"', coinProfile.name);
			delete configs[poolOptions.coin.name];
		}
	});
	return configs;
};
var spawnPoolWorkers = function () {
	Object.keys(poolConfigs).forEach(function (coin) {
		var p = poolConfigs[coin];
		if (!Array.isArray(p.daemons) || p.daemons.length < 1) {
			logger.error('[%s] No daemons configured so a pool cannot be started for this coin.', coin);
			delete poolConfigs[coin];
		}
	});
	if (Object.keys(poolConfigs).length === 0) {
		logger.warn('PoolSpawner: No pool configs exists or are enabled in pool_configs folder. No pools spawned.');
		return;
	}
	var serializedConfigs = JSON.stringify(poolConfigs);
	var numForks = (function () {
		if (!portalConfig.clustering || !portalConfig.clustering.enabled) {
			return 1;
		}
		if (portalConfig.clustering.forks === 'auto') {
			return os.cpus().length;
		}
		if (!portalConfig.clustering.forks || isNaN(portalConfig.clustering.forks)) {
			return 1;
		}
		return portalConfig.clustering.forks;
	})();
	var poolWorkers = {};
	var createPoolWorker = function (forkId) {
		var worker = cluster.fork({
			workerType: 'pool',
			forkId: forkId,
			pools: serializedConfigs,
			portalConfig: JSON.stringify(portalConfig)
		});
		worker.forkId = forkId;
		worker.type = 'pool';
		poolWorkers[forkId] = worker;
		worker.on('exit', function (code, signal) {
			logger.error('PoolSpawner: Fork %s died, spawning replacement worker...', forkId);
			setTimeout(function () {
				createPoolWorker(forkId);
			}, 2000);
	}).on('message', function (msg) {
		switch (msg.type) {
			case 'banIP':
			Object.keys(cluster.workers).forEach(function (id) {
				if (cluster.workers[id].type === 'pool') {
					cluster.workers[id].send({type: 'banIP', ip: msg.ip});
				}
			});
			break;
		}
	});
};
var i = 0;
var spawnInterval = setInterval(function () {
	createPoolWorker(i);
	i++;
	if (i === numForks) {
		clearInterval(spawnInterval);
		logger.debug('Master', 'PoolSpawner', 'Spawned ' + Object.keys(poolConfigs).length + ' pool(s) on ' + numForks + ' thread(s)');
	}
	}, 250);
};
var startPaymentProcessor = function() {
	var enabledForAny = false;
	for (var pool in poolConfigs) {
		var p = poolConfigs[pool];
		var enabled = p.enabled && p.paymentProcessing && p.paymentProcessing.enabled;
		if (enabled) {
			enabledForAny = true;
			break;
		}
	}
	if (!enabledForAny)
	return;
	var worker = cluster.fork({
		workerType: 'paymentProcessor',
		pools: JSON.stringify(poolConfigs)
	});
	worker.on('exit', function(code, signal) {
		logger.error('Master', 'Payment Processor', 'Payment processor died, spawning replacement...');
		setTimeout(function() {
			startPaymentProcessor(poolConfigs);
		}, 2000);
	});
};
var startWebsite = function () {
	if (!portalConfig.website.enabled) return;
	var worker = cluster.fork({
		workerType: 'website',
		pools: JSON.stringify(poolConfigs),
		portalConfig: JSON.stringify(portalConfig)
	});
	worker.on('exit', function (code, signal) {
		logger.error('Master', 'Website', 'Website process died, spawning replacement...');
		setTimeout(function () {
			startWebsite(portalConfig, poolConfigs);
		}, 2000);
	});
};
(function init() {
	poolConfigs = buildPoolConfigs();
	spawnPoolWorkers();
	setTimeout(function() {
		startPaymentProcessor();
		startWebsite();
	}, 2000);
})();
