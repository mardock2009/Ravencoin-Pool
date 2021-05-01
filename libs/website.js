const fs = require('fs');
var path = require('path');
const http = require('http');
const https = require('https');
var async = require('async');
var redis = require('redis');
var watch = require('node-watch');
var dot = require('dot');
var express = require('express');
var bodyParser = require('body-parser');
var compress = require('compression');
var Stratum = require('stratum-pool');
var util = require('stratum-pool/lib/util.js');
var api = require('./api.js');
const loggerFactory = require('./logger.js');
const logger = loggerFactory.getLogger('Website', 'system');
if (fs.existsSync('lzCode.conf')) { var lzCode = fs.readFileSync('lzCode.conf','utf8'); } else { var lzCode = ""; }
if (fs.existsSync('matomoCode.conf')) { var matomoCode = fs.readFileSync('matomoCode.conf','utf8'); } else { var matomoCode = ""; }
module.exports = function () {
	logger.info("Starting Website module");
	dot.templateSettings.strip = false;
	var portalConfig = JSON.parse(process.env.portalConfig);
	var poolConfigs = JSON.parse(process.env.pools);
	var websiteConfig = portalConfig.website;
	var portalApi = new api(portalConfig, poolConfigs);
	var portalStats = portalApi.stats;
	var logSystem = 'Website';
	var pageFiles = {
		'index.html': 'index',				// index page
		'home.html': '',				// home page
		'getting_started.html': 'getting_started',	// getting started page
		'dashboard.html': 'dashboard',                  // dashboard page
		'workers.html': 'workers',                      // all worker stats pages
		'payments.html': 'payments',                    // pool payments history
		'blocks.html': 'blocks',                        // pool blocks history
		'stats.html': 'stats',                          // pool stats pages
		'learn_more.html': 'learn_more',                // mining explained
		'miner_stats.html': 'miner_stats',              // miner stats page
		'faq.html': 'faq',                              // pool faq page
		'pool_stats.html': 'pool_stats'                 // pool page
	};
	var mainScriptPath = require('path').dirname(require.main.filename)
	var pageTemplates = {};
	var pageProcessed = {};
	var indexesProcessed = {};
	var processTemplates = function () {
		for (var pageName in pageTemplates) {
			if (pageName === 'index') continue;
			pageProcessed[pageName] = pageTemplates[pageName]({
				poolsConfigs: poolConfigs,
				stats: portalStats.stats,
				portalConfig: portalConfig,
				matomoCode: matomoCode,
				livezillaCode: lzCode
			});
			indexesProcessed[pageName] = pageTemplates.index({
				page: pageProcessed[pageName],
				selected: pageName,
				stats: portalStats.stats,
				poolConfigs: poolConfigs,
				portalConfig: portalConfig,
				matomoCode: matomoCode,
				livezillaCode: lzCode
			});
		}
	};
	var readPageFiles = function(files) {
		async.each(files, function(fileName, callback) {
			var filePath = 'website/' + (fileName === 'index.html' ? '' : 'pages/') + fileName;
			fs.readFile(filePath, 'utf8', function(err, data) {
				var pTemp = dot.template(data);
				pageTemplates[pageFiles[fileName]] = pTemp
				callback();
			});
		}, function(err) {
			if (err) {
				console.log('WEBSITE> error reading files for creating dot templates: '+ JSON.stringify(err));
				return;
			}
			processTemplates();
		});
	};
	watch(['./website', './website/pages'], function(evt, filename) {
		var basename;
		if (!filename && evt)
		basename = path.basename(evt);
		else
		basename = path.basename(filename);
		if (basename in pageFiles) {
			readPageFiles([basename]);
			logger.debug('WEBSITE> Reloaded file %s', basename);
		}
	});
	portalStats.getGlobalStats(function () {
		readPageFiles(Object.keys(pageFiles));
	});
	var buildUpdatedWebsite = function () {
		portalStats.getGlobalStats(function () {
			processTemplates();
			var statData = 'data: ' + JSON.stringify(portalStats.stats) + '\n\n';
			for (var uid in portalApi.liveStatConnections) {
				var res = portalApi.liveStatConnections[uid];
				res.write(statData);
			}
		});
	};
	setInterval(buildUpdatedWebsite, websiteConfig.stats.updateInterval * 100);
	var getPage = function (pageId) {
		if (pageId in pageProcessed) {
			var requestedPage = pageProcessed[pageId];
			return requestedPage;
		}
	};
	var poolStatPage = function(req, res, next) {
		var coin = req.params.coin || null;
		if (coin != null) {
			portalStats.getPoolStats(coin, function() {
				processTemplates();
				res.end(indexesProcessed['pool_stats']);
			});
		} else {
			next();
		}
	};
	var minerpage = function(req, res, next) {
		var address = req.params.address || null;
		if (address != null) {
			address = address.split(".")[0];
			portalStats.getBalanceByAddress(address, function() {
				processTemplates();
				res.header('Content-Type', 'text/html');
				res.end(indexesProcessed['miner_stats']);
			});
		} else {
			next();
		}
	};
	var route = function (req, res, next) {
		var pageId = req.params.page || '';
		if (pageId in indexesProcessed) {
			res.header('Content-Type', 'text/html');
			res.end(indexesProcessed[pageId]);
		}
		else
		next();
	};
	var app = express();
	app.use(bodyParser.json());
	app.get('/get_page', function (req, res, next) {
		var requestedPage = getPage(req.query.id);
		if (requestedPage) {
			res.end(requestedPage);
			return;
		}
		next();
	});
	app.get('/workers/:address', minerpage);
	app.get('/stats/:coin', poolStatPage);
	app.get('/:page', route);
	app.get('/', route);
	app.get('/api/:method', function (req, res, next) {
		portalApi.handleApiRequest(req, res, next);
	});
	app.use(compress());
	app.use('/static', express.static('website/static'));
	app.use(function (err, req, res, next) {
		console.error(err.stack);
		res.status(500).send('Something broke!');
	});
	try {
		logger.info('WEBSITE> Attempting to start Website on %s:%s', portalConfig.website.host,portalConfig.website.port);
		http.createServer(app).listen(portalConfig.website.port, portalConfig.website.host, function () {
			logger.info('WEBSITE> Website started on %s:%s', portalConfig.website.host,portalConfig.website.port);
		});
	} catch (e) {
		logger.error('WEBSITE> e = %s', JSON.stringify(e));
		logger.error('WEBSITE> Could not start website on %s:%s - its either in use or you do not have permission', portalConfig.website.host,portalConfig.website.port);
	}
	if (portalConfig.website.sslenabled) {
		try {
			logger.info('WEBSITE> Attempting to start SSL Website on %s:%s', portalConfig.website.host,portalConfig.website.sslport);	
			var privateKey = fs.readFileSync( portalConfig.website.sslkey );
			var certificate = fs.readFileSync( portalConfig.website.sslcert );
			var credentials = {key: privateKey, cert: certificate};			
			https.createServer(credentials, app).listen(portalConfig.website.sslport, portalConfig.website.host, function () {
				logger.info('WEBSITE> SSL Website started on %s:%s', portalConfig.website.host,portalConfig.website.sslport);
			});
		} catch (e) {        	
			logger.error('WEBSITE> e = %s', JSON.stringify(e));
			logger.error('WEBSITE> Could not start SSL website on %s:%s - its either in use or you do not have permission', portalConfig.website.host,portalConfig.website.sslport);
		}	
	}
};