var jwt = require('jsonwebtoken');
var request = require('request');
var azureStorage = require('azure-storage');

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
    var decoded = jwt.decode(token);
    
    getAuthorizedCourseTypes(decoded.sub, context.log, function (authorizedCourseTypes) {
		    getCourseByNumber(context.log, authorizedCourseTypes, '1234', function (courses) {
			context.res = {
			    body: courses
			};
			context.done();
		    });
    });
};
