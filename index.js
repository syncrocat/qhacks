var express = require('express');
var SpotifyWebApi = require('spotify-web-api-node');
var config = require('./config');

var spotifyApi = new SpotifyWebApi({
  clientId: "294422f175f2404ca3be4840769aea24",
  clientSecret: config.clientSecret,
  redirectUri: "http://lucasbullen.com",
});

spotifyApi.setAccessToken("BQDpJ1yH71Ytvf0T9h8sZCjhyyOCyUu6KkZJvZ51iWXfe64KyBy_T6PluQUT9aoOhnQDWqX3oAg9biXMXqy6_sZh6z0DRoO6vfQdvNW3m2wZsQPtO_4BuxBa1KzqBxOY4gDMgT5F5OrokhbaLgymZSRx2_4GhhLNtQsxTyyDypSpEq0iFkNg063Ttaozk9T2awXl6k7QRV31FLLP5UG_Y4TsDNstYnU5rp8mMdJDyRnVtpmetdF_CX6FwxqVQdF_KB07m9O0U_NrtTtvXVPTQ1mZupYbgKHXzZANQy05DcHS73CzNJw");

// Get Elvis' albums
spotifyApi.getArtistAlbums('43ZHCT0cAZBISjO8DG9PnE', { limit: 10, offset: 20 }, function(err, data) {
  if (err) {
    console.error(err);
  } else {
    console.log(data.body);
  }
});
