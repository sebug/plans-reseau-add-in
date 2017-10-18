var jwt = require('jsonwebtoken');
var request = require('request');

var keysUrl = 'https://login.microsoftonline.com/sebutech.onmicrosoft.com/discovery/v2.0/keys?p=b2c_1_siupin';

module.exports = function (context, req) {
    context.log('Requested Add-in entry.');

    var token = req.headers['x-ms-token-aad-id-token'];

    request(keysUrl, function (error, response, body) {

	var decoded = jwt.decode(token, { complete: true });

	var kid = decoded.header.kid;

	var keysObj = JSON.parse(body);
	var k = keysObj.keys.filter(function (k2) {
	    k2.kid == kid;
	});

	if (!k) {
	    context.log('Was not able to find key to validate JWT signature');
	    context.res = {
		status: 500,
		body: 'Was not able to find key to validate JWT signature'
	    };
	    context.done();
	} else {
	    try {
		decoded = jwt.verify(token, k);
	    } catch (e) {
		context.log(JSON.stringify(e));
		context.res = {
		    status: 500,
		    body: JSON.stringify(e)
		};
		context.done();
	    }
	    if (decoded) {
		context.log(JSON.stringify(decoded));

		context.res = {
		    body: "Oh, hey world"
		};
		context.done();
	    }
	}
    });
};
