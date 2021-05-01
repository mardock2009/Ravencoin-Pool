/*
Copyright 2021 JAMPS (jamps.pro)

Authors: Olaf Wasilewski (olaf.wasilewski@gmx.de)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
associated documentation files (the "Software"), to deal in the Software without restriction,
including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense,
and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial
portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT
LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

var stats = {};
var getPoolStats = function(key) {
	return stats['p_' + key];
}
var getWorkerStats = function(address) {
	return stats['w_' + address];
}
var addWorkerToTracker = function(statData, workerData, address, callback) {
	if (stats['w_' + address]) {
		updateWorkerData(statData, workerData, address, callback);
	} else {
		buildWorkerData(statData, workerData, address, callback);
	}
}
var addPoolToTracker = function(poolData, poolName, callback) {
	if (stats['p_' + poolName]) {
		updatePoolData(poolData, poolName, callback);
	} else {
		buildPoolData(poolData, poolName, callback);
	}
}
var update = function(key, value, index = 0) {
	var stats = stats[key];
	if (stats) {
		var statsValues = stats.values[index];
		if (statsValues) {
			statsValues.shift();
			statsValues.push(value);
		}
	}
}
var buildWorkerData = function(statData, workerData, address, callback = null) {
	if (!address || !workerData) {
		return;
	}
	var account = {
		paid: workerData.paid,
		balance: workerData.balances,
		hashrate: 0,
		poolHashrate: 0,
		shares: workerData.totalShares,
		currRoundShares: 0,
		symbol: '',
		pool: '',
		poolSize: 0,
		currRoundPoolShares: 0,
		invalidShares: 0,
		miners: {}
	};
	$.getJSON('/api/stats', function(data) {
		for (var p in data.pools) {
			for (var w in data.pools[p].workers) {
				var worker = getWorkerNameFromAddress(w);
				if (w.split(".")[0] === _miner) {
					var a = account.miners[w] = (account.miners[worker] || {
						key: worker,
						paid: data.pools[p].workers[w].paid,
						balance: data.pools[p].workers[w].paid,
						hashrate: [],
						validShares: data.pools[p].workers[w].shares,
						currRoundShares: data.pools[p].workers[w].currRoundShares,
						invalidShares: data.pools[p].workers[w].invalidshares
					});
					account.invalidShares += data.pools[p].workers[w].invalidshares;
					account.currRoundShares += data.pools[p].workers[w].currRoundShares;
					account.hashrate += data.pools[p].workers[w].hashrate;
					if (account.symbol.length < 1) {
						account.symbol = data.pools[p].symbol;
						account.poolSize = data.pools[p].workers ? Object.keys(data.pools[p].workers).length : 0;
						account.pool = p;
					}
				}
			}
		}
		if(data.pools[account.pool] && data.pools[account.pool].workers) {
			for (var w in data.pools[account.pool].workers) {
				account.poolHashrate += data.pools[account.pool].workers[w].hashrate;
				account.currRoundPoolShares += data.pools[account.pool].workers[w].currRoundShares;
			}
		}
		for (var w in workerData.history) {
			var worker = getWorkerNameFromAddress(w);
			var a = account.miners[w] = (account.miners[worker] || {
				key: worker,
				paid: 0,
				balance: 0,
				hashrate: [],
				validShares: 0,
				currRoundShares: 0,
				invalidShares: 0
			});
			for (var wh in workerData.history[w]) {
				a.hashrate.push([workerData.history[w][wh].time * 1000, workerData.history[w][wh].hashrate]);
			}
		}
		var key = 'w_' + address;
		stats[key] = account;
		if (callback != null) {
			callback();
		}
	});
}
var buildPoolData = function(statData, poolName, callback = null) {
	if (!poolName || !statData) {
		return;
	}
	$.getJSON('/api/pool_stats', function(data) {
		var pool = {
			hashrate: [],
			averagedHashrate: [],
			workers: [],
			averagedWorkers: [],
			blocks: [],
			networkDiff: [],
			networkSols: []
		};
		var totalHashrate = 0;
		var totalWorkers = 0;
		var count = 0;
		for (var i = 0; i < statData.length; i++) {
			var time = statData[i].time * 1000;
			if (!statData[i].pools) {
				continue;
			}
			if (poolName in statData[i].pools) {
				var hashrate = statData[i].pools[poolName].hashrate;
				var workers = statData[i].pools[poolName].workerCount;
				var blocks = statData[i].pools[poolName].blocks.pending;
				var networkDiff = statData[i].pools[poolName].networkDiff;
				var networkSols = statData[i].pools[poolName].networkSols;
				totalHashrate += hashrate;
				totalWorkers += workers;
				count++;
				var averaged = (totalHashrate > 0 && count > 1) ? totalHashrate / count : hashrate;
				var averagedWorkers = (totalWorkers > 0 && count > 1) ? totalWorkers / count : workers;
				pool.hashrate.push([time, hashrate]);
				pool.averagedHashrate.push([time, averaged]);
				pool.workers.push([time, workers]);
				pool.averagedWorkers.push([time, averagedWorkers]);
				pool.blocks.push([time, blocks]);
				pool.networkDiff.push([time, networkDiff]);
				pool.networkSols.push([time, networkSols]);
			} else {
				pool.hashrate.push([time, 0]);
				pool.averagedHashrate.push([time, 0]);
				pool.workers.push([time, 0]);
				pool.averagedWorkers.push([time, 0]);
				pool.blocks.push([time, 0]);
				pool.networkDiff.push([time, 0]);
				pool.networkSols.push([time, 0]);
			}
		}
		var key = 'p_' + poolName;
		stats[key] = pool;
		if (callback != null) {
			callback();
		}
	});
}
var updatePoolData = function(statData, poolName, callback = null) {
	var pool = stats['p_' + poolName];
	if (pool) {
		var time = statData.time * 1000;
		if (poolName in statData.pools) {
			var hashrate = statData.pools[poolName].hashrate;
			var workers = statData[i].pools[poolName].workerCount;
			var blocks = statData.pools[poolName].blocks.pending;
			var networkDiff = statData.pools[poolName].networkDiff;
			var networkSols = statData.pools[poolName].networkSols;
			pool.hashrate.push([time, hashrate]);
			pool.averagedHashrate.push([time, pool.hashrate.reduce(function(a, b) {
				return a[1] + b[1];
			}) / pool.hashrate.length]);
			pool.workers.push([time, workers]);
			pool.blocks.push([time, blocks]);
			pool.networkDiff.push([time, networkDiff]);
			pool.networkSols.push([time, networkSols]);
		} else {
			pool.hashrate.push([time, 0]);
			pool.averagedHashrate.push([time, 0]);
			pool.workers.push([time, 0]);
			pool.blocks.push([time, 0]);
			pool.networkDiff.push([time, 0]);
			pool.networkSols.push([time, 0]);
		}
		if (callback != null) {
			callback(pool);
		}
	} else {
		buildPoolData(statData, poolName, callback);
	}
}
var updateWorkerData = function(statData, workerData, address, callback = null) {}
function getWorkerNameFromAddress(w) {
	var worker = w;
	if (w.split(".").length > 1) {
		worker = w.split(".")[1];
		if (worker == null || worker.length < 1) {
			worker = "noname";
		}
	} else {
		worker = "noname";
	}
	return worker;
}