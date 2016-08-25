//Create a server using express.
var app = require('express')();
var PORT = 3000;
var TLS_PORT = 8000;
var HOST = 'localhost';
var tls = require('tls');
var fs = require('fs');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var os  = require('os-utils');
//specify the self-signed public certificate and the private key used
var key = fs.readFileSync('./private-key.pem');
var cert = fs.readFileSync('./public-cert.pem');
var options = {
	key : key,
	cert : cert,
	ca  : [ fs.readFileSync('./client-public-cert.pem')]
};
//Adding a library to convert ist timestamp to unix timestamp
var moment = require('moment');
moment().format();

//connect to mongodb instance
mongoose.connect('mongodb://127.0.0.1:27017/devicestatistics');

//attach lister to validate successfull connection
mongoose.connection.once('connected', function() {
	console.log("Connected to database successfully using mongoose");

});

var Schema = mongoose.Schema
, ObjectId = Schema.ObjectID;

//Create a object schema to store device information
var DeviceTrack = new Schema({
	Device_identity      : { type: String, required: true },
	Latitude             : Number,
	Longitude            : Number,
    Timestamp            : Number,
	Status               : { type: String, required: true },
	Speed                : { type: Number, required: true }
});

//Create a object schema for cpu utilization 

var SystemHealth = new Schema({
	CpuUtilization : Number,
	MemUtilization : Number,
	Timestamp      : Number 
});

var DeviceTrack = mongoose.model('DeviceTrack', DeviceTrack); 
var SystemHealth = mongoose.model('SystemHealth', SystemHealth);    

//Create a secured https server using the options for level 2 tasks
var https = require('https').createServer(options, app);

//Create a tls server using the options for level 1 task
var tlsserver = tls.createServer(options, function (serverSocket) {

  serverSocket.write("Echo device..." + "\n");
  serverSocket.pipe(serverSocket);
  //Add a listener for client data being received
  serverSocket.addListener("data", function (data) {
	console.log('Device Statistics received from :  Device-' + serverSocket.remotePort);
	var jsondataObject = JSON.parse(data);
	jsondataObject.Timestamp = generateUnixTimeStamp(jsondataObject.Date, jsondataObject.Time);

	//Insert the data sent by client into our mongodb database
	var deviceTrack = new DeviceTrack(jsondataObject);
         
	        deviceTrack.save( function(error, data){
	            if(error){
	            	console.log('Error occured while saving in db ' + error);
	            }
	            else{
	            	console.log('Storing in db..');
	            }
	        });
    });

 
}).listen(TLS_PORT);


//We require body parser to get json data from https post requests
app.use(bodyParser.urlencoded({ extended: true }));
//Inorder for the request body to be parsed by the https post method we need to use the below line 
app.use(bodyParser.json());

//Create API(s) to handle all the incoming https requests(Level 2 tasks)
//Task 1.API to get cpu utilization % and memory utilization % for a time range
app.post('/fetchLocalSysHealth', function(request, response){
	console.log('received request with the following params : ' + request.body.starttime + request.body.stoptime);
	console.log('Calculating system cpu utilization at time : ' + Date.now());
	//find all the records from db between the time range 
	console.log("The startime unix timestamp is : " + moment(request.body.starttime).unix());
	SystemHealth.find({
    Timestamp: {
        $gte: moment(request.body.starttime).unix(),
        $lt: moment(request.body.stoptime).unix()
    }}, function(err, healthStats){
       console.log('CPU Utilization Stats between the range is : ' + healthStats.length);
	//find avg of them all
	totalCPUtil = 0;
	for (var i = 0, len = healthStats.length; i < len; i++) {
		totalCPUtil = totalCPUtil + healthStats[i].CpuUtilization; 
	}
	//send as response to client
	response.status(200).json({ "CpuUtilization":totalCPUtil/healthStats.length,"count" : healthStats.length});
    }); 
});

//The http server created should listen on a port for clients
https.listen(PORT, HOST);
//Function to return unix timestamp from the IST date and time
function generateUnixTimeStamp(Date, Time){

	return  moment(Date+Time).unix();

};
//Executing the function every 1 minute to fetch CPU utilization % and then store in db as unix timestamp
setInterval(function(){
	console.log('Executing the function every 1 minutes..');
	//need to store timestamp of current time with CPU utilization
	os.cpuUsage(function(v){
		CpuStatus = {
			CpuUtilization : v,
			MemUtilization : 100 - os.freememPercentage(),
			Timestamp      : moment(Date.now()).unix()
		};

		//Insert cpu data into database
		var systemHealth = new SystemHealth(CpuStatus);
		systemHealth.save( function(error, data){
			if(error){
			console.log('Error occured while saving CPU data in db ' + error);
			}
			else{
			console.log('Storing in db with timestamp : ' + systemHealth.Timestamp + ' At timestamp :' + moment(Date.now()).unix());
			}
		});
    });

	
}, 60* 1000);

console.log('tls Server is runnning on port : ' + TLS_PORT);
console.log('secure https server running on port : ' + PORT);