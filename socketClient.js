//Create a socket client to connect to tls socket server using the self signed public key
var HOST = 'localhost';
var tls = require('tls');
var fs = require('fs');
//Adding the https module inorder tosend requests to server once a connection has been established
var https = require("https");
//client private key and public certificate
var key = fs.readFileSync('./client-private-key.pem');
var cert = fs.readFileSync('./client-public-cert.pem');

//Options to be used when sending tls connection request to server
var options = { 
	ca  : [ fs.readFileSync('./public-cert.pem')]
};
//RequestOptions to be used used when sending https request to server
var requestOptions = {
	hostname: 'localhost',
	port: 3000,
	path: '/stats',
	method: 'GET',
	key: key,
	cert: cert,
	ca  : [ fs.readFileSync('./public-cert.pem')]
};

var postOptions = {
  hostname: 'localhost',
  port: 3000,
  path: '/sendstats',
  method: 'POST',
  headers: {
      'Content-Type': 'application/json',

  },
	key: key,
	cert: cert,
	ca  : [ fs.readFileSync('./public-cert.pem')]
};
console.log('Trying to establish a secure connection with the server');

//Add a connection listener for the client over tls/ssl connection establishment
var socketClient = tls.connect(3000, HOST, options, function(){
	console.log('tls connection in progress...');
	if(socketClient.authorized){

		console.log('CONNECTED OVER TLS/SSL WITH SELF SIGNED KEY AND AUTHORIZED\n');
		socketClient.on('close', function() {
		console.log('Extending socket connection after timeout..\n');
		socketClient.setTimeout(10000);
		});

		process.stdin.pipe(socketClient);
		process.stdin.resume();

		//Send statistical data in intervals
		setInterval(function() { 

			console.log('Sending out readings every 10 seconds');
			//sending a post request to server every 10 seconds
            var req = https.request(postOptions, function(res) {
			res.setEncoding('utf8');
			res.on('data', function (body) {
				console.log(body);
				});
				});
			req.on('error', function(e) {
				console.log('problem with request: ' + e.message);
				});
			// write data to request body
			req.write('{"Device_identity": "Device-001", "Latitude": 15.4499170, "Longitude": 73.826066, "Speed": 23}');
			req.end();

		}, 10000);
	
      //The request ends here, also the loop should end here

	}else{
		console.log('Device unauthorized... Breach Alert!!!');
	}
});
