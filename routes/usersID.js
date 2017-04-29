var _ = require('lodash');
var async = require('async');

var User = require('../models/user');
var HIT = require('../models/hit');
var Tweet = require('../models/tweet');
var Response = require('../models/response');
var constants = require('../config/constants');

var mongoose = require('mongoose');

// get user helper function to be reused by other calls
function getUser(id) {
  // returns a promise - call then, catch on a promise
  return new Promise(function(resolve, reject) {
      var responseObj = new constants['responseObject']();
      User.findOne({'_id': id}).exec()
        // as a promise, resolve or reject to pass back the object
          .then(function(result) {
            if (result === null) {
              throw 'User not found';
            }
            responseObj.status = constants.OK.status;
            responseObj.body.message = constants.OK.message;
            responseObj.body.data = result;
            resolve(responseObj);
          })
          .catch(function(err) {
            responseObj.status = constants.NotFound.status;
            responseObj.body.message = constants.NotFound.message;
            reject(responseObj);
          });
    });
};

module.exports = function(router) {
  
  // define route for users with specified id parameter
  var usersIDRoute = router.route('/users/:id');

  /*
  GET by USER ID from req.params.id
  */
  usersIDRoute.get(function(req, res, next) {
    getUser(req.params.id)
    // object returned from promise
      .then(function(result) {
        res.status(result.status);
        res.json(result.body);
      })
      .catch(function(err) {
        next(err);
      });
  });

  /*
  Refresh Events for a User with id
  PUT to /api/users/:id/refresh-events
  Params: id: user id
  */
  router.route('/users/:id/refresh-events').put(function(req, res, next) {
    var responseObj = new constants['responseObject']();
    responseObj.body.data = {};
    responseObj.body.message = {};
    // Series of operations to execute
    // functions with callbacks
    async.waterfall([
      async.apply(findUser, responseObj, req.params.id),
      refreshUserEvents,
      updateHITs
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
  HELPER FUNCT TO REFRESH EVENTS
  */
  function findUser(responseObj, userID, callback) {
    User.findOne({'_id': userID}).exec()
      .then(function(result) {
        if (result === null) {
          throw 'User not found';
        }
        var user = result;
        callback(null, responseObj, user);
      })
      .catch(function(err) {
        console.log(err);
        responseObj.status = constants.NotFound.status;
        responseObj.body.message.user = err;
        callback(responseObj);
      });
  };

  function refreshUserEvents(responseObj, user, callback) {
    // current time to compare with event timestamps
    var currentTime = new Date();
    var hourPast = currentTime;
    hourPast.setHours(hourPast.getHours() - 1); // hour before
    // only move current to past for now
    // do not remove past for now
    // TODO::remove past times - 6 hours past
    var collectPast = _.remove(user.currentEvents, function(event) {
      // move events more than an hour earlier to pastEvents
      if (event.timestamp < hourPast) {
        user.pastEvents.push({
          'HITID': event.HITID,
          'timestamp': event.timestamp
        });
        return true; // remove obj by returning true
      }
      return false;
    });

    if (collectPast.length > 0) {
      // user.currentEvents is modified by remove
      // mark as modified, or else will not update - applies to Arrays and array values
      user.markModified('currentEvents');
      // save user
      user.save()
        .then(function(result) {
          responseObj.body.data.user = result; // append user to res
          callback(null, responseObj, collectPast); // no error, save success
        })
        .catch(function(err) {
          // console.log(err)
          responseObj.status = constants.Error.status;
          responseObj.body.message = constants.Error.message;
          responseObj.body.data = err;
          callback(responseObj); // return error
        });
    }
    else {
      // no modifications made, no changes to user
      responseObj.body.data.user = user;
      callback(null, responseObj, []); // no error, save success
    }
  };

  function updateHITs(responseObj, pastHITTuples, callback) {
    if (pastHITTuples.length > 0) {
      // create an array of async format functions to be called
      var functList = [];
      pastHITTuples.forEach(function(HITTuple) {
        functList.push(updatePastHIT(responseObj, HITTuple.HITID));
      });

      async.parallel(functList, // functions to run, that will each update a user
        function(err, result) { // overall callback
          if (err) {
            console.log(err);
            responseObj.status = constants.Error.status;
            responseObj.body.message.user = err; // add user err info
            callback(responseObj); // error object back to waterfall
          }
          else {
            responseObj.status = constants.OK.status;
            responseObj.body.message = constants.OK.message;
            callback(null, responseObj);
          }
        });
    }
    else {
      // no modifications needed
      responseObj.status = constants.OK.status;
      responseObj.body.message = constants.OK.message;
      callback(null, responseObj); // no error, save success
    }
  };

  function updatePastHIT(responseObj, HITID) {
    // return an async format function that can be used by async parallel
    return function(callback) {
      // series access HIT, then Tweet
      async.waterfall([
        async.apply(getHIT, responseObj, HITID, false), // current = false to get full HIT
        async.apply(setHIT, false), // set HIT to past, current = false
        saveHIT
      ], function(err, result) {
        if (err) {
          console.log(err);
          callback(err);
        }
        else {
          callback(null);          
        }
      });
    };
  };

  function setHIT(current, responseObj, HITTask, callback) {
    HITTask.current = current;
    callback(null, responseObj, HITTask);
  };

  function saveHIT(responseObj, HITTask, callback) {
    HITTask.save()
      .then(function(result) {
        callback(null); // no error, save success
      })
      .catch(function(err) {
        console.log(err);
        callback(err); // return error
      });
  };

  /*
  Get all of a user's current events
  GET to /api/users/:id/events/:current
  Params: id: user id, current: Boolean - true (current)/false (past)
  */
  router.route('/users/:id/events/:current').get(function(req, res, next) {
    var responseObj = new constants['responseObject']();
    // check user id parameter validity
    if (!constants.isValid(req.params.id) || req.params.current != "true" && req.params.current != "false") {
      responseObj.status = constants.Error.status;
      responseObj.body.message = {
        'id:':"User id is required",
        'current': "true or false"
      }
      next(responseObj);
    }
    else {
      // convert to Boolean
      req.params.current = req.params.current == "true" ? true : false;
      responseObj.body.data = {};
      responseObj.body.message = {};
      // Series of operations to execute
      // functions with callbacks
      async.waterfall([
        async.apply(findUser, responseObj, req.params.id),
        async.apply(getHITs, req.params.current) // as first parameter
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
    }
  });

  /*
  HELPER FUNCT GET ALL USER CURRENT EVENTS
  */
  function getHITs(current, responseObj, user, callback) {
    // get current or past based on current flag
    var HITTuples = current === true ? user.currentEvents : user.pastEvents;
    // loop HITTuples, append info to common array
    // create an array of async format functions to be called to save users in parallel
    var functList = [];
    var HITCollection = [];
    HITTuples.forEach(function(HITTuple) {
      functList.push(getFullHIT(responseObj, HITTuple.HITID, current, user._id, HITCollection));
    });

    async.parallel(functList, // functions to run, that will each update a user
      function(err, result) { // overall callback
        if (err) {
          console.log(err);
          responseObj.status = constants.Error.status;
          responseObj.body.message.user = err; // add user err info
          callback(responseObj); // error object back to waterfall
        }
        else {
          // all HITs returned with success
          // HITCollection is filled
          responseObj.status = constants.OK.status;
          responseObj.body.data = HITCollection;
          responseObj.body.message = constants.OK.message;
          callback(null, responseObj);
        }
      });
  };

  function getFullHIT(responseObj, HITID, current, userID, HITCollection) {
    // return an async format function that can be used by async parallel
    return function(callback) {
      // series access HIT, then Tweet
      async.waterfall([
        async.apply(getHIT, responseObj, HITID, current),
        getTweet,
        async.apply(getResponse, current, userID)
      ], function(err, result) {
        if (err) {
          console.log(err);
          callback(err);
        }
        else {
          var FullHIT = result;
          HITCollection.push(FullHIT);
          callback(null);
        }
      });
    };
  };

  function getHIT(responseObj, HITID, current, callback) {
    HIT.findOne({'_id': HITID}).exec()
      .then(function(result) {
        if (result === null) {
          throw 'HIT not found';
        }

        var HITTask = {};
        HITTask._id = result._id;
        HITTask.keywords = result.keywords;
        HITTask.tweetID = result.tweetID;
        HITTask.lastModified = result.lastModified;
        if (current === false) { // get more stats info
          // need to do a copy, something weird here - result is a mongodb doc
          // HITTask = result; // responses, numYes, citations, ...
          HITTask.current = result.current;
          HITTask.responses = result.responses;
          HITTask.numYes = result.numYes;
          HITTask.numNo = result.numNo;
          HITTask.numUncertain = result.numUncertain;
          HITTask.numSource1 = result.numSource1;
          HITTask.numSource2 = result.numSource2;
          HITTask.numSourceOther = result.numSourceOther;
          HITTask.citationsYes = result.citationsYes;
          HITTask.citationsNo = result.citationsNo;
          HITTask.citationsUncertain = result.citationsUncertain;
          HITTask.dateCreated = result.dateCreated;
        }
        callback(null, responseObj, HITTask);
      })
      .catch(function(err) {
        console.log(err);
        responseObj.status = constants.Error.status;
        responseObj.body.data.HIT = err;
        callback(responseObj);
      });
  };

  function getTweet(responseObj, HITTask, callback) {
    // get Tweet by id
    Tweet.findOne({'_id': HITTask.tweetID}).exec()
      .then(function(result) {
        if (result === null) {
          throw 'Tweet not found';
        }

        HITTask.tweet = result;
        callback(null, responseObj, HITTask);
      })
      .catch(function(err) {
        console.log(err);
        responseObj.status = constants.Error.status;
        responseObj.body.data.tweet = err;
        callback(responseObj);
      });
  };

  function getResponse(current, userID, responseObj, HITTask, callback) {
    // get Response if past event, not current
    if (current === false) {
      // find response id in responses
      var responseTuple = _.find(HITTask.responses, function(resTuple) {
        return resTuple.userID === userID;
      });

      // check exists -- could be a task user didn't respond to
      if (responseTuple) {
        Response.findOne({'_id': responseTuple.responseID}).exec()
          .then(function(result) {
            if (result === null) {
              throw 'Response not found';
            }
            HITTask.response = result;
            callback(null, HITTask);
          })
          .catch(function(err) {
            // console.log(err);
            responseObj.status = constants.Error.status;
            responseObj.body.data.response = err;
            callback(responseObj);
          });
      }
      else { // response for user doesn't exist
        callback(null, HITTask);
      }
    }
    else { // looking for current event, not past
      callback(null, HITTask); // success, return full HIT
    }
  };

  /*
  PUT to update USER properties - name, email, events
  */
  usersIDRoute.put(function(req, res, next) {
    var responseObj = new constants['responseObject']();
    // get user with ID
    getUser(req.params.id)
      .then(function(result) {
        responseObj.body.data = result.body.data; // get current user
        // update fields as necessary
        if (req.body.name)
          responseObj.body.data.name = req.body.name;
        if (req.body.email)
          responseObj.body.data.email = req.body.email;
        if (req.body.currentEvents)
          responseObj.body.data.currentEvents = req.body.currentEvents;
        if (req.body.pastEvents)
          responseObj.body.data.pastEvents = req.body.pastEvents;

      // check request body -- do validation checks with mongoose
      responseObj.body.data.save()
        .then(function(result) {
          res.status(constants.OK.status);
          responseObj.body.message = constants.OK.message;
          res.json(responseObj.body);
        })
        .catch(function(err) {
          responseObj.status = constants.Error.status;
          responseObj.body.data = [];
          responseObj.body.message = [constants.Error.message];

          if (err.errors) {
            // check name -- required
            if (err.errors.name) {
              responseObj.body.message.push(constants.nameRequired.message);
            }
            // check email -- required
            if (err.errors.email) {
              responseObj.body.message.push(constants.user.emailRequired.message);
            }
          }
          else {
            // check email -- duplicate
            // { ..."errmsg": "E11000 duplicate key error index: mp4.users.$email_1 dup key: { : \"1\" }",...
            if (err['errmsg']) {
              responseObj.body.message = [constants.duplicateEmail.message];
            }
          }
          
          responseObj.body.message = responseObj.body.message.join(' ');
          next(responseObj);
        });
      })
      .catch(function(err) { // getUser err
        next(err);
      });
  });

  /*
  Clear all events for a user
  PUT to /api/users/:id/clear-events
  Params: id: user id
  */
  router.route('/users/:id/clear-events').put(function(req, res, next) {
    var responseObj = new constants['responseObject']();
    // get user with ID
    getUser(req.params.id)
      .then(function(result) {
        responseObj.body.data = result.body.data; // get current user
        // clear current and past events
        responseObj.body.data.currentEvents = [];
        responseObj.body.data.pastEvents = [];

        // check request body -- do validation checks with mongoose
        responseObj.body.data.save()
          .then(function(result) {
            res.status(constants.OK.status);
            responseObj.body.message = constants.OK.message;
            res.json(responseObj.body);
          })
          .catch(function(err) {
            console.log(err);
            responseObj.status = constants.Error.status;
            responseObj.body.message = 'User Clear Events Error';
            next(responseObj);
          });
      })
      .catch(function(err) { // getUser err
        next(err);
      });
  });

  usersIDRoute.delete(function(req, res, next) {
    var responseObj = new constants['responseObject']();
      User.findOneAndRemove({'_id': req.params.id}).exec()
        .then(function(result) {
          if (!result) {
            // user not Found, 404
            throw 'User not found';
          }
          else {
            res.status(constants.OK.status);
            responseObj.body.message = constants.OK.message;
            res.json(responseObj.body);
          }
        })
        .catch(function(err) {
          responseObj.status = constants.NotFound.status;
          responseObj.body.message = constants.NotFound.message;
          next(responseObj);
        });
  });

  return router;
}
