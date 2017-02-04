exports.load = function(
    app,
    bodyParser,
    crypto,
    express,
    https,
    request,
    localtunnel
) {
    const VALIDATION_TOKEN  = "_dj_spot_verify";
    const APP_SECRET        = "EAAF3he7lEWwBAFMeF4IE0Y5HfdRSyNDjmXvv9BgWw0Fpt7eXvL2oaICZBSG6WLCsU40yzcolYrnkqfZCrka31dvoQMIEALth2XwjucWLZCqHPTDkFJ4xCO9wLQ0x5R1ShPMRRHmuGmuhZCVlYVqZC8iIaZBj6jnEZC4uWRYAiE67gZDZD"
    const PAGE_ACCESS_TOKEN = "EAAF3he7lEWwBAFMeF4IE0Y5HfdRSyNDjmXvv9BgWw0Fpt7eXvL2oaICZBSG6WLCsU40yzcolYrnkqfZCrka31dvoQMIEALth2XwjucWLZCqHPTDkFJ4xCO9wLQ0x5R1ShPMRRHmuGmuhZCVlYVqZC8iIaZBj6jnEZC4uWRYAiE67gZDZD"

    var tunnel = localtunnel(8080, {subdomain: "djspotbot"}, function(err, tunnel) {
        if (err) {
            throw new error("Cannot create localtunnel");
        }
        else {
            console.log(tunnel.url);
        }
    });
    tunnel.on('close', function() {});

    // VERIFY
    app.get('/fbbot/webhook', bodyParser.json({ verify: verifyRequestSignature }), function(req, res) {
        if (req.query['hub.mode']         === 'subscribe' &&
            req.query['hub.verify_token'] === VALIDATION_TOKEN) {

            console.log("Validating webhook");
            res.status(200).send(req.query['hub.challenge']);
        } else {
            console.error("Failed validation. Make sure the validation tokens match.");
            res.sendStatus(403);
        }
    });

    var users = {};
    var states = {
        ACCEPT_COMMAND: 0,
        ACCEPT_PARAM: 1,
    };

    // ALL WEBHOOK ENDPOINTS
    app.post('/fbbot/webhook', bodyParser.json({ verify: verifyRequestSignature }), function (req, res) {
        var data = req.body;

        if (data.object == 'page') {
            data.entry.forEach(function(pageEntry) {
                var pageID = pageEntry.id;
                var timeOfEvent = pageEntry.time;

                pageEntry.messaging.forEach(function(messagingEvent) {
                    if (messagingEvent.message) {
                        console.log(messagingEvent);

                        var message = messagingEvent.message.text.toLowerCase();
                        var user = (users[messagingEvent.sender.id] = users[messagingEvent.sender.id] || {
                            state: {
                                type: states.ACCEPT_COMMAND,
                                data: undefined,
                            },
                            id: messagingEvent.sender.id,
                            messages: [],
                        });

                        user.messages.push(message);

                        switch (user.state.type) {
                            case states.ACCEPT_PARAM:
                                if (user.state.data == "play") {
                                    /**
                                     * TODO: SEND TO SPOTIFY API
                                     */
                                    if (true)
                                    sendMessage("Adding " + message.toUpperCase() + " to the playlist.", user.id);

                                    user.state.type = states.ACCEPT_COMMAND;
                                    user.state.data = undefined;
                                }

                                break;
                            case states.ACCEPT_COMMAND:
                                if (/play/.test(message)) {
                                    user.state.type = states.ACCEPT_PARAM;
                                    user.state.data = "play";
                                    sendMessage("What song do you want to play?", user.id);
                                }
                                else {
                                    sendMessage("Not sure what you mean by that. To add a song to the playlist type 'play'.", user.id);
                                }

                                break;
                            default:
                                throw new error("Invalid state");
                                break;
                        }
                    }
                });
            });
        }

        res.sendStatus(200);
    });

    function sendMessage(message, sender) {
        request({
            uri: 'https://graph.facebook.com/v2.6/me/messages',
            qs: { access_token: PAGE_ACCESS_TOKEN },
            method: 'POST',
            json: {
                recipient: {
                    id: sender
                },
                message: {
                    text: message,
                    metadata: "DEVELOPER_DEFINED_METADATA"
                }
            }
        }, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var recipientId = body.recipient_id;
                var messageId = body.message_id;

                if (messageId) {
                    console.log("Successfully sent message with id %s to recipient %s", messageId, recipientId);
                } else {
                    console.log("Successfully called Send API for recipient %s", recipientId);
                }
            } else {
                console.error("Failed calling Send API", response.statusCode, response.statusMessage, body.error);
            }
        });
    }

    function verifyRequestSignature(req, res, buf) {
        var signature = req.headers["x-hub-signature"];

        if (!signature) {
            // For testing, let's log an error. In production, you should throw an
            // error.
            console.error("Couldn't validate the signature.");
        } else {
            var elements = signature.split('=');
            var method = elements[0];
            var signatureHash = elements[1];

            var expectedHash = crypto.createHmac('sha1', APP_SECRET)
            .update(buf)
            .digest('hex');

            if (signatureHash != expectedHash) {
                throw new Error("Couldn't validate the request signature.");
            }
        }
    }
};
