const
	fs = require('fs'),
	process = require('child_process');

var CLIENTS = 10;
/*Create 10 child process*/
for(var i=0; i<CLIENTS; i++) {
	var client = process.spawn('node', ['socketClient.js', i]);
	
	client.stdout.on('data', function (data) {
	  console.log('Activity: ' + data);
	});
	
	client.stderr.on('data', function (data) {
	  console.log('Err :  ' + data);
	});
	
	client.on('close', function (code) {
	  console.log('client child process exited with code ' + code);
	});
}