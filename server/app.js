exports.load = function(
    app,
    bodyParser,
    express,
    https,
    mongodb,
    request,
    spotify,
    async
) {
	var client = mongodb.MongoClient;
	var database;

	client.connect('mongodb://localhost:27017/qhacks', function (err, db) {
	    if (err) {
	        console.log('Unable to connect to the mongoDB server. Error:', err);
	    } else {
	        database = db;
	    }
	});

	//updates the list of users on a router
	app.post("/routers/:id/users",function(request, response){
    console.log("pi ping");
	    var id = request.params.id;
	    var macAddresses = request.body.addresses;

	   	if(id == null || macAddresses == null){
			console.log("bad list");
			var obj = { error : "missing parameter"};

		    response.send(JSON.stringify(obj));
		    return;
		}
		response.send(JSON.stringify({success:true}));

		var user_router_rel_collection = database.collection('user_router_rel');
		user_router_rel_collection.remove({'router_id':id}).then(function(){
			user_router_rel_collection.insertOne({'router_id':id, 'mac_array':macAddresses}).then(function(){
			    var router = exports.getRouterByID(id).then(function(data) {
			    	var owner_mac = data.owner_mac;
			    	exports.getUserByMAC(owner_mac).then(function(data) {
			    		var accessToken = data.access_token;
			    		var refreshToken = data.refresh_token;
              spotify.refreshPartyToken(refreshToken, function(accessToken) {
                exports.updateUserAccessToken(owner_mac, accessToken);
                exports.compileArtistList(id, accessToken, owner_mac);
              });
			    	});
			    });
			});
		});
	});

	exports.addUser = function(display_name, id, access_token, refresh_token, mac, artists){
		var user = {
			"spotify_id":id,
			"display_name":display_name,
			"access_token":access_token,
			"refresh_token":refresh_token,
			"mac":mac,
			"artists":artists
		};

		var collection = database.collection('users');
		collection.remove({'spotify_id':id});
	    collection.insertOne(user);
	    return user;
	}

  exports.updateUserAccessToken = function(owner_mac, accessToken){
    var collection = database.collection('users');
    collection.findOne({'mac':owner_mac}).then(function(data){
      exports.addUser(data.display_name, data.id, accessToken, data.refresh_token, data.mac, data.artists);
    });
  }

	exports.getUserByID = function(id){
		var collection = database.collection('users');
		return collection.findOne({'spotify_id':id});
	}

	exports.getUserByMAC = function(id){
		var collection = database.collection('users');
		return collection.findOne({'mac':id});
	}

	exports.getRouterByID = function(id){
		var collection = database.collection('routers');
		return collection.findOne({'router_id':id});
	}

  exports.addRouterPrefs = function(id, preferences){
    var collection = database.collection('router_prefs');
    var pref = {
      "id":id,
      "preferences":preferences
    };
    collection.remove({'id':id});
    collection.insertOne(pref);
  }

	exports.addRouter = function(id, owner_mac, playlist_id, owner_id, attributes){
		var collection = database.collection('routers');
		var router = {
			"router_id":id,
			"owner_mac":owner_mac,
      "playlist_id":playlist_id,
      "owner_id":owner_id,
      "attributes":attributes
		};
		collection.remove({'router_id':id});
	  collection.insertOne(router);

    collection = database.collection('router_prefs');
    var router_prefs = {
      "id":id,
      "preferences":{
        "acousticness":0.5,
        "danceability":0.9,
        "energy":0.7,
        "liveness":0.2,
        "valence":0.5,
        "popularity":0.7
      }
    };
    collection.remove({'id':id});
    collection.insertOne(router_prefs);
	 return router;
	};

  exports.updateAttributes = function(router_id, attributes){
    var collection = database.collection('routers');
    collection.findOne({'router_id':router_id}).then(function(router){
      exports.addRouter(router.router_id, router.owner_mac, router.playlist_id, router.owner_id, attributes);
    });
  }

  exports.getAttributes = function(router_id){
    return collection.findOne({'router_id':router_id});
  }

  app.get("/routers/:id/preferences",function(request, response){
    var id = request.params.id;
    var collection = database.collection('router_prefs');
    collection.findOne({'id':id}).then(function(data){
      response.send(JSON.stringify(data.preferences));
    });
  });

  app.post("/routers/:id/preferences",function(request, response){
    var preferences = request.body.preferences;
    var id = request.params.id;
    var collection = database.collection('router_prefs');
    collection.findOne({'id':id}).then(function(router){
      exports.addRouterPrefs(router.id, preferences);
    });
  });

	exports.getRouterUserListByID = function(id){
		var collection = database.collection('user_router_rel');
		return collection.findOne({'router_id':id});
	};

	exports.compileArtistList = function(id, accessToken, owner_mac){
		var routerCollection = database.collection('user_router_rel');
		var usersCollection = database.collection('users');
		var users = [];
		var queue = async.queue(function(task, callback) {
			usersCollection.findOne({'mac': task.mac}).then(function(user) {
				users.push(user);
				callback();
			});
		});

		routerCollection.findOne({'router_id':id}).then(function(router) {
			router.mac_array.map(function(mac) {
				queue.push({mac: mac}, function() {
					if (users.length == router.mac_array.length && users.length > 0) {
            //this works start
            var artists = {};
            var total = 0;
            //for each users combine
            for (var i = 0; i < users.length; i++) {
              if(users[i]==null)
                continue;
              console.log("for user:"+users[i].spotify_id);
              for (var j = 0; j < users[i].artists.length; j++) {
                var artist = users[i].artists[j];
                if(typeof artists[artist] !== 'undefined'){
                  artists[artist] += 1;
                }else{
                  artists[artist] = 1;
                }
                total += 1;
              };
            };
            //console.log("artists:");
            //console.log(artists);
            //rnd weighted 5
            var goal1 = parseInt(Math.floor(Math.random()*total));
            var goal2 = parseInt(Math.floor(Math.random()*total));
            var goal3 = parseInt(Math.floor(Math.random()*total));
            var goal4 = parseInt(Math.floor(Math.random()*total));
            var goal5 = parseInt(Math.floor(Math.random()*total));
            var results = []
            Object.keys(artists).map(function(key){
              if(results.length != 5){
                goal1 -= artists[key];
                if(goal1<0){
                  results.push(key);
                  goal1 = total*2;
                }

                goal2 -= artists[key];
                if(goal2<0){
                  results.push(key);
                  goal2 = total*2;
                }

                goal3 -= artists[key];
                if(goal3<0){
                  results.push(key);
                  goal3 = total*2;
                }

                goal4 -= artists[key];
                if(goal4<0){
                  results.push(key);
                  goal4 = total*2;
                }

                goal5 -= artists[key];
                if(goal5<0){
                  results.push(key);
                  goal5 = total*2;
                }
              }
            });
            //console.log("the five seeds:");
           // console.log(results);
            //send 5
            var joined = results.join();
            var attributesCollection = database.collection('router_prefs');
            attributesCollection.findOne({id:id}).then(function(attributeObj){
              var attributes = attributeObj.preferences;
              spotify.get20Seeded(accessToken, joined, attributes, function(songIDs){
                var collection = database.collection('routers');
                collection.findOne({'router_id':id}).then(function(rout){
                  spotify.updatePlaylist(accessToken, songIDs, rout.owner_id, rout.playlist_id, function(songIDs){
                    console.log("updated:");
                  })
                });
              });
            });
            //this works end
					}
				});
			});
		});
	}
/*
	//return list of current users
	app.get("/routers/:id/users",function(request,response){
		var id = request.params.id;
		if(id == null){
			var obj = { error : "missing id"};

		    response.send(JSON.stringify(obj));
		    return;
		}
		var user_router_rel_collection = database.collection('user_router_rel');
		user_router_rel_collection.find({'router_id':id}).then(function(result) {
			for (var i = 0; i < result.length; i++) {
				var users_collection = database.collection('users');
				var users = [];

				users_collection.findOne({'spotify_id':result[i].spotify_id}).then(function(result) {
					users.push(result);
				});
			}
		    response.send(JSON.stringify(users));
	    });
	});
	*/
};
