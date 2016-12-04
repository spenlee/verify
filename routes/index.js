/*
 * Connect all of your endpoints together here.
 */
var baseRoute = '/api';

var statusInvalidRoute = 404;

module.exports = function (app, router) {
  app.use(baseRoute, require('./users.js')(router));
  app.use(baseRoute, require('./usersID.js')(router));
  // otherwise
  app.use(function(req, res) {
  	res.status(statusInvalidRoute);
  	res.json({ 
  		'message': 'Nothing here. Go to /users to play with the API.',
  		'data': []
  	});
  });
  // error handling
  app.use(baseRoute, function(err, req, res, next) {
  	res.status(err.status);
  	res.json(err.body);
  });
};