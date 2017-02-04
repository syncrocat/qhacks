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

    //adds or updates a router object
	app.post("/routers/:id",function(request, response){
	    var id = request.params.id;

		if(id == null || request.body.access_token == null ||
			request.body.display_name == null){
			console.log("bad router");
			var obj = { error : "missing parameter"};

		    response.send(JSON.stringify(obj));
		    return;
		}

		var router = {
			"access_token": request.body.access_token,
			"display_name" : request.body.display_name,
			"router_id" : id
		};

		var collection = database.collection('routers');
		collection.remove({'router_id':id});
	    collection.insertOne(router)
	    .then(function(result) {
	        console.log("Saved");
		    response.send(JSON.stringify({success:true}));
	    });
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

		var user_router_rel_collection = database.collection('user_router_rel');
		var users_collection = database.collection('users');

		user_router_rel_collection.remove({'router_id':id});
		for (var i = 0; i < macAddresses.length; i++) {
			users_collection.findOne({'mac_address':macAddresses[i]}).then(function(result) {
		        var new_rel = {
					router_id: id,
					spotify_id: result.spotify_id
				};
				user_router_rel_collection.insertOne(new_rel);
		    });
		}
	});

	//adds or updates a user
	app.post("/users/:id",function(request,response){
		var id = request.params.id;
		if(id == null || request.body.macAddress == null ||
			request.body.display_name == null){
			console.log("bad user");
			var obj = { error : "missing parameter"};

		    response.send(JSON.stringify(obj));
		    return;
		}

		var user = {
			"mac_address": request.body.macAddress,
			"display_name" : request.body.display_name,
			"access_token" : request.body.access_token,
			"spotify_id" : id
		};

		var collection = database.collection('users');
		collection.remove({'spotify_id':id});
	    collection.insertOne(user)
	    .then(function(result) {
	        console.log("Saved");
		    response.send(JSON.stringify({success:true}));
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
};
