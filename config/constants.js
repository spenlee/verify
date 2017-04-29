module.exports = {
  'Answer': {
    'yes': 0,
    'no': 1,
    'uncertain': 2
  },
  'Source': {
    'Source1': 0,
    'Source2': 1,
    'SourceOther': 2
  },
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
  'Error': {
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