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
var OVERSPEED_LIMIT = 4,STAT_LIMIT = 12, AVG_SPEED = 60, STAT_SPEED = 0;

//Connect to mongodb instance
mongoose.connect('mongodb://127.0.0.1:27017/devicestatistics');

//Attach lister to validate successfull connection
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
	//Find all the records from db between the time range 
	SystemHealth.find({
    Timestamp: {
        $gte: moment(request.body.starttime).unix(),
        $lt: moment(request.body.stoptime).unix()
    }}, function(err, healthStats){
	//find avg of them all
	totalCPUtil = totalmemUtilization = 0;
	for (var i = 0, len = healthStats.length; i < len; i++) {
		totalCPUtil = totalCPUtil + healthStats[i].CpuUtilization; 
		totalmemUtilization = totalmemUtilization + healthStats[i].MemUtilization;
	}
	//Send % response to client
	response.status(200).json({ "CpuUtilization":totalCPUtil/healthStats.length, "MemUtilization":totalmemUtilization/healthStats.length});
    }); 
});

//Task 2.API to get list of devices on the system
app.get('/listDevicesOnSystem', function(request, response){
console.log('Fetching list of devices connected on system');
DeviceTrack.distinct("Device_identity",(function(err, devices){
	if(err){
		console.log('Error occured while fetching list of devices on system');
	}else{
		response.json(devices);
	}
}));
});

//Task 3.API to get positions between time ranges
app.post('/getDevicePositions', function(request, response){
	console.log('The device is : ' + request.body.Device_identity + ' and the time range is as follows : ' + moment(request.body.starttime).unix() + ' to ' + moment(request.body.stoptime).unix());
	DeviceTrack.find({ Device_identity : request.body.Device_identity, Timestamp : {
        $gte: moment(request.body.starttime).unix(),
        $lt: moment(request.body.stoptime).unix()
    }}, function(err, deviceReadings){
		if(err){
			console.log('Error occured while fetching device data due to' + err);
		}else{
			response.json(deviceReadings);
		}
	});
});
//Task 4.API to get list of devices having speed more than 60 for more than 40 seconds within a specific time range
app.post('/getOverSpeedingDevices', function(request, response){
	DeviceTrack.find({ Timestamp : {$gte: moment(request.body.starttime).unix(),
	$lt: moment(request.body.stoptime).unix()}, Speed: { $gt: AVG_SPEED }}).distinct("Device_identity", function(err, uniqueDevices){
		var finalList = [];
		var device_trv_count = 0;
		uniqueDevices.forEach(function (device) {

			DeviceTrack.find({ Device_identity : device, Timestamp : {$gte: moment(request.body.starttime).unix(),
			$lt: moment(request.body.stoptime).unix()}, Speed : {$gt: AVG_SPEED}}, function(err, deviceSpecificData){ 
				ContSpeedCounter = 0;	
				deviceSpecificData.forEach(function (deviceData) {

					if(deviceData.Speed > AVG_SPEED){
					ContSpeedCounter++;
					}else{
					ContSpeedCounter = 0;
					}

					if(ContSpeedCounter > OVERSPEED_LIMIT){
					finalList.push(deviceData.Device_identity);
					ContSpeedCounter = 0;
					}
				});	 	 
				device_trv_count++;
				//Once all the unique devices are analyzed for overspeedding send the response
				if(device_trv_count == uniqueDevices.length){
				response.json(finalList);
				}
				});
			});       
	});
});

//Task5. API for Geo Dwell
app.post('/GeoDwell', function(request, response){
	console.log('Executing function to get geo dwell');
	DeviceTrack.find({Timestamp : {$gte: moment(request.body.starttime).unix(),
	$lt: moment(request.body.stoptime).unix()}}, function(err, devicesData){
         var NearDevices = [];
		//Use the below logic to calculate the distance
		devicesData.forEach(function (deviceData) {

			if(geolib.convertUnit('km', geolib.getDistance(
			{latitude: deviceData.latitude, longitude: deviceData.longitude},
			{latitude: request.body.latitude, longitude: request.body.longitude}
			), 2) < 10){
				NearDevices.push(deviceData.Device_identity);
				console.log('device : ' + deviceData.Device_identity + ' was within the time range for the coordinates specified');
			}
			});
        response.json(NearDevices);
		});
});

