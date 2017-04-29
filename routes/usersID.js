var User = require('../models/user');
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
  CLEAR ALL USER EVENTS - CURRENT AND PAST
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
