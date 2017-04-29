var async = require('async');
var _ = require('lodash');

var Response = require('../models/response');
var User = require('../models/user');
var HIT = require('../models/hit');
var constants = require('../config/constants');

var mongoose = require('mongoose');

module.exports = function(router) {

  // define the route as baseRoute + /responses
  var responsesRoute = router.route('/responses');

  /*
  Get all responses
  GET /api/responses
  */
  responsesRoute.get(function(req, res, next) {
    var responseObj = new constants['responseObject']();
    // check query parameters
    // get all users from model
    var query = Response.find();
    // actually execute - mongoose
    query.exec()
    // success
      .then(function(result) {
        res.status(constants.OK.status);
        responseObj.body.message = constants.OK.message;
        responseObj.body.data = result;
        res.json(responseObj.body);
      })
    // error
      .catch(function(err) {
        responseObj.body.message = [];
        // ObjectId CastError
        if (err.name === 'CastError' && err.kind === 'ObjectId') {
          responseObj.status = constants.ObjectIdCastError.status;
          responseObj.body.message.push(constants.ObjectIdCastError.message);
        }
        // Mongo Parse Error
        if (err.name === 'MongoError') {
          responseObj.status = constants.MongoParseError.status;
          responseObj.body.message.push(constants.MongoParseError.message);
        }
        
        var errMsg = responseObj.body.message.join(", ");
        responseObj.body.message = errMsg;
        next(responseObj); // pass to error output
      });
  });

  /*
  Send a new response
  POST to /api/responses
  {
    "answer": Number, // 0: Yes, 1: No, 2: Uncertain
    "source": Number, // 0: Source1, 1: Source2, 2: SourceOther
    "citation": String, // Not Required
    "userID": String,
    "HITID": String
  }
  */
  responsesRoute.post(function(req, res, next) {  
    var responseObj = new constants['responseObject']();
    // validate needed response fields
    if (!constants.isValid(req.body.answer)
        || !constants.isValid(req.body.source)
        || !constants.isValidString(req.body.userID)
        || !constants.isValidString(req.body.HITID)) {
      responseObj.status = constants.Error.status;
      responseObj.body.message = {
        'answer': 'Number, required',
        'source': 'Number, required',
        'citation': 'String, not required',
        'userID': 'String, required',
        'HITID': 'String, required'
      };
      next(responseObj);
    }
    else {
      responseObj.body.message = {};
      // 1. create response
      // 2. add to associated HIT
      // 3. move HIT from current to past for User (can only respond to current HITs)
      async.waterfall([
        async.apply(createResponse, responseObj, req), // req.body params
        parallelHITUserModify
      ], function(err, result) {
        if (err !== null) {
          next(err);
        }
        else {
          // let the last operation deal with response
          res.status(result.status);
          res.send(result.body);
        }
      });
    }
  });

  /*
  POST response helper functions
  */
  function createResponse(responseObj, req, callback) {
    // access req body params
    var response = new Response({
      'answer': req.body.answer,
      'source': req.body.source,
      'citation': req.body.citation,
      'userID': req.body.userID,
      'HITID': req.body.HITID
    });

    // save the response
    response.save()
      .then(function(result) {
        responseObj.body.data = result;
        callback(null, responseObj, result); // pass Response object
      })
      .catch(function(err) {
        console.log(err);
        responseObj.body.message.response = err;
        responseObj.status = constants.Error.status;
        callback(responseObj);
      });
  };

  function parallelHITUserModify(responseObj, response, callback) {
    // 1. aggregating HIT info
    // 2. HIT from user current to past
    async.parallel([
      async.apply(modifyHIT, responseObj, response),
      async.apply(modifyUser, responseObj, response)
    ], function(err, result) {
      if (err !== null) {
        callback(err);
      }
      else {
        responseObj.status = constants.OK.status;
        responseObj.body.message = constants.OK.message;
        callback(null, responseObj);
      }
    });
  };

  function modifyHIT(responseObj, response, callback) {
    // 1. get HIT
    // 2. update HIT, aggregate info
    // 3. save HIT
    async.waterfall([
      async.apply(getHIT, responseObj, response.HITID),
      async.apply(updateHIT, response),
      saveHIT
    ], function(err, result) {
      if (err !== null) {
        callback(err);
      }
      else {
        callback(null);
      }
    });
  };

  function modifyUser(responseObj, response, callback) {
    // 1. get User
    // 2. update User events
    // 3. save User
    async.waterfall([
      async.apply(getUser, responseObj, response.userID),
      async.apply(updateUser, response.HITID),
      saveUser
    ], function(err, result) {
      if (err !== null) {
        callback(err);
      }
      else {
        callback(null);
      }
    });
  };

  /*
  Modify HIT and User helper functions
  */
  function getHIT(responseObj, HITID, callback) {
    HIT.findOne({'_id': HITID}).exec()
      .then(function(result) {
        if (result === null) {
          throw 'HIT not found';
        }
        callback(null, responseObj, result);
      })
      .catch(function(err) {
        console.log(err);
        responseObj.status = constants.Error.status;
        responseObj.body.data.HIT = err;
        callback(responseObj);
      });
  };

  function updateHIT(response, responseObj, HITTask, callback) {
    // aggregate info
    HITTask.responses.push({
      'userID': response.userID,
      'responseID': response._id
    });
    // markModified
    HITTask.markModified('responses');

    // answer can be the index to the HIT answers array
    // source can be the index to the HIT sources array
    // citation can be added to the index of answer to the HIT citations array
    if (response.answer === constants.Answer.yes) {
      HITTask.numYes += 1;
      if (constants.isValidString(response.citation)) {
        HITTask.citationsYes.push(response.citation);
      };
    }
    else if (response.answer === constants.Answer.no) {
      HITTask.numNo += 1;
      if (constants.isValidString(response.citation)) {
        HITTask.citationsNo.push(response.citation);
      };
    }
    else { // uncertain
      HITTask.numUncertain += 1;
      if (constants.isValidString(response.citation)) {
        HITTask.citationsUncertain.push(response.citation);
      };
    }

    if (response.source === constants.Source.Source1) {
      HITTask.numSource1 += 1;
    }
    else if (response.source === constants.Source.Source2) {
      HITTask.numSource2 += 1;
    }
    else { // Source Other
      HITTask.numSourceOther += 1;
    }

    HITTask.lastModified = response.dateCreated; // last response time

    callback(null, responseObj, HITTask);
  };

  function saveHIT(responseObj, HITTask, callback) {
    HITTask.save()
      .then(function(result) {
        callback(null); // no error, save success
      })
      .catch(function(err) {
        // console.log(err)
        responseObj.status = constants.Error.status;
        responseObj.body.message.HIT = err;
        callback(responseObj); // return error
      });
  };

  function getUser(responseObj, userID, callback) {
    User.findOne({'_id': userID}).exec()
      .then(function(result) {
        if (result === null) {
          throw 'User not found';
        }
        callback(null, responseObj, result);
      })
      .catch(function(err) {
        console.log(err);
        responseObj.status = constants.Error.status;
        responseObj.body.message.user = err;
        callback(responseObj);
      });
  };

  function updateUser(HITID, responseObj, user, callback) {
    var removed = _.remove(user.currentEvents, function(HITTuple) {
      if (HITTuple.HITID === HITID) {
        // move to past events
        user.pastEvents.push({
          'HITID': HITTuple.HITID,
          'timestamp': HITTuple.timestamp
        });
        return true; // remove from current events
      }
      return false;
    });

    var modified = false;
    if (removed.length > 0) {
      modified = true;
      // mark modified
      user.markModified('currentEvents');
      user.markModified('pastEvents');
    }
    // modified T: save, F: no modifications, no save
    callback(null, responseObj, user, modified);
  };

  function saveUser(responseObj, user, modified, callback) {
    if (modified) {
      user.save()
        .then(function(result) {
          callback(null); // success
        })
        .catch(function(err) {
          responseObj.status = constants.Error.status;
          responseObj.body.message.user = err;
          callback(responseObj);
        });
    }
    else {
      callback(null);
    }
  };

  /*
  Drop all responses
  DELETE to /api/responses
  Params: none
  */
  responsesRoute.delete(function(req, res, next) {
    Response.collection.drop();
    var responseObj = new constants['responseObject']();
    responseObj.status = constants.Dropped.status;
    responseObj.body.message = constants.Dropped.message;
    res.status(responseObj.status);
    res.send(responseObj.body);
  });

  //OPTIONS for angular
  responsesRoute.options(function(req, res) {
      res.status(constants.OK.status);
      res.json({
        'message': constants.OK.message,
        'data': []
      });
  });

  return router;
}
