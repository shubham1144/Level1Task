//var io = require('socket.io-client');
//var socket = io.connect('http://localhost:3000');
var HOST = 'localhost';
var tls = require('tls');
var fs = require('fs');

var options = { 
	ca  : [ fs.readFileSync('./public-cert.pem')]
};

console.log('Trying to establish a secure connection with the server');

//Add a connection listener for the client over tls/ssl connection establishment
var socketClient = tls.connect(3000, HOST, options, function(){
	console.log('Trying to connect to socketServer hosted on port 3000');
	if(socketClient.authorized){
        console.log('Client has been authenticated successfully');
	}else{
		console.log('Client unauthenticated.. possible security breach');
	}
});

socketClient.setEncoding('utf8');
socketClient.on('data', function(data) {
    console.log('-------------');
    console.log(data);
});

//Add a connect listener for the client 
//socket.on('connect', function(socketClient){
//	console.log('Connecting to socket Server');
//});