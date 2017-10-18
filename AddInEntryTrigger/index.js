var jwt = require('jsonwebtoken');

module.exports = function (context, req) {
    context.log('Requested Add-in entry.');

    var decoded = jwt.decode(req.headers['x-ms-token-aad-id-token']);

    context.log(JSON.stringify(decoded));

    context.res = {
	body: "Oh, hey world"
    };
    context.done();
};
