var _ = require('lodash');
var async = require('async');

var User = require('../models/user');
var HIT = require('../models/hit');
var constants = require('../config/constants');

var mongoose = require('mongoose');

module.exports = function(router) {

  // define route for events with specified id parameter
  var eventsRoute = router.route('/events/:id');

  /*
  Populate events for a given user
  PUT to /api/events/:id
  Params: id: userID
  */
  eventsRoute.put(function(req, res, next) {
    var responseObj = new constants['responseObject']();

    responseObj.body.data = {};
    responseObj.body.message = {};

    var userID = req.params.id

    // waterfall,
    // [parallel
    // [get user
    // get all HITs, get HITID, timestamp]
    // update user currentEvents]
    async.waterfall([
      async.apply(findUserAndHITs, userID),
      async.apply(updateUser, responseObj)
      ], function (err, result) {
      // callbacks that return with err accumulate here
      if (err !== null) {
        next(err); // err is responseObj
      }
      else {
        // result accumulated here on success
        res.status(result.status);
        res.send(result.body);
      }
    }); // end of waterfall
  });

  /*
  HELPER FUNCT TO POPULATE EVENTS
  */
  function findUserAndHITs(userID, callback) {
    // for formatting errors
    var responseObj = new constants['responseObject']();
    async.parallel({
      'user': async.apply(findUser, responseObj, userID),
      'HITTuples': async.apply(getHITs, responseObj)
    }, function(err, results) { // overall callback
      if (err) {
        callback(responseObj); // error object back to waterfall
      }
      else {
        // parallel object result on success
        callback(null, results); // object with properties user and HITs
      }
    });
  };

  function findUser(responseObj, userID, callback) {
    User.findOne({'_id': userID}).exec()
    .then(function(result) {
      if (result === null) {
        throw 'User not found';
      }
      var user = result;
      callback(null, user);
    })
    .catch(function(err) {
      console.log(err);
      responseObj.status = constants.NotFound.status;
      responseObj.body.message.user = err;
      callback(responseObj);
    });
  };

  function getHITs(responseObj, callback) {
    // get all HITs from model
    var query = HIT.find();
    // actually execute - mongoose
    query.exec()
      // success
      .then(function(result) {
        // process hits
        var HITs = result;

        var HITTuples = _.map(HITs, function(HIT) {
          return {
            'HITID': HIT._id,
            'timestamp': HIT.lastModified
          };
        });

        callback(null, HITTuples);
      })
      // error
      .catch(function(err) {
        responseObj.status = constants.NotFound.status;
        responseObj.body.message.HITs = err;
        callback(responseObj); // pass to error output
      });
  };

  function updateUser(responseObj, userHITTuplesObj, callback) {
    // return a function that saves one user
    var user = userHITTuplesObj.user;
    var HITTuples = userHITTuplesObj.HITTuples;
    // could do something fancier - past events vs. current events organizing
    user.currentEvents = HITTuples;

    user.save()
      .then(function(result) {
        responseObj.status = constants.OK.status;
        responseObj.body.data = user;
        callback(null, responseObj); // no error, save success
      })
      .catch(function(err) {
        responseObj.status = constants.Error.status;
        responseObj.body.message.user = err;     
        callback(err); // return error
      });
  };

  /*
  Options
  */
  eventsRoute.options(function(req, res) {
      res.status(constants.OK.status);
      res.json({
        'message': constants.OK.message,
        'data': []
      });
  });
  
return router;
}
