var HIT = require('../models/hit');
var constants = require('../config/constants');

var mongoose = require('mongoose');

module.exports = function(router) {

  // define the route as baseRoute + /hits
  var HITsRoute = router.route('/hits');

  /*
  GET ALL HITS
  */
  HITsRoute.get(function(req, res, next) {
    var responseObj = new constants['responseObject']();
    // check query parameters
    // get all users from model
    var query = HIT.find();
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
        var errMsg = responseObj.body.message.join(", ");
        responseObj.body.message = errMsg;
        next(responseObj); // pass to error output
      });
  });

  /*
  POST REQUEST - new user
  */
  // HITsRoute.post(function(req, res, next) {
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
  HITsRoute.options(function(req, res) {
      res.status(constants.OK.status);
      res.json({
        'message': constants.OK.message,
        'data': []
      });
  });

  return router;
}