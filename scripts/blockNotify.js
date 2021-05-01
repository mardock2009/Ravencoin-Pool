var net       = require('net');
var parts     = config.split(':');
var host      = parts[0];
var port      = parts[1];
var config    = process.argv[2];
var password  = process.argv[3];
var coin      = process.argv[4];
var blockHash = process.argv[5];

var client = net.connect(port, host, function() {
	console.log('client connected');
	client.write(JSON.stringify({
		password: password,
		coin: coin,
		hash: blockHash
	}) + '\n');
});
client.on('data', function(data) {
	console.log(data.toString());
});
client.on('end', function() {
	console.log('client disconnected');
});