var File = require('../models/file');
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

  var filesIDRoute = router.route('/files/:id');

  filesIDRoute.get(function(req, res, next) {
  	File.findOne({'_id': req.params.id}).exec()
  		.then(function(result) {
  			if (result === null) {
  				throw 'File not found';
  			}
  			res.status(200).json({'message': 'OK GET', 'data': result});
  		})
  		.catch(function(err) {
  			var responseObj = new constants['responseObject']();
			responseObj.status = constants.user.notFound.status;
			responseObj.body.message = constants.user.notFound.message;
			next(responseObj);
  		});
  });

  filesIDRoute.put(function(req, res, next) {
  	var responseObj = new constants['responseObject']();
  	// get user with ID
  	File.findOne({'_id': req.params.id}).exec()
  		.then(function(result) {
  			if (result === null) {
  				throw 'File not found';
  			}

  			responseObj.body.data = result; // get current user
		  	
		  	// do pending tasks have to be valid??
			responseObj.body.data.name = req.body.name;
			responseObj.body.data.content = req.body.content;

			// check request body -- do validation checks with mongoose
			responseObj.body.data.save()
				.then(function(result) {
					res.status(200);
					responseObj.body.message = 'Updated file';
					// responseObj.body.data = result; // return as is, updated portions
					res.json(responseObj.body);
				})
				.catch(function(err) {
					responseObj.status = 500;
					responseObj.body.data = [];
					responseObj.body.message = 'err';
					
					// if (err.errors) {
					// 	// check name -- required
					// 	if (err.errors.name) {
					// 		responseObj.body.message.push(constants.user.invalidNameRequired.message);
					// 	}
					// 	// check email -- required
					// 	if (err.errors.email) {
					// 		responseObj.body.message.push(constants.user.invalidEmailRequired.message);
					// 	}
					// }
					// else {
					// 	// check email -- duplicate
					// 	// { ..."errmsg": "E11000 duplicate key error index: mp4.users.$email_1 dup key: { : \"1\" }",...
					// 	if (err['errmsg']) {
					// 		responseObj.body.message = [constants.user.invalidEmailDuplicate.message];
					// 	}
					// }
					
					//responseObj.body.message = responseObj.body.message.join(' ');
					next(responseObj);
				});
  		})
  		.catch(function(err) { // getUser err
  			responseObj.status = 500;
			responseObj.body.data = [];
			responseObj.body.message = 'err';
  			next(responseObj);
  		});
  });

  filesIDRoute.delete(function(req, res, next) {
		File.findOneAndRemove({'_id': req.params.id}).exec()
			.then(function(result) {
				if (!result) {
					throw 'File not found';
				}
				else {
					res.status(200).json({'message': 'OK File deleted', 'data': []});
				}
			})
			.catch(function(err) {
				var responseObj = new constants['responseObject']();
				responseObj.status = constants.user.notFound.status;
				responseObj.body.message = constants.user.notFound.message;
				next(responseObj);
			});
  });

  filesIDRoute.options(function(req, res) {
      res.status(constants.user.validOptions.status);
      res.json({
      	'message': constants.user.validOptions.message,
      	'data': constants.user.validOptions.options
      });
  });
  
  return router;
}