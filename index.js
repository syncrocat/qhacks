//setting up the server

var fs = require('fs');
var https = require('https');
var http = require('http');
var request = require('request');
var key = fs.readFileSync('key.pem');
var cert = fs.readFileSync('cert.pem');

var express = require('express');
var app = express();

var bodyParser = require('body-parser').json();
app.use( bodyParser );       // to support JSON-encoded bodies
app.use(function(req, res, next) {
  //res.setHeader("Content-Type", "application/json")
  next();
});

var credentials = {key: key, cert: cert};
var httpServer = http.createServer(app);
var httpsServer = https.createServer(credentials, app);

httpServer.listen(8080);
httpsServer.listen(8443);

//mongoDB

var mongodb = require('mongodb');


/**
 * Facebook BOT
 */
var crypto  = require('crypto');
var fbbot   = require('./fbbot/app.js');

// Loads fbbot
fbbot.load(
    app,
    require('body-parser'),
    crypto,
    express,
    https,
    request,
    require('localtunnel')
);

/**
 * Server
 */
// Loads REST api
var server = require('./server/app.js');
server.load(
    app,
    bodyParser,
    express,
    https,
    mongodb,
    request
);

/*
 * Spotify
*/

var SpotifyWebApi = require('spotify-web-api-node');
var config = require('./config');

var spotify = require('./spotify/app.js');
spotify.load(
    app,
    bodyParser,
    express,
    https,
    mongodb,
    config,
    SpotifyWebApi,
    request,
    server
);

/*
 * Website
*/

// Loads REST api
var website = require('./DJSpot/app.js');
website.load(
    app,
    bodyParser,
    express,
    https,
    request,
    config,
	require("querystring"),
	require("cookie-parser"),
    server,
    spotify
);
