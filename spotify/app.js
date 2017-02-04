exports.load = function(
    app,
    bodyParser,
    express,
    https,
    mongodb,
    config,
    SpotifyWebApi,
    request,
    server
) {
	var clientId =  "294422f175f2404ca3be4840769aea24";
	var clientSecret = config.clientSecret;
	app.get("/users/:id/topSongs", function(request, response) {
	  var id = request.params.id;
	  if (id == null) {
	    var obj = { error: "missing id"};
	    response.send(JSON.stringify(obj));
	    return;
	  }
	  var numSongs = request.params.numSongs;
	  if (numSongs == null || numSongs < 1 || numSongs > 50) {
	    var obj = { error: "invalid numSongs" };
	    response.send(JSON.stringify(obj));
	    return;
	  }
	  var accessToken = request.params.accessToken;
	  if (accessToken == null)
	    return response.send(JSON.stringify({error: "missing access token"}));

	  var authOptions = {
	    url: 'https://api.spotify.com/v1/users/' + id + '/top/tracks',
	    headers: {
	      'Authorization': accessToken
	    },
	    form: {
	      limit: numSongs
	    },
	    json: true
	  };

	  request.get(authOptions, function(error, response, body) {
	    console.log("Here's what topSongs returned:");
	    if (!error && response.statusCode === 200) {
	      console.log(body);
	      console.log("Top " + numSongs + " track IDs:");
	      body.items.forEach(function(e) {
	        console.log(e.id);
	      });
	    } else {
	      console.log(response.statusCode);
	      console.log(error);
	    }
	  });
	});

	app.get("/users/:id/addTrack", function(request, response) {
	  // requests.params.tracks should be a comma-separated list of Spotify Track URIs
	  var id = requests.params.id;
	  if (id == null)
	    return response.send(JSON.stringify({error: "missing id"}));
	  var playlist = requests.params.playlistId;
	  if (playlist == null)
	    return response.send(JSON.stringify({error: "missing playlist id"}));
	  var tracks = requests.params.tracks;
	  var authOptions = {
	    url: 'https://api.spotify.com/v1/users/' + id + '/playlists/' + playlist + '/tracks',
	    headers: {
	      'Authorization': accessToken,
	      'Content-Type': 'application/json'
	    },
	    form: {
	      uris: tracks
	    },
	    json: true
	  };

	  request.get(authOptions, function(error, response, body) {
	    console.log("Here's what addTrack returned:");
	    if (!error && response.statusCode === 201) {
	      console.log("success");
	    } else {
	      console.log(response.statusCode);
	      console.log(error);
	    }
	  });
	});

	// Create a playlist
	// /v1/users/{user_id}/playlists

	// Modify a playlist
	// /v1/users/{user_id}/playlists/{playlist_id}/tracks

	// Change a playlist's details
	// /v1/users/{user_id}/playlists/{playlist_id}

	// Get recommendations based on seeds
	// /v1/recommendations
};
