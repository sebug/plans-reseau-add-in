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
	var baseQuery = new azureStorage.TableQuery()
	    .top(100);
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

	log(queryString);
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

function getCourseLines(log, number, callback) {
    let connectionString = process.env.AzureWebJobsStorage;

    let tableService = azureStorage.createTableService(connectionString);

    tableService.createTableIfNotExists('courseLines', function () {
	var query = new azureStorage.TableQuery()
	    .top(100)
	    .where('PartitionKey eq ?', number);
	tableService.queryEntities('courseLines', query, null, function (error, result, response) {
	    callback(result.entries.map(function (l) {
		return {
		    Number: l.PartitionKey && l.PartitionKey._,
		    Identifier: l.RowKey && l.RowKey._,
		    Name: l.Name && l.Name._,
		    Function: l.Function && l.Function._
		};
	    }));
	});
    });
}


module.exports = function (context, req) {
    context.log('Requested course lines entry ' + req.query.number);

    var userID = req.headers['x-ms-client-principal-id'];
    
    getAuthorizedCourseTypes(userID, context.log, function (authorizedCourseTypes) {
	getCourseByNumber(context.log, authorizedCourseTypes, req.query.number, function (course) {
	    if (course) {
		getCourseLines(context.log, course.Number, function (lines) {
		    context.res = {
			body: lines
		    };
		    context.done();
		});
	    } else {
		context.log('Did not find course (can happen when for example we are not authorized)');
		context.res = {
		    body: []
		};
		context.done();
	    }
	});
    });
};
