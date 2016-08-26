//Create a socket client to connect to tls socket server using the self signed public key
var HOST = 'localhost';
var tls = require('tls');
var fs = require('fs');
var SPEED_LIMIT = 60;
var MIN_LIMIT_MANIPULATE = 5;
var MAX_LIMIT_MANIPULATE = 10;
//Adding a library to convert ist in format required to be sent
var moment = require('moment');
moment().format();
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

        //using a counter to manipulate speed for providing relevant data to API's
        counter = 0, speed = SPEED_LIMIT;
		//Send statistical data in intervals
		setInterval(function() { 
            counter ++;
        
			console.log('Sending out readings every 10 seconds');
			if(counter >= MIN_LIMIT_MANIPULATE  && counter <= MAX_LIMIT_MANIPULATE)
			{
              speed = speed + counter;

			}else{
				speed = SPEED_LIMIT;
			}

            //Need to send data through the socket itself
            socketClient.write('{"Device_identity": "Device-' + socketClient.localPort + '","Latitude": 15.4499170, "Longitude": 73.826066,"Time": "'+ moment().format("hmmss") + '","Date": "' + moment().format('YYYYMMDD') + '", "Status": "0x0A", "Speed":' + speed + '}');


		}, 10000);
	    //The logic to send data in interval ends here

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