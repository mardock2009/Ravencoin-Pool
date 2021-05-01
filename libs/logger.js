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

const {createLogger, format, transports} = require('winston');
const {splat, combine, timestamp, label, printf} = format;
const config = require('../config.json');
if(!config)  {
	throw  new Error("Config file config.json does not exist")
}
const logLevel = config.logger ? config.logger.level || 'debug' : config.logLevel || 'debug';
require('winston-daily-rotate-file');
module.exports = {
	getLogger: function (loggerName, coin) {
		let transportz = [new transports.Console()];
		if (config.logger && config.logger.file) {
			transportz.push(
				new transports.DailyRotateFile({
					filename: config.logger.file,
					datePattern: 'YYYY-MM-DD',
					prepend: false,
					localTime: true,
					level: logLevel,
					colorize: true
				})
			);
		}
		return createLogger({
			format: combine(
				splat(),
				label({label: {loggerName: loggerName, coin: coin}}),
				timestamp(),
				printf(info => {
					return `[${info.timestamp}] [${info.level}] [${info.label.coin}] [${info.label.loggerName}] : ${info.message}`;
				})
			),
			level: logLevel,
			localTime: true,
			colorize: true,
			transports: transportz,
		});
	}
};
