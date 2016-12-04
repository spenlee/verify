var User = require('../models/user');
var constants = require('../config/constants');

var mongoose = require('mongoose');

module.exports = function(router) {

  var usersRoute = router.route('/users');

  usersRoute.get(function(req, res, next) {
  	var responseObj = new constants['responseObject']();
  	// check query parameters
  	var query = User.find();
  	query.exec()
  		.then(function(result) {
  			responseObj.status = constants.user.validGET.status;
  			responseObj.body.message = constants.user.validGET.message;
  			responseObj.body.data = result;
  			res.json(responseObj.body);
  		})
  		.catch(function(err) {
  			responseObj.body.message = [];
  			// ObjectId CastError
  			if (err.name === 'CastError' && err.kind === 'ObjectId') {
  				responseObj.status = constants.errorObjectIdCastError.status;
  				responseObj.body.message.push(constants.errorObjectIdCastError.message);
  			}
  			// Mongo Parse Error
  			if (err.name === 'MongoError') {
  				responseObj.status = constants.errorMongoErrorParse.status;
  				responseObj.body.message.push(constants.errorMongoErrorParse.message);
  			}
  			
  			var errMsg = responseObj.body.message.join(", ");
  			responseObj.body.message = errMsg;
  			next(responseObj);
  		});
  });

  usersRoute.post(function(req, res, next) {
  	var responseObj = new constants['responseObject']();

	responseObj.body.data = new User({
		'name': req.body.name,
		'email': req.body.email
	});

	// check request body -- do validation checks with mongoose
	responseObj.body.data.save()
		.then(function(result) {
			res.status(constants.user.validCreated.status);
			responseObj.body.message = constants.user.validCreated.message;
			responseObj.body.data = result;
			res.json(responseObj.body);
		})
		.catch(function(err) {
			responseObj.status = constants.user.validationError.status;
			responseObj.body.data = [];
			responseObj.body.message = [constants.user.validationError.message];
			
			if (err.errors) {
				// check name -- required
				if (err.errors.name) {
					responseObj.body.message.push(constants.user.invalidNameRequired.message);
				}
				// check email -- required
				if (err.errors.email) {
					responseObj.body.message.push(constants.user.invalidEmailRequired.message);
				}
			}
			else {
				// check email -- duplicate
				// { ..."errmsg": "E11000 duplicate key error index: mp4.users.$email_1 dup key: { : \"1\" }",...
				if (err['errmsg']) {
					responseObj.body.message = [constants.user.invalidEmailDuplicate.message];
				}
			}
			
			responseObj.body.message = responseObj.body.message.join(' ');
			next(responseObj);
		});
  });

  //OPTIONS for angular
  usersRoute.options(function(req, res) {
      res.status(constants.user.validOptions.status);
      res.json({
      	'message': constants.user.validOptions.message,
      	'data': constants.user.validOptions.options
      });
  });

  return router;
}