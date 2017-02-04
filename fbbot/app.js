exports.load = function(
    app,
    bodyParser,
    crypto,
    express,
    https,
    request
) {
    const VALIDATION_TOKEN  = "_dj_spot_verify";
    const APP_SECRET        = "TODO"

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

    // ALL WEBHOOK ENDPOINTS
    app.post('/fbbot/webhook', bodyParser.json({ verify: verifyRequestSignature }), function (req, res) {
        var data = req.body;

        if (data.object == 'page') {
            data.entry.forEach(function(pageEntry) {
                var pageID = pageEntry.id;
                var timeOfEvent = pageEntry.time;

                pageEntry.messaging.forEach(function(messagingEvent) {
                    if (messagingEvent.message) {
                        console.log("Message");
                        console.log(messagingEvent.message);
                    }
                });
            });
        }

        res.sendStatus(200);
    });

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
