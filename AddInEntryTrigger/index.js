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

function getCoursesByAuthorizedTypes(log, authorizedCourseTypes, callback) {

    if (authorizedCourseTypes.length <= 0) {
	callback([]);
    }
    
    let connectionString = process.env.AzureWebJobsStorage;

    let tableService = azureStorage.createTableService(connectionString);
    tableService.createTableIfNotExists('course', function () {
	var baseQuery = new azureStorage.TableQuery()
	    .top(100);
	var query = baseQuery;
	var hasAny = authorizedCourseTypes.filter(function (ct) {
	    return ct.CourseType === 'Any';
	}).length > 0;

	var i;
	var queryString = '';
	if (!hasAny) {
	    for (i = 0; i < authorizedCourseTypes.length; i += 1) {
		queryString += 'PartitionKey eq \'' + authorizedCourseTypes[i] + '\'';
		if (i < authorizedCourseTypes.length - 1) {
		    queryString += ' OR ';
		}
	    }
	    query = query.where(queryString);
	}
	tableService.queryEntities('course', query, null, function (error, result, response) {
	    if (error) {
		log(JSON.stringify(error));
		callback([]);
	    } else {
		callback(result.entries.map(function (e) {
		    return {
			CourseType: e.PartitionKey._,
			Number: e.RowKey._,
			FromDate: e.FromDate._,
			ToDate: e.ToDate._,
			Name: e.Name._
		    };
		}));
	    }
	    
	});
    });
}


module.exports = function (context, req) {
    context.log('Requested Add-in entry.');

    var token = req.headers['x-ms-token-aad-id-token'];
    var decoded = jwt.decode(token);

    getAuthorizedCourseTypes(decoded.sub, context.log, function (authorizedCourseTypes) {
	getCoursesByAuthorizedTypes(context.log, authorizedCourseTypes, function (courses) {
	    context.res = {
		body: courses
	    };
	    context.done();
	});
    });
};
