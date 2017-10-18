var jwt = require('jsonwebtoken');
var request = require('request');

var keysUrl = 'https://login.microsoftonline.com/sebutech.onmicrosoft.com/discovery/v2.0/keys?p=b2c_1_siupin';

module.exports = function (context, req) {
    context.log('Requested Add-in entry.');

    var token = req.headers['x-ms-token-aad-id-token'];
    context.log(token);

    request(keysUrl, function (error, response, body) {

	var decoded = jwt.decode(token, { complete: true });

	var keysObj = JSON.parse(body);
	var k = keysObj.keys[0].n;

	

	context.log(JSON.stringify(decoded));

	context.res = {
	    body: "Oh, hey world"
	};
	context.done();
    });
};
