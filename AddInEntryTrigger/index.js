var jwt = require('jsonwebtoken');
var request = require('request');
var getPem = require('rsa-pem-from-mod-exp');

var keysUrl = 'https://login.microsoftonline.com/sebutech.onmicrosoft.com/discovery/v2.0/keys?p=b2c_1_siupin';

function fetchKeys(log, successCallback, errorCallback) {
    // Be a good citizen - timeout
    request(keysUrl, { timeout: 1000 }, function (error, response, body) {
	if (error) {
	    log(error);
	    errorCallback(error);
	} else {
	    successCallback(body);
	}
    });
}

module.exports = function (context, req) {
    context.log('Requested Add-in entry.');

    var token = req.headers['x-ms-token-aad-id-token'];

    fetchKeys(context.log, function (body) {
	var pem;
	var decoded = jwt.decode(token, { complete: true });

	var kid = decoded.header.kid;

	context.log(kid);

	var keysObj = JSON.parse(body);
	var k = keysObj.keys.filter(function (k2) {
	    return k2.kid == kid;
	})[0];

	if (!k) {
	    context.log('Was not able to find key to validate JWT signature');
	    context.res = {
		status: 500,
		body: 'Was not able to find key to validate JWT signature'
	    };
	    context.done();
	} else {
	    try {
		pem = getPem(k.n, k.e);
		context.log(token);
		context.log(pem);
		decoded = jwt.verify(token, pem);
	    } catch (e) {
		context.log(e);
		decoded = null;
		context.res = {
		    status: 500,
		    body: e
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
    }, function (error) {
	context.res = {
	    status: 500,
	    body: 'Timed out when trying to fetch keys' + JSON.stringify(error)
	};
	context.done();
    });
};
