var Message = require('../models/message');
var constants = require('../config/constants');
var mongoose = require('mongoose');
// var io = require('socket.io');

// io.on('server', function(socket) {
//   io.emit('broadcast', 'message');
// });

module.exports = function(router) {

  var messagesRoute = router.route('/messages');

  messagesRoute.get(function(req, res, next) {
    // io.emit('news', 'hello');
    res.status(200).json({'message': 'GET', 'data': ['message']});
  	// var responseObj = new constants['responseObject']();
  	// // check query parameters
  	// var query = User.find();
  	// query.exec()
  	// 	.then(function(result) {
  	// 		responseObj.status = constants.user.validGET.status;
  	// 		responseObj.body.message = constants.user.validGET.message;
  	// 		responseObj.body.data = result;
  	// 		res.json(responseObj.body);
  	// 	})
  	// 	.catch(function(err) {
  	// 		responseObj.body.message = [];
  	// 		// ObjectId CastError
  	// 		if (err.name === 'CastError' && err.kind === 'ObjectId') {
  	// 			responseObj.status = constants.errorObjectIdCastError.status;
  	// 			responseObj.body.message.push(constants.errorObjectIdCastError.message);
  	// 		}
  	// 		// Mongo Parse Error
  	// 		if (err.name === 'MongoError') {
  	// 			responseObj.status = constants.errorMongoErrorParse.status;
  	// 			responseObj.body.message.push(constants.errorMongoErrorParse.message);
  	// 		}
  			
  	// 		var errMsg = responseObj.body.message.join(", ");
  	// 		responseObj.body.message = errMsg;
  	// 		next(responseObj);
  	// 	});
  });

  //OPTIONS for angular
  messagesRoute.options(function(req, res) {
      res.status(constants.user.validOptions.status);
      res.json({
      	'message': constants.user.validOptions.message,
      	'data': constants.user.validOptions.options
      });
  });

  return router;
}