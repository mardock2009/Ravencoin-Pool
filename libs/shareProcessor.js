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

var redis = require('redis');
var Stratum = require('stratum-pool');
const loggerFactory = require('./logger.js');
const logger = loggerFactory.getLogger('ShareProcessor', 'system');

module.exports = function(poolConfig) {
	var redisConfig = poolConfig.redis;
	var coin = poolConfig.coin.name;
	var forkId = process.env.forkId;
	let logger = loggerFactory.getLogger(`ShareProcessor [:${forkId}]`, coin);
	var logSystem = 'Pool';
	var logComponent = coin;
	var logSubCat = 'Thread ' + (parseInt(forkId) + 1);
	var connection = redis.createClient(redisConfig.port, redisConfig.host);
	connection.on('ready', function() {
		logger.debug('Share processing setup with redis (' + redisConfig.host + ':' + redisConfig.port  + ')');
	});
	connection.on('error', function(err) {
		logger.error(logSystem, logComponent, logSubCat, 'Redis client had an error: ' + JSON.stringify(err))
	});
	connection.on('end', function() {
		logger.error(logSystem, logComponent, logSubCat, 'Connection to redis database has been ended');
	});
	connection.info(function(error, response) {
		if (error) {
			logger.error(logSystem, logComponent, logSubCat, 'Redis version check failed');
			return;
		}
		var parts = response.split('\r\n');
		var version;
		var versionString;
		for (var i = 0; i < parts.length; i++) {
			if (parts[i].indexOf(':') !== -1) {
				var valParts = parts[i].split(':');
				if (valParts[0] === 'redis_version') {
					versionString = valParts[1];
					version = parseFloat(versionString);
					break;
				}
			}
		}
		if (!version) {
			logger.error(logSystem, logComponent, logSubCat, 'Could not detect redis version - but be super old or broken');
		}
		else if (version < 2.6) {
			logger.error(logSystem, logComponent, logSubCat, "You're using redis version " + versionString + " the minimum required version is 2.6. Follow the damn usage instructions...");
		}
	});
	this.handleShare = function(isValidShare, isValidBlock, shareData) {
		var redisCommands = [];
		if (isValidShare) {
			redisCommands.push(['hincrbyfloat', coin + ':shares:roundCurrent', shareData.worker, shareData.difficulty]);
			redisCommands.push(['hincrby', coin + ':stats', 'validShares', 1]);
		} else {
			redisCommands.push(['hincrby', coin + ':stats', 'invalidShares', 1]);
		}
		var dateNow = Date.now();
		var hashrateData = [isValidShare ? shareData.difficulty : -shareData.difficulty, shareData.worker, dateNow];
		var blockEffort = [shareData.shareDiff / shareData.blockDiff];
		redisCommands.push(['zadd', coin + ':hashrate', dateNow / 1000 | 0, hashrateData.join(':')]);
		if (isValidBlock) {
			redisCommands.push(['rename', coin + ':shares:roundCurrent', coin + ':shares:round' + shareData.height]);
			redisCommands.push(['rename', coin + ':shares:timesCurrent', coin + ':shares:times' + shareData.height]);
			redisCommands.push(['sadd', coin + ':blocksPending', [shareData.blockHash, shareData.txHash, shareData.height].join(':')]);
			redisCommands.push(['sadd', coin + ':blocksExplorer', [dateNow, shareData.height, shareData.blockHash, shareData.worker, blockEffort].join(':')]);
			redisCommands.push(['zadd', coin + ':lastBlock', dateNow / 1000 | 0, [shareData.blockHash, shareData.txHash, shareData.worker, shareData.height, dateNow].join(':')]);
			redisCommands.push(['zadd', coin + ':lastBlockTime', dateNow / 1000 | 0, [dateNow].join(':')]);
			redisCommands.push(['hincrby', coin + ':stats', 'validBlocks', 1]);
			redisCommands.push(['hincrby', coin + ':blocksFound', shareData.worker, 1]);
		}
		else if (shareData.blockHash) {            
			redisCommands.push(['hincrby', coin + ':stats', 'invalidBlocks', 1]);           
		}
		connection.multi(redisCommands).exec(function(err, replies) {
			if (err)
			logger.error(logSystem, logComponent, logSubCat, 'Error with share processor multi ' + JSON.stringify(err));
		});
	};
};
