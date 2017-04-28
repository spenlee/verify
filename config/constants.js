module.exports = {
    // 'user': {
    //     'validGET': {'status': 200, 'message': 'OK'},
    //     'validOptions': {'status': 200, 'message': 'OK', 'options': ['GET', 'POST', 'OPTIONS']},
    //     'validCreated': {'status': 201, 'message': 'User added'},
    //     'validUpdated': {'status': 200, 'message': 'User updated'},
    //     'validDeleted': {'status': 200, 'message': 'User deleted'},
    //     '404': {'status': 404, 'message': 'Not Found'},
    //     'validationError': {'status': 500, 'message': 'Validation Error:'},
    //     'invalidNameRequired': {'status': 500, 'message': 'A name is required!'},
    //     'invalidEmailRequired': {'status': 500, 'message': 'An email is required!'},
    //     'invalidEmailDuplicate': {'status': 500, 'message': 'This email already exists'},
    //     'notFound': {'status': 404, 'message': 'User not found'}
    // },
    // 'message': {
    //     'validGET': {'status': 200, 'message': 'OK'}
    // },
    // '200': {'status': 200, 'message': 'OK'},
    // '404': {'status': 404, 'message': 'Not Found'},

    'invalidEvent': {
      'status': 400,
      'message': 'Need Event!'
    },
    'invalidTweet': {
      'status': 400,
      'message': 'Need Tweet!'
    },
    'nameRequired': {
      'status': 400,
      'message': 'Name required!'
    },
    'emailRequired': {
      'status': 400,
      'message': 'Email required!'
    },
    'duplicateEmail': {
      'status': 400,
      'message': 'Duplicate email!'
    },
    'ObjectIdCastError': {'status': 500, 'message': 'ObjectId CastError'},
    'MongoParseError': {'status': 500, 'message': 'MongoError failed to parse'},
    'OK' : {
      'status': 200,
      'message': 'OK'
    },
    'Error' : {
      'status': 400,
      'message': 'Error'
    },
    'NotFound': {
      'status': 404,
      'message': 'Not Found'
    },
    'InternalError' : {
      'status': 500,
      'message': 'InternalError'
    },
    'isValidString': function(str) {
      return str !== null && str !== undefined && str !== '';
    },
    'isValid': function(o) {
      return o !== null && o !== undefined && o !== '';
    },
    'responseObject': function() {
      this.status = 0;
      this.body = {
        'message': '',
        'data': []
      };
    }
}