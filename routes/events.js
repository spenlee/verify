var _ = require('lodash');
var async = require('async');
var request = require('request');

var Event = require('../models/event');
var Tweet = require('../models/tweet');
var HIT = require('../models/hit');
var User = require('../models/user');
var constants = require('../config/constants');

var mongoose = require('mongoose');

var SERVER = "http://localhost:3000";
var NOTIFY = "/api/notify"

module.exports = function(router) {

  // define the route as baseRoute + /events
  var eventsRoute = router.route('/events');

  /*
  GET ALL EVENTS
  */
  eventsRoute.get(function(req, res, next) {
    var responseObj = new constants['responseObject']();
    // check query parameters
    // get all users from model
    var query = Event.find();
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
  helper to initially check valid fields
  */
  function isValidEvent(body) {
    if (constants.isValid(body.eventID)
      && constants.isValid(body.keywords)
      && constants.isValid(body.eventTimestamp)) {
      return true;
  }
  return false;
};
function isValidTweet(body) {
  if (constants.isValid(body.tweetID)
    && constants.isValid(body.tweetText)
    && constants.isValid(body.tweetTimestamp)) {
    return true;
}
return false;
};

  /* Adding an Event for all Users
  POST to /api/events
  {
    "eventID": String,
    "keywords":[String],
    "eventTimestamp": Date,
    "tweetID": String,
    "tweetText": String,
    "tweetImage": String, // Not Required
    "tweetTimestamp": Date
  }
  */
  eventsRoute.post(function(req, res, next) {
    var responseObj = new constants['responseObject']();

    // check fields
    if (!isValidEvent(req.body) || !isValidTweet(req.body)) {
      responseObj.status = constants.Error.status;
      responseObj.body.message = constants.Error.message;
      responseObj.body.data = {
        "eventID": "required",
        "keywords":["required", "..."],
        "eventTimestamp": "required",
        "tweetID": "required",
        "tweetText": "required",
        "tweetImage": "not required",
        "tweetTimestamp": "required"
      };
      next(responseObj);
    }
    else {
      // Series of operations to execute
      // functions with callbacks
      responseObj.body.data = {};
      responseObj.body.message = {};

      // check duplicate tweet text
      var tweetText = req.body.tweetText;
      checkTweets(tweetText)
        .then(function(result) {
          if (result !== undefined) {
            // duplicate
            responseObj.status = constants.OK.status;
            responseObj.body.message.tweet = 'Tweet already exists';
            next(responseObj);
          }
          else {
            // proceed, not duplicate
            async.waterfall([
              async.apply(createTweet, responseObj, req),
              findEvent,
              saveEvent,
              createHIT,
              findUsers,
              updateUsers
            ], function (err, result) {
              // callbacks that return with err accumulate here
              if (err !== null) {
                next(err); // err is responseObj
              }
              // result accumulated here on success
              else {
                // notify by socket
                request.post(SERVER + NOTIFY).form({'status': 'OK', 'code': 0});
                res.status(constants.OK.status);
                result.body.message = constants.OK.message;
                res.send(result.body);
              }
            }); // end of waterfall
          }
        })
        .catch(function(err) {
          // error with checking tweet
          next(err);
        });
    }
  });

  /*
  NEW EVENT NAMED FUNCTIONS
  */
  function createTweet(responseObj, req, callback) {
    // Initialize new Tweet based on request
    var tweet = new Tweet({
      'id_str': req.body.tweetID,
      'text': req.body.tweetText,
      'image': req.body.tweetImage,
      'timestamp': req.body.tweetTimestamp
    });

    // save the Tweet
    tweet.save()
      // Tweet success
      .then(function(result) {
        responseObj.body.data.tweet = result; // add tweet to response
        // pass responseObj and Tweet
        callback(null, responseObj, req, result);
      })
      // Tweet error
      .catch(function(err) {
        responseObj.status = constants.Error.status;
        responseObj.body.message.tweet = err;
        callback(responseObj);
      });
    };

    function findEvent(responseObj, req, tweet, callback) {
    // use req body based information
    Event.findOne({'_id': req.body.eventID}).exec()
      // check if Event already exists or create a new one
      .then(function(result) {
        if (result === null) {
          throw 'Event not found';
        }
        var event = result;
        // Event already exists - add Tweet information to Event
        event.tweets.push(tweet._id); // add generated tweet id to event
        event.keywords = req.body.keywords;
        event.lastModified = req.body.eventTimestamp;
        // move to saving the event
        callback(null, responseObj, event);
      })
      .catch(function(err) {
        // Event not found, create a new Event
        // create event, add tweet id
        var event = new Event({
          '_id': req.body.eventID,
          'tweets': [tweet._id], // initialize tweets with tweet id
          'keywords': req.body.keywords,
          'dateCreated': req.body.eventTimestamp,
          'lastModified': req.body.eventTimestamp // new event, last mod is now
        });
        // move to saving the event
        callback(null, responseObj, event);
      });
    };

    function saveEvent(responseObj, event, callback) {
    // save the event created previously
    event.save()
    .then(function(result) {
      var event = result;
      responseObj.body.data.event = event;
        // move to creating HIT
        callback(null, responseObj, event);
      })
    .catch(function(err) {
      responseObj.status = constants.Error.status;
      responseObj.body.message.event = err;
      callback(responseObj);
    });
  };

  function createHIT(responseObj, event, callback) {
    // tweet id is the last tweet id added to event.tweets
    var tweetID = event.tweets[event.tweets.length - 1] // 0 index
    // Initialize new HIT based on event
    var HITTask = new HIT({ // cannot name var HIT, name collision
      'keywords': event.keywords,
      'tweetID': tweetID,
      'dateCreated': event.lastModified,
      'lastModified': event.lastModified // init HIT, no responses yet
      // other fields default
    });

    // save the HIT
    HITTask.save()
      // HIT success
      .then(function(result) {
        responseObj.body.data.HIT = result; // add HIT to response
        
        var HITTuple = {
          'HITID': result._id,
          'timestamp': result.dateCreated
        };
        // pass responseObj and HIT tuple to be added to users
        callback(null, responseObj, HITTuple);
      })
      // HIT error
      .catch(function(err) {
        responseObj.status = constants.Error.status;
        responseObj.body.message.HIT = err;
        callback(responseObj);
      });
    };

    function findUsers(responseObj, HITTuple, callback) {
    // Get all Users
    var query = User.find();
    query.exec()
      // success for finding users
      .then(function(result) {
        var users = result;
        // update every User -- add HIT tuple
        users.forEach(function(user) {
          user.currentEvents.push(HITTuple);
        });
        callback(null, responseObj, users);
      })
      // Finding Users error
      .catch(function(err) {
        responseObj.status = constants.Error.status;
        responseObj.body.message.users = err;
        callback(responseObj);
      });
    };

    function updateUsers(responseObj, users, callback) {
    // create an array of async format functions to be called to save users in parallel
    var functList = [];
    users.forEach(function(user) {
      functList.push(updateUser(user));
    });

    async.parallel(functList, // functions to run, that will each update a user
      function(err, results) { // overall callback
        if (err) {
          responseObj.status = constants.Error.status;
          responseObj.body.message.user = err; // add user err info
          callback(responseObj); // error object back to waterfall
        }
        else {
          callback(null, responseObj); // overall success
        }
      });
  };

  function updateUser(user) {
    return function(callback) {
      // return a function that saves one user
      user.save()
      .then(function(result) {
          callback(null); // no error, save success
        })
      .catch(function(err) {
          callback(err); // return error
        });
    };
  };

  // promise for checking tweet text
  function checkTweets(tweetText) {
    return new Promise(function(resolve, reject) {
      var responseObj = new constants['responseObject']();
      // get all tweets from model
      var query = Tweet.find();
      // actually execute - mongoose
      query.exec()
        // success
        .then(function(result) {
          var tweets = result;
          var exists = _.find(tweets, function(tweet) {
            return tweet.text === tweetText;
          });

          resolve(exists);
        })
        // error
        .catch(function(err) {
          responseObj.status = constants.Error.status;
          responseObj.body.message.tweets = err;
          console.log(err);
          reject(responseObj);
        });
    });
  };


  //OPTIONS for angular
  eventsRoute.options(function(req, res) {
    res.status(constants.OK.status);
    res.json({
      'message': constants.OK.message,
      'data': []
    });
  });  

  /*
  Drop all events
  DELETE to /api/events
  Params: none
  */
  eventsRoute.delete(function(req, res, next) {
    Event.collection.drop();
    var responseObj = new constants['responseObject']();
    responseObj.status = constants.Dropped.status;
    responseObj.body.message = constants.Dropped.message;
    res.status(responseObj.status);
    res.send(responseObj.body);
  });
  
  //OPTIONS for angular
  eventsRoute.options(function(req, res) {
    res.status(constants.OK.status);
    res.json({
      'message': constants.OK.message,
      'data': []
    });
  });

  return router;
}
