//Need to create a simple server using node.js and socket.io
var app = require('express')();
var https_options = {
	key : key,
	cert : cert
};
var https = require('https').createServer(https_options, app);
var PORT = 3000;
var io = require('socket.io')(https);
var fs = require('fs');
//specify the self-signed public certificate and the private key used
var key = fs.readFileSync('./private-key.pem');
var cert = fs.readFileSync('./public-cert.pem');

//Create a function to handle all the incoming requests
app.get('/', function(request, response){
	response.send('Hello Client');
});

//On Connection logic for clients
io.on('connection', function(clientSocket){
	console.log('Client connected...');
	clientSocket.on('disconnect', function(){
		console.log('Client has been disconnected');
	});
});

//The http server created should listen on a port for clients
https.listen(PORT, function(){
	console.log('Listening on port : ' + PORT );
});