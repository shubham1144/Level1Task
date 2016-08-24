var io = require('socket.io-client');
var socket = io.connect('http://localhost:3000');

//Add a connect listener for the client 
socket.on('connect', function(socketClient){
	console.log('Connecting to socket Server');
});