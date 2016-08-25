//Create a server using express.
var app = require('express')();
var PORT = 3000;
var HOST = 'localhost';
var fs = require('fs');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
//specify the self-signed public certificate and the private key used
var key = fs.readFileSync('./private-key.pem');
var cert = fs.readFileSync('./public-cert.pem');
var https_options = {
	key : key,
	cert : cert,
	ca  : [ fs.readFileSync('./client-public-cert.pem')]
};
//Adding a library to convert ist timestamp to unix timestamp
var moment = require('moment');
moment().format();

//Create a secured https server using the options
var https = require('https').createServer(https_options, app);

//We require body parser to get json data from post requests
app.use(bodyParser.urlencoded({ extended: true }));
//Inorder for the request body to be parsed by the post method we need to use the below line 
app.use(bodyParser.json());

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

//Create a function to handle all the incoming requests
app.get('/', function(request, response){
	console.log('Landing page request caught');
	
});

//Create a handler for post request , to receive data from the client socket created using tls sockets.
app.post('/sendstatistics', function(request, response) {
    console.log('Device Statistics received ...');
	request.body.Timestamp = generateUnixTimeStamp(request.body.Date, request.body.Time);
	//Insert the data sent by client into our mongodb database
	var deviceTrack = new DeviceTrack(request.body);

	        deviceTrack.save( function(error, data){
	            if(error){
	            	console.log('Error occured while saving in db ' + error);
	                response.json(error);
	            }
	            else{
	            	console.log('Storing in db..');
	            }
	        });
	response.write('Data received by server..');
    
});

//Function to return unix timestamp from the IST date and time
function generateUnixTimeStamp(Date, Time){

	return  moment(Date+Time).unix();

};
//The http server created should listen on a port for clients
https.listen(PORT, HOST);
console.log('Server is runnning on port : ' + PORT );