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

var express = require('express');
var os = require('os');
function workerapi(listen) {
	var _this = this;
	var app = express();
	var counters = {
		validShares   : 0,
		validBlocks   : 0,
		invalidShares : 0
	};
	var lastEvents = {
		lastValidShare   : 0,
		lastValidBlock   : 0,
		lastInvalidShare : 0
	};
	app.get('/stats', function (req, res) {
		res.send({
			"clients"    : Object.keys(_this.poolObj.stratumServer.getStratumClients()).length,
			"counters"   : counters,
			"lastEvents" : lastEvents
		});
	});
	this.start = function (poolObj) {
		this.poolObj = poolObj;
		this.poolObj.once('started', function () {
			app.listen(listen, function (lol) {
				console.log("LISTENING ");
			});
		})
		.on('share', function(isValidShare, isValidBlock, shareData) {
			var now = Date.now();
			if (isValidShare) {
				counters.validShares ++;
				lastEvents.lastValidShare = now;
				if (isValidBlock) {
					counters.validBlocks ++;
					lastEvents.lastValidBlock = now;
				}
			} else {
				counters.invalidShares ++;
				lastEvents.lastInvalidShare = now;
			}
		});
	}
}
module.exports = workerapi;
