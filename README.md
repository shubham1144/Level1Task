# Level1 and 2 Tasks
* To create working node js multi client server and working node js client to stream data to the server
* To create a https server to serve API's and connect to mongodb instance

##Steps to setup the application on system

#Step 1: node should be installed on the system.
       -the installation can be verified by running the below command
```

node -v

```
* The application has been developed with node v6.4.0.       

#Step 2: 'mongodb' should be installed on the system and should be running on port '127.0.0.1:27017' i.e the default port allocated to mongodb instance.

#Step 3: Open a terminal and navigate to the project directory and hit the below command

```
ls

```
we will be able to see a list of files available as below

```
README.md		client-private-key.pem	csr.pem			package.json		private-key.pem		socketClient.js		spawnclients.js
client-csr.pem		client-public-cert.pem	node_modules		payloadDefination.txt	public-cert.pem		socketServer.js		

```
#Step 4: Run the following command to start the node server 

```
node socketServer.js

```
the server should be up and running (provided node is installed and mongodb instance running).
The tls server is allocated port : 8000 and https server is allocated port :3000.

#Step 5: Run the following command to start multiple client processes in parallel and connect over secure tls/ssl connection to the server.

```
node spawnclients.js

```

The application should be up and running and work as per the requirement.