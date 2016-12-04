module.exports = {
    'user': {
        'validGET': {'status': 200, 'message': 'OK'},
        'validOptions': {'status': 200, 'message': 'OK', 'options': ['GET', 'POST', 'OPTIONS']},
        'validCreated': {'status': 201, 'message': 'User added'},
        'validUpdated': {'status': 200, 'message': 'User updated'},
        'validDeleted': {'status': 200, 'message': 'User deleted'},
        '404': {'status': 404, 'message': 'Not Found'},
        'validationError': {'status': 500, 'message': 'Validation Error:'},
        'invalidNameRequired': {'status': 500, 'message': 'A name is required!'},
        'invalidEmailRequired': {'status': 500, 'message': 'An email is required!'},
        'invalidEmailDuplicate': {'status': 500, 'message': 'This email already exists'},
        'notFound': {'status': 404, 'message': 'User not found'}
    },
    '200': {'status': 200, 'message': 'OK'},
    '404': {'status': 404, 'message': 'Not Found'},
    'errorObjectIdCastError': {'status': 500, 'message': 'ObjectId CastError'},
    'errorMongoErrorParse': {'status': 500, 'message': 'MongoError failed to parse'},
    'isValidString': function(str) {
    	return str !== null && str !== undefined && str !== '';
    },
    'responseObject': function() {
    	this.status = 0;
    	this.body = {
    		'message': '',
    		'data': []
    	};
    }
}