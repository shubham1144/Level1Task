//Create a socket client to connect to tls socket server using the self signed public key
var HOST = 'localhost';
var tls = require('tls');
var fs = require('fs');
//Options to be used when sending tls connection request to server
var options = { 
	ca  : [ fs.readFileSync('./public-cert.pem')]
};

console.log('Trying to establish a secure connection with the server');
	try{
//Add a connection listener for the client over tls/ssl connection establishment
var socketClient = tls.connect(8000, HOST, options, function(){
	console.log('tls connection in progress');
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
            //Need to send data through the socket itself
            socketClient.write('{"Device_identity": "Device-' + socketClient.localPort + '","Latitude": 15.4499170, "Longitude": 73.826066,"Time": "051050","Date": "20160822", "Status": "0x0A", "Speed": 23}');


		}, 10000);
	    //the logic to send data in interval ends here

	}else{
		console.log('Device unauthorized... Breach Alert!!!');
	}
	
});
}
	catch(ex){
      console.log('Error occured due to : ' + ex + 'Exiting the client');
	}

//Receive tls data from the server
socketClient.on("data", function (data) {
  console.log('echo Server');
});	
//Error handler for socket connectoin established
socketClient.on('error', function (err) {
  console.log("Error Occured due to  :  " + err);
  process.exit();
});	