//Create a server using express.
var app = require('express')();
var PORT = 3000;
var HOST = 'localhost';
var fs = require('fs');
//specify the self-signed public certificate and the private key used
var key = fs.readFileSync('./private-key.pem');
var cert = fs.readFileSync('./public-cert.pem');
var https_options = {
	key : key,
	cert : cert,
	ca  : [ fs.readFileSync('./client-public-cert.pem')]
};
//Create a secured https server using the options
var https = require('https').createServer(https_options, app);

//Create a function to handle all the incoming requests
app.get('/', function(request, response){
	console.log('Landing page request caught');
	
});
//create a handler for post request , to receive data from the client socket created using tls sockets.
app.get('/stats', function(request, response) {
    console.log('Device Statistics received ...');
    response.send('Hello Device');
    
});

//The http server created should listen on a port for clients
https.listen(PORT, HOST);

console.log('Server is runnning on port : ' + PORT);

