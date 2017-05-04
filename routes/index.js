var passport = require('passport');
var constants = require('../config/constants');
/*
 * Connect all of your endpoints together here.
 */
var baseRoute = '/api';

var statusInvalidRoute = 404;

module.exports = function (app, router) {
  app.use(baseRoute, require('./users.js')(router));
  app.use(baseRoute, require('./usersID.js')(router));
  app.use(baseRoute, require('./events.js')(router));
  app.use(baseRoute, require('./eventsID.js')(router));
  app.use(baseRoute, require('./hits.js')(router));
  app.use(baseRoute, require('./tweets.js')(router));
  app.use(baseRoute, require('./responses.js')(router));

  // sign-up attempts
  app.post(baseRoute + '/sign-up', function(req, res, next) {
    passport.authenticate('local-sign-up', function(err, user, info) {
      var responseObj = new constants['responseObject']();
      if (err) {
        responseObj.status = 500;
        responseObj.body.message = err;
        return next(responseObj);
      }
      if (!user) {
        responseObj.body.message = info;
        return res.status(500).json(responseObj.body);
      }
      req.login(user, function(err) {
        if (err) {
          responseObj.status = 500;
          responseObj.body.message = err;
          return next(responseObj);
        }
        responseObj.body.data = user;
        responseObj.body.message = info;
        return res.status(200).json(responseObj.body);
      });
    })(req, res, next);
  });

  //OPTIONS
  app.options(baseRoute + '/sign-up', function(req, res) {
    res.status(200).json({'message': 'OK', 'data': []});
  })

  // login attempts
  app.post(baseRoute + '/login', function(req, res, next) {
    passport.authenticate('local-login', function(err, user, info) {
      var responseObj = new constants['responseObject']();
      if (err) {
        responseObj.status = 500;
        responseObj.body.message = err;
        return next(responseObj);
      }
      if (!user) {
        responseObj.body.message = info;
        return res.status(500).json(responseObj.body);
      }
      req.login(user, function(err) {
        if (err) {
          responseObj.status = 500;
          responseObj.body.message = err;
          return next(responseObj);
        }
        responseObj.body.data = user;
        responseObj.body.message = info;
        return res.status(200).json(responseObj.body);
      });
    })(req, res, next);
  });

  //OPTIONS
  app.options(baseRoute + '/login', function(req, res) {
    res.status(200).json({'message': 'OK', 'data': []});
  })

  // handle logout
  app.get(baseRoute + '/logout', function(req, res) {
      req.logout();
      res.status(200);
      res.json({'message': 'Logout success!', 'data': []});
  });

  // otherwise
  app.use(function(req, res) {
    res.status(statusInvalidRoute);
    res.json({
      'base': '/api',
      'message': 'Nothing here. Use base and routes listed in data.',
      'data': {
        'users': ['/users',
                  '/users/:id/clear-events',
                  '/users/clear-events',
                  '/users/:id/refresh-events', 
                  '/users/:id/events/:current' 
                  ],
        'events': ['/events'],
        'HITs': ['/hits'],
        'responses': ['/responses'],
        'tweets': ['/tweets'],
      }
    });
  });
  // error handling
  app.use(baseRoute, function(err, req, res, next) {
    res.status(err.status);
    res.json(err.body);
  });
};
