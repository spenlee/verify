// Get the packages we need
var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var secrets = require('./config/secrets');
var passport = require('passport');
var cookieParser = require('cookie-parser');
var session = require('express-session');

// connect mongoose here to be used throughout
var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
mongoose.connect(secrets.mongo_connection);

// pass passport for configuration
require('./config/passport')(passport);

// Create our Express application
var app = express();

// Use environment defined port or 3000
var port = process.env.PORT || 3000;

//Allow CORS so that backend and frontend could pe put on different servers
var allowCrossDomain = function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  next();
};
app.use(allowCrossDomain);

// Use the body-parser package in our application
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(bodyParser.json());

app.use(cookieParser());

// passport
//app.use(session({'secret': 'secret', 'resave': false, 'saveUninitialized': false}));
app.use(passport.initialize());
app.use(passport.session());

// Use routes as a module (see index.js)
require('./routes')(app, router);

// Start the server
app.listen(port);
console.log('Server running on port ' + port);
