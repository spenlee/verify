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
  Drop all hits
  DELETE to /api/hits
  Params: none
  */
  HITsRoute.delete(function(req, res, next) {
    HIT.collection.drop();
    var responseObj = new constants['responseObject']();
    responseObj.status = constants.Dropped.status;
    responseObj.body.message = constants.Dropped.message;
    res.status(responseObj.status);
    res.send(responseObj.body);
  });

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