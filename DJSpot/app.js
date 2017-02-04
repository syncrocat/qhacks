exports.load = function(
    app,
    bodyParser,
    express,
    https,
    request,
    config,
    querystring,
    cookieParser,
    server,
    spotify
) {
    var client_id = '294422f175f2404ca3be4840769aea24'; // Your client id
	var client_secret = config.clientSecret;
	var redirect_uri = 'https://djspotbot.localtunnel.me/callback'; // Your redirect uri

	/**
	 * Generates a random string containing numbers and letters
	 * @param  {number} length The length of the string
	 * @return {string} The generated string
	 */
	var generateRandomString = function(length) {
	  var text = '';
	  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

	  for (var i = 0; i < length; i++) {
	    text += possible.charAt(Math.floor(Math.random() * possible.length));
	  }
	  return text;
	};

	var stateKey = 'spotify_auth_state';

	app.use('/home', express.static(__dirname +'/public/'));

	//app.get(express.static('public')).use(cookieParser());

	app.get('/login', function(req, res) {

	  console.log(req.query);

	  var state = generateRandomString(16);
	  res.cookie(stateKey, state);

	  // your application requests authorization
	  var scope = 'user-read-private user-read-email user-top-read';
	  res.redirect('https://accounts.spotify.com/authorize?' +
	    querystring.stringify({
	      response_type: 'code',
	      client_id: client_id,
	      scope: scope,
	      redirect_uri: redirect_uri,
	      state: state
	    }));
	});

	app.get('/callback', function(req, res) {

	  // your application requests refresh and access tokens
	  // after checking the state parameter

	  var code = req.query.code || null;
	  var state = req.query.state || null;
	  //var storedState = req.cookies ? req.cookies[stateKey] : null;

	  if (state === null /*|| state !== storedState*/) {
	    res.redirect('/#' +
	      querystring.stringify({
	        error: 'state_mismatch'
	      }));
	  } else {
	    res.clearCookie(stateKey);
	    var authOptions = {
	      url: 'https://accounts.spotify.com/api/token',
	      form: {
	        code: code,
	        redirect_uri: redirect_uri,
	        grant_type: 'authorization_code'
	      },
	      headers: {
	        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
	      },
	      json: true
	    };

	    request.post(authOptions, function(error, response, body) {
	      if (!error && response.statusCode === 200) {

	        var access_token = body.access_token,
	            refresh_token = body.refresh_token;

	        var options = {
	          url: 'https://api.spotify.com/v1/me',
	          headers: { 'Authorization': 'Bearer ' + access_token },
	          json: true
	        };

          spotify.userTopSongs(access_token, function(top_50) {
            server.addUser(display_name, id, access_token, refresh_token, mac, top_50);
          });

	        // we can also pass the token to the browser to make requests from there
	        res.redirect('/goodJob');
	      } else {
	        res.redirect('/badJob');
	      }
	    });
	  }
	});

	app.get('/refresh_token', function(req, res) {

	  // requesting access token from refresh token
	  var refresh_token = req.query.refresh_token;
	  var authOptions = {
	    url: 'https://accounts.spotify.com/api/token',
	    headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
	    form: {
	      grant_type: 'refresh_token',
	      refresh_token: refresh_token
	    },
	    json: true
	  };

	  request.post(authOptions, function(error, response, body) {
	    if (!error && response.statusCode === 200) {
	      var access_token = body.access_token;
	      res.send({
	        'access_token': access_token
	      });
	    }
	  });
	});
};
