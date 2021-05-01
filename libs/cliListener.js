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

var events = require('events');
var net = require('net');
const logger = require('./logger.js').getLogger('CLI', 'system');
var listener = module.exports = function listener(host, port) {
	var _this = this;
	this.start = function() {
		net.createServer(function(c) {
			var data = '';
			try {
				c.on('data', function (d) {
					data += d;
					if (data.slice(-1) === '\n') {
						var message = JSON.parse(data);
						_this.emit('command', message.command, message.params, message.options, function(message) {
							c.end(message);
						});
					}
				});
				c.on('end', function () {
				});
				c.on('error', function () {
				});
			} catch(e) {
				logger.error('CLI listener failed to parse message %s', data);
			}
		}).listen(port, host, function() {
			logger.info('CLI listening on %s:%s', host, port)
		});
	}
};
listener.prototype.__proto__ = events.EventEmitter.prototype;
