//setting up the server

var fs = require('fs');
var https = require('https');
var http = require('http');
var key = fs.readFileSync('key.pem');
var cert = fs.readFileSync('cert.pem');

var express = require('express');
var app = express();

var bodyParser = require('body-parser').json();
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(function(req, res, next) {
  res.setHeader("Content-Type", "application/json")
  next();
});

var credentials = {key: key, cert: cert};
var httpServer = http.createServer(app);
var httpsServer = https.createServer(credentials, app);

httpServer.listen(8080);
httpsServer.listen(8443);

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

/**
 * Facebook BOT
 */
var crypto  = require('crypto');
var request = require('request');
var fbbot   = require('fbbot/app.js');

// Loads fbbot
fbbot.load(
    app,
    bodyParser,
    crypto,
    express,
    https,
    request
);

/**
 * Server
 */
// Loads REST api
var server = require('server/app.js');
server.load(
    app,
    bodyParser,
    crypto,
    express,
    https,
    request
);

/***********************************
		Spotify
***********************************/

var SpotifyWebApi = require('spotify-web-api-node');
var config = require('./config');

var spotifyApi = new SpotifyWebApi({
  clientId: "294422f175f2404ca3be4840769aea24",
  clientSecret: config.clientSecret,
  redirectUri: "http://lucasbullen.com",
});

spotifyApi.setAccessToken("BQDpJ1yH71Ytvf0T9h8sZCjhyyOCyUu6KkZJvZ51iWXfe64KyBy_T6PluQUT9aoOhnQDWqX3oAg9biXMXqy6_sZh6z0DRoO6vfQdvNW3m2wZsQPtO_4BuxBa1KzqBxOY4gDMgT5F5OrokhbaLgymZSRx2_4GhhLNtQsxTyyDypSpEq0iFkNg063Ttaozk9T2awXl6k7QRV31FLLP5UG_Y4TsDNstYnU5rp8mMdJDyRnVtpmetdF_CX6FwxqVQdF_KB07m9O0U_NrtTtvXVPTQ1mZupYbgKHXzZANQy05DcHS73CzNJw");
