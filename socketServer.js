//Create a server using express.
var app = require('express')();
var PORT = 3000;
var TLS_PORT = 8000;
var HOST = 'localhost';
var tls = require('tls');
var fs = require('fs');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
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

var DeviceTrack = new Schema({
	Device_identity      : { type: String, required: true },
	Latitude             : Number,
	Longitude            : Number,
    Timestamp            : Number,
	Status               : { type: String, required: true },
	Speed                : { type: Number, required: true }
});


var DeviceTrack = mongoose.model('DeviceTrack', DeviceTrack);     

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

//Create a function to handle all the incoming https requests(Level 2 tasks)
app.get('/', function(request, response){
	console.log('Landing page request caught');
	
});

//The http server created should listen on a port for clients
https.listen(PORT, HOST);
//Function to return unix timestamp from the IST date and time
function generateUnixTimeStamp(Date, Time){

	return  moment(Date+Time).unix();

};
console.log('Server is runnning on port : ' + PORT );