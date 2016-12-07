var Message = require('../models/message');
var constants = require('../config/constants');

var mongoose = require('mongoose');

// function getUser(id) {
// 	return new Promise(function(resolve, reject) {
// 			var responseObj = new constants['responseObject']();
// 			User.findOne({'_id': id}).exec()
// 		  		.then(function(result) {
// 		  			if (result === null) {
// 		  				throw 'User not found';
// 		  			}
// 		  			responseObj.status = constants.user.validGET.status;
// 		  			responseObj.body.message = constants.user.validGET.message;
// 		  			responseObj.body.data = result;
// 		  			resolve(responseObj);
// 		  		})
// 		  		.catch(function(err) {
// 		  			responseObj.status = constants.user.notFound.status;
// 		  			responseObj.body.message = constants.user.notFound.message;
// 		  			reject(responseObj);
// 		  		});
// 		});
// };

module.exports = function(router) {

  var messagesIDroute = router.route('/messages/:id');

  messagesIDroute.get(function(req, res, next) {
  	Messages.findOne({'_id': req.params.id}).exec()
  		.then(function(result) {
  			res.status(result.status);
  			res.json(result.body);
  		})
  		.catch(function(err) {
  			next(err);
  		});
  });

  // messagesIDroute.put(function(req, res, next) {
  // 	var responseObj = new constants['responseObject']();
  // 	// get user with ID
  // 	getUser(req.params.id)
  // 		.then(function(result) {
  // 			responseObj.body.data = result.body.data; // get current user
		  	
		//   	// do pending tasks have to be valid??
		// 	responseObj.body.data.name = req.body.name;
		// 	responseObj.body.data.email = req.body.email;

		// 	// check request body -- do validation checks with mongoose
		// 	responseObj.body.data.save()
		// 		.then(function(result) {
		// 			res.status(constants.user.validUpdated.status);
		// 			responseObj.body.message = constants.user.validUpdated.message;
		// 			// responseObj.body.data = result; // return as is, updated portions
		// 			res.json(responseObj.body);
		// 		})
		// 		.catch(function(err) {
		// 			responseObj.status = constants.user.validationError.status;
		// 			responseObj.body.data = [];
		// 			responseObj.body.message = [constants.user.validationError.message];
					
		// 			if (err.errors) {
		// 				// check name -- required
		// 				if (err.errors.name) {
		// 					responseObj.body.message.push(constants.user.invalidNameRequired.message);
		// 				}
		// 				// check email -- required
		// 				if (err.errors.email) {
		// 					responseObj.body.message.push(constants.user.invalidEmailRequired.message);
		// 				}
		// 			}
		// 			else {
		// 				// check email -- duplicate
		// 				// { ..."errmsg": "E11000 duplicate key error index: mp4.users.$email_1 dup key: { : \"1\" }",...
		// 				if (err['errmsg']) {
		// 					responseObj.body.message = [constants.user.invalidEmailDuplicate.message];
		// 				}
		// 			}
					
		// 			responseObj.body.message = responseObj.body.message.join(' ');
		// 			next(responseObj);
		// 		});
  // 		})
  // 		.catch(function(err) { // getUser err
  // 			next(err);
  // 		});
  // });

  messagesIDroute.delete(function(req, res, next) {
  		Message.findOneAndRemove({'_id': req.params.id}).exec()
			.then(function(result) {
				if (!result) {
					throw 'Message not found';
				}
				else {
					res.status(200).json({'message': 'OK Message delete', 'data': []});
				}
			})
			.catch(function(err) {
				responseObj.status = constants.user.notFound.status;
				responseObj.body.message = constants.user.notFound.message;
				next(responseObj);
			});
  });

  return router;
}