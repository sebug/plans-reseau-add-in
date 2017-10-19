var jwt = require('jsonwebtoken');
var request = require('request');
var getPem = require('rsa-pem-from-mod-exp');
var azureStorage = require('azure-storage');

var keysUrl = 'https://login.microsoftonline.com/sebutech.onmicrosoft.com/discovery/v2.0/keys?p=b2c_1_siupin';

function fetchKey(log, kid, successCallback, errorCallback) {
    let connectionString = process.env.AzureWebJobsStorage;

    let tableService = azureStorage.createTableService(connectionString);

    tableService.createTableIfNotExists('keyCache', function () {
	tableService.retrieveEntity('keyCache', 'prod', kid, function (error, result) {
	    if (!error) {
		log('Entry found');
		successCallback({
		    n: result.Modulus._,
		    e: result.Exponent._
		});
	    } else {
		log('Entry not found in cache, fetching');
		request(keysUrl, { timeout: 5000 }, function (error, response, body) {
		    if (error) {
			log(error);
			errorCallback(error);
		    } else {
			var keysObj = JSON.parse(body);
			var k = keysObj.keys.filter(function (k2) {
			    return k2.kid == kid;
			})[0];
			if (k) {
			    // Store in cache for next time
			    let item = {
				PartitionKey: 'prod',
				RowKey: kid,
				Modulus: k.n,
				Exponent: k.e
			    };
			    tableService.insertOrReplaceEntity('keyCache', item, function (error2) {
				if (error2) {
				    log(JSON.stringify(error2));
				}
			    });
			}
			successCallback(k);
		    }
		});
	    }
	});
    });
}

function getAuthorizedCourseTypes(userID, log, callback) {
    log('Getting authorized course types for ' + userID);
    let connectionString = process.env.AzureWebJobsStorage;

    let tableService = azureStorage.createTableService(connectionString);
    tableService.createTableIfNotExists('authorizedCourses', function () {
	var query = new azureStorage.TableQuery()
	    .top(100)
	    .where('PartitionKey eq ?',userID);
	tableService.queryEntities('authorizedCourses', query, null, function (error, result, response) {
	    if (error) {
		log(JSON.stringify(error));
		callback([]);
	    } else {
		log('Successfully queried');
		callback(result.entries.map(function (r) {
		    return {
			UserID: r.PartitionKey._,
			CourseType: r.RowKey._
		    };
		}));
	    }
	});
    });
}

function getCourseByNumber(log, authorizedCourseTypes, number, callback) {

    if (authorizedCourseTypes.length <= 0) {
	callback([]);
    }
    
    let connectionString = process.env.AzureWebJobsStorage;

    let tableService = azureStorage.createTableService(connectionString);
    tableService.createTableIfNotExists('course', function () {
	var query = baseQuery;
	var hasAny = authorizedCourseTypes.filter(function (ct) {
	    return ct.CourseType === 'Any';
	}).length > 0;

	var i;
	var queryString = 'RowKey eq ?';
	if (!hasAny) {
	    queryString += ' AND (';
	    for (i = 0; i < authorizedCourseTypes.length; i += 1) {
		queryString += 'PartitionKey eq \'' + authorizedCourseTypes[i] + '\'';
		if (i < authorizedCourseTypes.length - 1) {
		    queryString += ' OR ';
		}
	    }
	    queryString += ')';
	}
	query = query.where(queryString, number);
	tableService.queryEntities('course', query, null, function (error, result, response) {
	    if (error) {
		log(JSON.stringify(error));
		callback(null);
	    } else {
		callback(result.entries.map(function (e) {
		    return {
			CourseType: e.PartitionKey._,
			Number: e.RowKey._,
			FromDate: e.FromDate._,
			ToDate: e.ToDate._,
			Name: e.Name._
		    };
		})[0]);
	    }
	    
	});
    });
}


module.exports = function (context, req) {
    context.log('Requested course lines entry ' + JSON.stringify(req.headers));

    var token = req.headers['x-ms-token-aad-id-token'];
    var decoded = jwt.decode(token, { complete: true });
    var kid = decoded.header.kid;
    context.log(kid);
    
    fetchKey(context.log, kid, function (k) {
	var pem;


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
		getAuthorizedCourseTypes(decoded.sub, context.log, function (authorizedCourseTypes) {
		    getCourseByNumber(context.log, authorizedCourseTypes, '1234', function (courses) {
			context.res = {
			    body: courses
			};
			context.done();
		    });
		});
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
