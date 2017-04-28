var Event = require('../models/event');
var Tweet = require('../models/tweet');
var HIT = require('../models/hit');
var User = require('../models/user');
var constants = require('../config/constants');

var mongoose = require('mongoose');

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
  /*
  Needed:

  EVENT
  -----
  eventID
  keywords[]
  eventTimestamp

  TWEET
  -----
  id_str
  text
  created_at
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
    if (constants.isValid(body.id_str)
        && constants.isValid(body.text)
        && constants.isValid(body.created_at)) {
      return true;
    }
    return false;
  };

  function saveEvent(event, responseObj, res, next) {
    event.save()
      .then(function(result) {
        res.status(constants.OK.status);
        responseObj.body.data.event = result;
        var ev = responseObj.body.data.event; // Event
        var tw = responseObj.body.data.tweet; // Tweet
        // create a HIT, add HIT ID to every user's currentEvents
        // other properties, default values
        var hit = new HIT({
          'eventID': ev._id,
          'tweetID': tw._id,
          'dateCreated': ev.lastModified,
          'lastModified': ev.lastModified
        });
        // save HIT
        hit.save()
          .then(function(result) {
            responseObj.body.data.HIT = result; // add HIT to result
          // add to users
            var query = User.find();
            // actually execute - mongoose
            query.exec()
            // success for finding users
              .then(function(result) {
                
                var h = responseObj.body.data.HIT;
                // update every User -- add HIT tuple
                result.forEach(function(user) {
                  var updatedUser = user;
                  updatedUser.currentEvents.push({
                    'HITID': h._id,
                    'timestamp': h.dateCreated
                  });
                  // save each user
                  updatedUser.save()
                    // .then(function(result) {
                    // })
                    .catch(function(err) {
                      responseObj.status = constants.Error.status;
                      responseObj.body.data = [];
                      responseObj.body.message = 'Saving User Error ' + err;
                      next(responseObj);
                    });
                });

                // forEach complete, send full response
                res.status(constants.OK.status);
                res.json(responseObj.data);
              })
              .catch(function(err) {
                responseObj.status = constants.Error.status;
                responseObj.body.data = [];
                responseObj.body.message = 'Finding Users Error ' + err;
                next(responseObj);
              });
          })
          .catch(function(err) {
            responseObj.status = constants.Error.status;
            responseObj.body.data = [];
            responseObj.body.message = 'Saving HIT Error ' + err;
            next(responseObj);
          });

      })
      .catch(function(err) {
        responseObj.status = constants.Error.status;
        responseObj.body.data = [];
        responseObj.body.message = 'Saving Event Error ' + err;
        next(responseObj);
      });
  };

  /*
  POST EVENT TO SERVER
  with Tweet
  add to users
  */
  router.route('/new-event').post(function(req, res, next) {
    var responseObj = new constants['responseObject']();
    // check fields
    if (!isValidEvent(req.body) || !isValidTweet(req.body)) {
      responseObj.status = constants.Error.status;
      responseObj.body.message = constants.Error.message;
      next(responseObj);
    }
    else {
      var tweet = new Tweet({
        'id_str': req.body.id_str,
        'text': req.body.text,
        'image': req.body.image,
        'timestamp': req.body.created_at
      });

      // check request body -- do validation checks with mongoose
      tweet.save()
        .then(function(result) {
          res.status(constants.OK.status);
          responseObj.body.data = {};
          responseObj.body.data.tweet = result; // add tweet to response
          var newTweet = result;

          // check existing Event, append tweet to existing event
          var eventID = req.body.eventID;
          Event.findOne({'_id': eventID}).exec()
            .then(function(result) {
              if (result === null) {
                throw 'Event not found';
              }
              // Event already exists
              result.tweets.push(newTweet._id); // add generated tweet id to event
              result.keywords = req.body.keywords;
              result.lastModified = req.body.eventTimestamp;
              // save the event
              saveEvent(result, responseObj, res, next);
            })
            .catch(function(err) {
              // Event not found, create a new Event
              // create event, add tweet id
              event = new Event({
                '_id': req.body.eventID,
                'tweets': [newTweet._id], // initialize tweets with tweet id
                'keywords': req.body.keywords,
                'dateCreated': req.body.eventTimestamp,
                'lastModified': req.body.eventTimestamp
              });

              saveEvent(event, responseObj, res, next);
            });

        })
        .catch(function(err) {
          responseObj.status = constants.Error.status;
          responseObj.body.data = [];
          responseObj.body.message = 'Saving Tweet Error';
          next(responseObj);
        });
    } // END OF ELSE
  });

  /*
  POST REQUEST - new event
  */
  // eventsRoute.post(function(req, res, next) {
  //   var responseObj = new constants['responseObject']();

  //   responseObj.body.data = new User({
  //     'name': req.body.name,
  //     'email': req.body.email
  //   });

  //   // check request body -- do validation checks with mongoose
  //   responseObj.body.data.save()
  //     .then(function(result) {
  //       res.status(constants.OK.status);
  //       responseObj.body.message = constants.OK.message;
  //       responseObj.body.data = result;
  //       res.json(responseObj.body);
  //     })
  //     .catch(function(err) {
  //       responseObj.status = constants.Error.status;
  //       responseObj.body.data = [];
  //       responseObj.body.message = [constants.Error.message];
        
  //       if (err.errors) {
  //         // check name -- required
  //         if (err.errors.name) {
  //           responseObj.body.message.push(constants.nameRequired.message);
  //         }
  //         // check email -- required
  //         if (err.errors.email) {
  //           responseObj.body.message.push(constants.emailRequired.message);
  //         }
  //       }
  //       else {
  //         // check email -- duplicate
  //         // { ..."errmsg": "E11000 duplicate key error index: mp4.users.$email_1 dup key: { : \"1\" }",...
  //         if (err['errmsg']) {
  //           responseObj.body.message = [constants.duplicateEmail.message];
  //         }
  //       }
        
  //       responseObj.body.message = responseObj.body.message.join(' ');
  //       next(responseObj);
  //     });
  // });

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