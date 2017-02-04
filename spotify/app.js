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
      console.log("Here's what topSongs returned:");
      if (!error && response.statusCode === 200) {
        body.items.forEach(function(e) {
          console.log(e.id);
          top_50.push(e.id);
        });
        return top_50;
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
};
