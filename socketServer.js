//Need to create a simple server using node.js and socket.io
var app = require('express')();
var http = require('http').Server(app);
var PORT = 3000;
var io = require('socket.io')(http);

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
http.listen(PORT, function(){
	console.log('Listening on port : ' + PORT );
});