//Task 6. API Stationary Filter : get list of devices stationary for more than 2 minutes
app.post('/getstationaryDevices', function(request, response){
	DeviceTrack.find({ Timestamp : {$gte: moment(request.body.starttime).unix(),
	$lt: moment(request.body.stoptime).unix()}, Speed: STAT_SPEED }).distinct("Device_identity", function(err, uniqueDevices){
		var finalStationaryDevList = [];
		var device_trv_count = 0;
		uniqueDevices.forEach(function (device) {
			DeviceTrack.find({ Device_identity : device, Timestamp : {$gte: moment(request.body.starttime).unix(),
			$lt: moment(request.body.stoptime).unix()}, Speed : STAT_SPEED}, function(err, deviceSpecificData){ 
				ContSpeedCounter = timestamp_Previous = 0;
				stat_min_limit = deviceIdentified = false;
				continuousTimeStamp = timestamp_reset = true;	
				deviceSpecificData.forEach(function (deviceData) {
			    //Check if the difference between previous timestamp and current timestamp is 10
				if(timestamp_reset){
				//for initial condition and when timestamps are not continuous inbeween and 2 min criteria not met
				continuousTimeStamp = true;
				timestamp_reset = false;
				}else if((deviceData.Timestamp - timestamp_Previous) == 10){
				continuousTimeStamp = true;
				}
				else {
				continuousTimeStamp = false; 
				}

				if (stat_min_limit && !continuousTimeStamp){
                    var Deviceobj = { device: deviceData.Device_identity, 
					duration: ContSpeedCounter/6};                     	 
					finalStationaryDevList.push(Deviceobj);
					ContSpeedCounter = 0;
					stat_min_limit = false;
					deviceIdentified = true;
				}
				else if(!continuousTimeStamp && !stat_min_limit){
					ContSpeedCounter = 0;
					timestamp_reset = true;
				}
			    else{
			    	ContSpeedCounter++;
			    }

				if(ContSpeedCounter > STAT_LIMIT && !stat_min_limit){
					stat_min_limit = true;
				}
					timestamp_Previous = deviceData.Timestamp;
				});
                //we need to handle condition when device was stationary for the duration continuosly
                 if(!deviceIdentified && stat_min_limit){
                   var Deviceobj = { device: device, 
					duration: ContSpeedCounter/6}; 
					finalStationaryDevList.push(Deviceobj);
                 }
				device_trv_count++;
				//Once all the unique devices are analyzed for being stationary for more than 2 minutes(120 seconds) send the response
				if(device_trv_count == uniqueDevices.length){
					response.json(finalStationaryDevList);
				}
				});
			});       
	});
});

//The http server created should listen on a port for clients
https.listen(PORT, HOST);
//Function to return unix timestamp from the IST date and time
function generateUnixTimeStamp(Date, Time){

	return  moment(Date + 'T' +Time).unix();

};
//Executing the function every 1 minute to fetch CPU utilization % and then store in db as unix timestamp
setInterval(function(){
	//Need to store timestamp of current time with CPU utilization
	os.cpuUsage(function(v){
		CpuStatus = {
			CpuUtilization : v,
			MemUtilization : 100 - os.freememPercentage(),
			Timestamp      : moment(moment()).unix()
		};
		//Insert cpu data into database
		var systemHealth = new SystemHealth(CpuStatus);
		systemHealth.save( function(error, data){
			if(error){
			console.log('Error occured while saving CPU data in db ' + error);
			}
		});
    });
}, 60* 1000);

console.log('tls Server is runnning on port : ' + TLS_PORT);
console.log('secure https server running on port : ' + PORT);