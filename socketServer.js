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

//Create a secured https server using the options
var https = require('https').createServer(https_options, app);

//We require body parser to get data from post requests
app.use(bodyParser.urlencoded({ extended: true }));
//Inorder for the request body to be parsed by the post method we need to use the below line 
app.use(bodyParser.json());

//connect to mongodb instance
mongoose.connect('mongodb://127.0.0.1:27017/firstsampledb');

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
	Speed                : Number
});


var DeviceTrack = mongoose.model('DeviceTrack', DeviceTrack);     

//Create a function to handle all the incoming requests
app.get('/', function(request, response){
	console.log('Landing page request caught');
	
});
//Create a handler for post request , to receive data from the client socket created using tls sockets.
app.get('/stats', function(request, response) {
    console.log('Device Statistics received ...');
    response.send('Hello Device');
    
});

//Create a handler for post request , to receive data from the client socket created using tls sockets.
app.post('/sendstats', function(request, response) {
    console.log('Device Statistics received ...' + JSON.stringify(request.body));
//insert the data sent by client into our mongodb database
var deviceTrack = new DeviceTrack(request.body);

        deviceTrack.save( function(error, data){
            if(error){
            	console.log('Error occured while saving inmongodb ' + error);
                response.json(error);
            }
            else{
            	console.log('Saving data received by server in mongodb instance');
                //response.json(data);
            }
        });
        response.write('Data received by server..');
    
});

//The http server created should listen on a port for clients
https.listen(PORT, HOST);

console.log('Server is runnning on port : ' + PORT);

