//Need to create a simple server using node.js and socket.io
var app = require('express')();
var http = require('http').Server(app);
var PORT = 3000;

//Create a function to handle all the incoming requests
app.get('/', function(request, response){
	response.send('Hello Client');
});

//The http server created should listen on a port for clients
http.listen(PORT, function(){
	console.log('Listening on port : ' + PORT );
});