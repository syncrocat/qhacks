exports.isLoaded = false;
exports.load = function(
    app,
    bodyParser,
    express,
    https,
    mongodb,
    config,
    SpotifyWebApi,
    request
) {
  var clientId =  "294422f175f2404ca3be4840769aea24";
  var clientSecret = config.clientSecret;

  // Assumes ownerId and refreshId are associated with a routerId
  // Assumes you can update the accessToken associated with a router owner
  exports.refreshPartyToken = function(refreshId, callback) {
    var authOptions = {
	    url: 'https://accounts.spotify.com/api/token',
	    headers: {
        'Authorization': 'Basic ' + (new Buffer(clientId + ':' + clientSecret).toString('base64'))
      },
	    form: {
	      grant_type: 'refresh_token',
	      refresh_token: refreshId
	    },
	    json: true
	  };

	  request.post(authOptions, function(error, response, body) {
	    if (!error && response.statusCode === 200) {
	      var access_token = body.access_token;
	      callback(access_token);
	    }else{
        console.log('failed to update auth');
      }
	  });
  };

	exports.userTopSongs = function(accessToken, callback) {//function(request, response) {
    var top_50 = [];
    var authOptions = {
      url: 'https://api.spotify.com/v1/me/top/tracks?limit=50',
      headers: {
        'Authorization': 'Bearer ' + accessToken
      },
      json: true
    };

    request.get(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {
        body.items.forEach(function(e) {
          top_50.push(e.id);
        });
        callback(top_50);
      } else {
        console.log(response.statusCode);
        console.log(error);
      }
    });
	};

  exports.userTopArtists = function(accessToken, callback) {
    var top_50 = [];
    var authOptions = {
      url: 'https://api.spotify.com/v1/me/top/artists?limit=50',
      headers: {
        'Authorization': 'Bearer ' + accessToken
      },
      json: true
    };

    request.get(authOptions, function(error, response, body) {
      //console.log("Here's what topSongs returned:");
      if (!error && response.statusCode === 200) {
        body.items.forEach(function(e) {
          console.log(e.id);
          top_50.push(e.id);
        });
        callback(top_50);
      } else {
        console.log(response.statusCode);
        console.log(error);
      }
    });
	};

  var artistTopGenres = function(accessToken, artists, callback) {
    // artists is a comma-separated list of artist IDs
    var authOptions = {
      url: 'https://api.spotify.com/v1/artists?ids=' + artists,
      headers: {
        'Authorization': 'Bearer ' + accessToken
      },
      json: true
    };
    var genres = {};
    request.get(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {
        body.artists.forEach(function(e) {
          e.genres.forEach(function(f) {
            if (f in genres) {
              genres[f] += 1;
            } else {
              genres[f] = 0;
            }
          });
        });
        callback(genres);
      }
    });
  };

  /*exports.getUserGenres = function(accessToken, callback) {
    userTopArtists(accessToken, function(artists) {
      artistTopGenres(accessToken, artists, function(genres) {
        callback(genres);
      });
    });
  };*/

  exports.get20Seeded = function(accessToken, artists, attributes, callback) {
    // attributes should be a dictionary containing values for each of
    // the tunable track attributes we care about

    var authOptions = {
      url: 'https://api.spotify.com/v1/recommendations?market=CA&seed_artists=' + artists,
      headers: {
        'Authorization': 'Bearer ' + accessToken
      },
      form: {
        danceability: attributes.danceability
      },
      json: true
    };

    var songs = [];
    request.get(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {
        body.tracks.forEach(function(e) {
          songs.push(e.id);
        });
        callback(songs);
      } else {
        console.log(response.statusCode);
        console.log(error);
      }
    });
  };

  var getNext3Songs = function(accessToken, ownerId, playlist, callback) {
    console.log('in getNext3Songs');
    var authOptions = {
      url: 'https://api.spotify.com/v1/users/' + ownerId + '/playlists/' + playlist + '/tracks?limit=3',
      headers: {
        'Authorization': 'Bearer ' + accessToken
      }
    };
    console.log(authOptions);
    var next = [];
    request.get(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {
        console.log("Our next 3 songs body");
        body = JSON.parse(body);
        console.log(body.items);
        body.items.forEach(function(e) {
          next.push(e.track.id);
        });
        callback(next);
      } else {
        console.log(response.statusCode);
        console.log(error);
        console.log(body);
      }
    });
  };

  exports.updatePlaylist = function(accessToken, songs, ownerId, playlist, callback) {
    // First we should get the next 3 songs in the playlist to keep
    console.log("in updatePlaylist");
    //getNext3Songs(accessToken, ownerId, playlist, function(next) {
    //songs = next.concat(songs);
    songs = songs.map(function(song){
      return 'spotify:track:'+song;
    })
    var authOptions = {
      url: 'https://api.spotify.com/v1/users/'+ownerId+'/playlists/'+playlist+'/tracks',
      headers: {
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type':'application/json'
      },
      body: JSON.stringify({
        uris:songs
      }),
      dataType:'json'
    };
    console.log(authOptions);
    request.put(authOptions, function(error, response, body) {
      if (!error && (response.statusCode === 201)) {
        callback(body.id);
      } else {
        console.log(response.statusCode);
        console.log(error);
        console.log(body);
      }
    });
    //});
  };

  exports.getMyInfo = function(accessToken, callback) {
    var authOptions = {
      url: 'https://api.spotify.com/v1/me',
      headers: { 'Authorization': 'Bearer ' + accessToken },
      json: true
    };
    request.get(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {
        callback(body.display_name, body.id);
      } else {
        console.log(response.statusCode);
        console.log(error);
      }
    });
  };

  exports.createPlaylist = function(user_id,access_token,name,callback){
    var authOptions = {
      url: 'https://api.spotify.com/v1/users/'+user_id+'/playlists',
      headers: {
        'Authorization': 'Bearer ' + access_token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({'name':name, 'public': false}),
      dataType:'json'
    };
    request.post(authOptions, function(error, response, body) {
      if (!error && (response.statusCode === 200 ||response.statusCode === 201)) {
        body = JSON.parse(body);
        callback(body.id);
      } else {
        console.log(response.statusCode);
        console.log(error);
      }
    });
  };

	// exports.addTrack(id, playlist, tracks, callback) {
	//   // requests.params.tracks should be a comma-separated list of Spotify Track URIs
	//   if (id == null)
	//     return {error: "missing id"};
	//   if (playlist == null)
	//     return {error: "missing playlist id"};
  //
	//   var authOptions = {
	//     url: 'https://api.spotify.com/v1/users/' + id + '/playlists/' + playlist + '/tracks',
	//     headers: {
	//       'Authorization': accessToken,
	//       'Content-Type': 'application/json'
	//     },
	//     form: {
	//       uris: tracks
	//     },
	//     json: true
	//   };
  //
	//   request.get(authOptions, function(error, response, body) {
	//     console.log("Here's what addTrack returned:");
	//     if (!error && response.statusCode === 201) {
	//       console.log("success");
  //       callback("success");
	//     } else {
	//       console.log(response.statusCode);
	//       console.log(error);
  //       callback(error);
	//     }
	//   });
	// });

	// Create a playlist
	// /v1/users/{user_id}/playlists

	// Modify a playlist
	// /v1/users/{user_id}/playlists/{playlist_id}/tracks

	// Change a playlist's details
	// /v1/users/{user_id}/playlists/{playlist_id}

	// Get recommendations based on seeds
	// /v1/recommendations
  exports.isLoaded = true;
};
