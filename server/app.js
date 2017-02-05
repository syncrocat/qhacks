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
	    var id = request.params.id;
	    var macAddresses = request.body.addresses;

	   	if(id == null || macAddresses == null){
			console.log("bad list");
			var obj = { error : "missing parameter"};

		    response.send(JSON.stringify(obj));
		    return;
		}
		console.log('macAddresses:');
		console.log(macAddresses);
		response.send(JSON.stringify({success:true}));

		var user_router_rel_collection = database.collection('user_router_rel');
		user_router_rel_collection.remove({'router_id':id}).then(function(){
			user_router_rel_collection.insertOne({'router_id':id, 'mac_array':macAddresses}).then(function(){
				console.log("id:"+id);
			    var router = exports.getRouterByID(id).then(function(data) {
			    	var owner_mac = data.owner_mac;
			    	console.log("ownerId:"+owner_mac);
			    	exports.getUserByMAC(owner_mac).then(function(data) {
			    		var accessToken = data.access_token;
			    		var refreshToken = data.refresh_token;
			    		console.log("accessToken:"+accessToken);
			    		console.log(spotify.refreshPartyToken);
			    		console.log("A:" + spotify.isLoaded);
			    		console.log("about to send " + owner_mac + " and " + refreshToken);
              spotify.refreshPartyToken(refreshToken, function(accessToken) {
                console.log("and we got back the access token");
                console.log(accessToken);
                exports.updateUserAccessToken(owner_mac, accessToken);
                exports.compileArtistList(id);
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
  	console.log('does accessToken update?');
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

	exports.addRouter = function(id, owner_mac){
		var collection = database.collection('routers');
		var router = {
			"router_id":id,
			"owner_mac":owner_mac
		};
		collection.remove({'router_id':id});
	    collection.insertOne(router);
	    return router;
	};

	exports.getRouterUserListByID = function(id){
		var collection = database.collection('user_router_rel');
		return collection.findOne({'router_id':id});
	};

	exports.compileArtistList = function(id){
		var routerCollection = database.collection('user_router_rel');
		var usersCollection = database.collection('users');
		var users = [];
		console.log("there");
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
              console.log("for user:"+i);
              for (var j = 0; j < users[i].artists.length; j++) {
                var artist = users[i].artists[j];
                if(typeof artists[artist] !== 'undefined'){
                  artists[artist] += 1;
                  total += 1;
                }else{
                  artists[artist] = 0;
                }
              };
            };
            console.log("artists:");
            console.log(artists);
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
            console.log("the five seeds:");
            console.log(results);
            //send 5

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
