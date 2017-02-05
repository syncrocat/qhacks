exports.load = function(
    app,
    bodyParser,
    express,
    https,
    mongodb,
    request,
    spotify
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
		user_router_rel_collection.remove({'router_id':id});
		user_router_rel_collection.insertOne(macAddresses);
	    var router = exports.getRouterByID(id).then(function(data) {
	    	var ownerId = data.owner_spotify_id;
	    	exports.getUserByID(ownerId).then(function(data) {
	    		var accessToken = data.access_token;
	    		var refreshToken = data.refresh_token;
	    		spotify.refreshPartyTokenfunction(ownerId, refreshToken, function(accessToken) {
	    			exports.updateUserAccessToken(ownerId, accessToken);
	    			// Now update the spotify playlist
	    		});
	    	});
	    });
	});

	exports.addUser = function(display_name, id, access_token, refresh_token, mac, top_50){
		var user = {
			"spotify_id":id,
			"display_name":display_name,
			"access_token":access_token,
			"refresh_token":refresh_token,
			"mac":mac,
			"top_50":top_50
		};

		var collection = database.collection('users');
		collection.remove({'spotify_id':id});
	    collection.insertOne(user);
	    return user;
	}

  exports.updateUserAccessToken = function(ownerId, accessToken){
    var collection = database.collection('users');
	   collection.findOne({'spotify_id':id}).then(function(data){
       exports.addUser(data.display_name, data.id, access_token, data.refresh_token, data.mac, data.top_50);
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

	exports.getRouterUserListByID = function(id){
		var collection = database.collection('user_router_rel');
		return collection.findOne({'router_id':id});
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
