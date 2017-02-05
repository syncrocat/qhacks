exports.load = function(
    app,
    bodyParser,
    express,
    https,
    mongodb,
    request
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
	    var macAddresses = request.body.macAddresses;

	   	if(id == null || request.body.macAddresses == null){
			console.log("bad list");
			var obj = { error : "missing parameter"};

		    response.send(JSON.stringify(obj));
		    return;
		}
		console.log('macAddresses:');
		console.log(macAddresses);

		var user_router_rel_collection = database.collection('user_router_rel');
		user_router_rel_collection.remove({'router_id':id});
		user_router_rel_collection.insertOne(macAddresses);
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
