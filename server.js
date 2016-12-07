// Get the packages we need
var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var secrets = require('./config/secrets');
var passport = require('passport');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var http = require('http');
var sockjs = require('sockjs');

// connect mongoose here to be used throughout
var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
mongoose.connect(secrets.mongo_connection);

// pass passport for configuration
require('./config/passport')(passport);

// Create our Express application
var app = express();
var server = http.createServer(app);

// Use environment defined port or 3000
var port = process.env.PORT || 3000;

//Allow CORS so that backend and frontend could pe put on different servers
var allowCrossDomain = function(req, res, next) {
  var allowedOrigins = ['http://localhost:8080', 'http://fa16-cs498rk-088.cs.illinois.edu:8080'];
  // res.header("Access-Control-Allow-Origin", "http://localhost:8080");
  var origin = req.headers.origin;
  if(allowedOrigins.indexOf(origin) > -1){
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  //res.header('Access-Control-Allow-Origin', '*');
  res.header("Access-Control-Allow-Credentials", "true");
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
// SOCK JS MUST USE SERVER NOT APP, OR 404
server.listen(port, '0.0.0.0');
console.log('Server running on port ' + port);

require('./routes/sockets')(sockjs, server);
