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
                exports.compileGenreList(id);
              });
			    	});
			    });
			});
		});
	});

	exports.addUser = function(display_name, id, access_token, refresh_token, mac, genres){
		var user = {
			"spotify_id":id,
			"display_name":display_name,
			"access_token":access_token,
			"refresh_token":refresh_token,
			"mac":mac,
			"genres":genres
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
      exports.addUser(data.display_name, data.id, accessToken, data.refresh_token, data.mac, data.top_50);
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
	}

	exports.getRouterUserListByID = function(id){
		var collection = database.collection('user_router_rel');
		return collection.findOne({'router_id':id});
	}

	exports.compileGenreList = function(id){
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
            var genres = {"acoustic":0, "afrobeat":0, "alt-rock":0, "alternative":0, "ambient":0, "anime":0, "black-metal":0, "bluegrass":0, "blues":0, "bossanova":0, "brazil":0, "breakbeat":0, "british":0, "cantopop":0, "chicago-house":0, "children":0, "chill":0, "classical":0, "club":0, "comedy":0, "country":0, "dance":0, "dancehall":0, "death-metal":0, "deep-house":0, "detroit-techno":0, "disco":0, "disney":0, "drum-and-bass":0, "dub":0, "dubstep":0, "edm":0, "electro":0, "electronic":0, "emo":0, "folk":0, "forro":0, "french":0, "funk":0, "garage":0, "german":0, "gospel":0, "goth":0, "grindcore":0, "groove":0, "grunge":0, "guitar":0, "happy":0, "hard-rock":0, "hardcore":0, "hardstyle":0, "heavy-metal":0, "hip-hop":0, "holidays":0, "honky-tonk":0, "house":0, "idm":0, "indian":0, "indie":0, "indie-pop":0, "industrial":0, "iranian":0, "j-dance":0, "j-idol":0, "j-pop":0, "j-rock":0, "jazz":0, "k-pop":0, "kids":0, "latin":0, "latino":0, "malay":0, "mandopop":0, "metal":0, "metal-misc":0, "metalcore":0, "minimal-techno":0, "movies":0, "mpb":0, "new-age":0, "new-release":0, "opera":0, "pagode":0, "party":0, "philippines-opm":0, "piano":0, "pop":0, "pop-film":0, "post-dubstep":0, "power-pop":0, "progressive-house":0, "psych-rock":0, "punk":0, "punk-rock":0, "r-n-b":0, "rainy-day":0, "reggae":0, "reggaeton":0, "road-trip":0, "rock":0, "rock-n-roll":0, "rockabilly":0, "romance":0, "sad":0, "salsa":0, "samba":0, "sertanejo":0, "show-tunes":0, "singer-songwriter":0, "ska":0, "sleep":0, "songwriter":0, "soul":0, "soundtracks":0, "spanish":0, "study":0, "summer":0, "swedish":0, "synth-pop":0, "tango":0, "techno":0, "trance":0, "trip-hop":0, "turkish":0, "work-out":0, "world-music":0};
            var total = 0;
            //for each users combine
            for (var i = 0; i < users.length; i++) {
              if(users[i]==null)
                continue;
              Object.keys(users[i].genres).map(function(key){
                if(typeof genres[key] !== 'undefined'){
                  genres[key] += parseInt(users[i].genres[key]);
                  total += parseInt(users[i].genres[key]);
                }
              });
            }
            //rnd weighted 5
            var goal1 = parseInt(Math.floor(Math.random()*total));
            var goal2 = parseInt(Math.floor(Math.random()*total));
            var goal3 = parseInt(Math.floor(Math.random()*total));
            var goal4 = parseInt(Math.floor(Math.random()*total));
            var goal5 = parseInt(Math.floor(Math.random()*total));
            var results = []
            Object.keys(genres).map(function(key){
              goal1 -= genres[key];
              if(goal1<0){
                results.push(key);
                goal1 = total*2;
              }

              goal2 -= genres[key];
              if(goal2<0){
                results.push(key);
                goal2 = total*2;
              }

              goal3 -= genres[key];
              if(goal3<0){
                results.push(key);
                goal3 = total*2;
              }

              goal4 -= genres[key];
              if(goal4<0){
                results.push(key);
                goal4 = total*2;
              }

              goal5 -= genres[key];
              if(goal5<0){
                results.push(key);
                goal5 = total*2;
              }
              if(results.length == 5){
                break;
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
