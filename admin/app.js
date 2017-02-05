exports.load = function(
    app,
    express,
    https,
    request,
    mongodb
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

    // Grab all router preference data
    app.get ('/admin/:id', function(res, req, next) {
        var id = res.params.id;

        if (typeof id === "undefined") {
            res.send(JSON.stringify({
                error: "Undefined parameters",
            }));
        }
        else {
            var router_prefs = database.collection('router_prefs');
            router_prefs
            .findOne({id: id})
            .then(function(router) {
                res.send(JSON.stringify({
                    preferences: router ? router.preferences : false,
                }));
            });
        }
    });

    // Update any preference parameters per each call
    app.post('/admin/:id', function(res, req, next) {
        var preferences = res.body.preferences;
        var id          = res.params.id;

        if (typeof preferences === "undefined" &&
            typeof id          === "undefined") {

            res.send(JSON.stringify({
                error: "Undefined parameters",
            }));
        }
        else {
            var router_prefs = database.collection('router_prefs');
            router_prefs
            .findOne({id: id})
            .then(function(router) {
                if (typeof router === "undefined") {
                    router_prefs
                    .insertOne({
                        id: id,
                        preferences: preferences,
                    })
                    .then(function(updated) {
                        res.send(JSON.stringify({
                            success: updated,
                        }));
                    });
                }
                else {
                    Object.keys(preferences).map(function(key) {
                        router.preferences[key] = preferences[key];
                    });

                    router_prefs
                    .updateOne({id: id}, {
                        $set: {
                            preferences: router.preferences,
                        }
                    })
                    .then(function(updated) {
                        res.send(JSON.stringify({
                            success: updated,
                        }));
                    });
                }
            });
        }
    });
};
