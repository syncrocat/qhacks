var fs = require('fs');
var https = require('https');
var http = require('http');
var key = fs.readFileSync('key.pem');
var cert = fs.readFileSync('cert.pem');

var express = require('express');
var app = express();

var bodyParser = require('body-parser')
app.use( bodyParser.json() );       // to support JSON-encoded bodies
//app.use(express.json());       // to support JSON-encoded bodies

var credentials = {key: privateKey, cert: certificate};
var httpServer = http.createServer(app);
var httpsServer = https.createServer(credentials, app);

httpServer.listen(8080);
httpsServer.listen(8443);

app.get('/', function(req,res) {
    res.send('hello');
});


var SpotifyWebApi = require('spotify-web-api-node');
var config = require('./config');

var spotifyApi = new SpotifyWebApi({
  clientId: "294422f175f2404ca3be4840769aea24",
  clientSecret: config.clientSecret,
  redirectUri: "http://lucasbullen.com",
});

spotifyApi.setAccessToken("BQDpJ1yH71Ytvf0T9h8sZCjhyyOCyUu6KkZJvZ51iWXfe64KyBy_T6PluQUT9aoOhnQDWqX3oAg9biXMXqy6_sZh6z0DRoO6vfQdvNW3m2wZsQPtO_4BuxBa1KzqBxOY4gDMgT5F5OrokhbaLgymZSRx2_4GhhLNtQsxTyyDypSpEq0iFkNg063Ttaozk9T2awXl6k7QRV31FLLP5UG_Y4TsDNstYnU5rp8mMdJDyRnVtpmetdF_CX6FwxqVQdF_KB07m9O0U_NrtTtvXVPTQ1mZupYbgKHXzZANQy05DcHS73CzNJw");

//mongoDB

var mongodb = require('mongodb');
var client = mongodb.MongoClient;
var database;

client.connect('mongodb://localhost:27017/qhacks', function (err, db) {
    if (err) {
        console.log('Unable to connect to the mongoDB server. Error:', err);
    } else {
        database = db;
    }
});

app.post("/routers/:id",function(request, response){
    var id = request.params.id;

	if(request.body.access_token == null ||
		request.body.display_name == null){
		console.log("bad router");
		var obj = { error : "missing parameter"};

	    response.writeHead(400, {"Content-Type": "application/json"});
	    response.write(JSON.stringify(obj));
	}

	var router = {
		"access_token": request.body.access_token,
		"display_name" : request.body.display_name,
		"router_id" : id
	};

	var collection = database.collection('routers');
	collection.remove({'router_id':id});
    collection.insertOne(router)
    .then(function(result) {
        console.log("Saved");
        response.writeHead(200, {"Content-Type": "application/json"});
	    response.write(JSON.stringify({success:true}));
    });
});

app.post("/routers/:id/users",function(request, response){
    var id = request.params.id;

   	if(request.body.macAddresses == null){
		console.log("bad list");
		var obj = { error : "missing parameter"};

	    response.writeHead(400, {"Content-Type": "application/json"});
	    response.write(JSON.stringify(obj));
	}

	/*
		TODO:
			get last list
			compare to new list given list
			remove all current rel with router
			add new
			tell spotify
	*/
});

app.post("/users/:id",function(request,response){
	var id = request.params.id;
	if(request.body.macAddress == null ||
		request.body.display_name == null){
		console.log("bad user");
		var obj = { error : "missing parameter"};

	    response.writeHead(400, {"Content-Type": "application/json"});
	    response.write(JSON.stringify(obj));
	}

	var user = {
		"mac_address": request.body.macAddress,
		"display_name" : request.body.display_name,
		"spotify_id" : id
	};

	var collection = database.collection('users');
	collection.remove({'spotify_id':id});
    collection.insertOne(user)
    .then(function(result) {
        console.log("Saved");
        response.writeHead(200, {"Content-Type": "application/json"});
	    response.write(JSON.stringify({success:true}));
    });
});

