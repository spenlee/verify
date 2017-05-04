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
  // CREDENTIALS AND SPECIFIED ORIGINS.
  var allowedOrigins = ['http://localhost:8080', 'http://162.243.78.205:8080', 'http://172.22.153.235:8080', 'http://162.243.78.205'];
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

socketRoute();

// Use routes as a module (see index.js)
require('./routes')(app, router);

// Start the server
// SOCK JS MUST USE SERVER NOT APP, OR 404
server.listen(port, '0.0.0.0');
console.log('Server running on port ' + port);

// require('./sockets/base')(sockjs, server);

// websocket(sockjs, server);
var clients = {};

var echo = sockjs.createServer();
echo.on('connection', function(conn) {
  clients[conn.id] = conn;
  console.log(conn.id, " connected");
  // console.log(conn);

  conn.on('data', function(message) {
    broadcast(message);
  });

  conn.on('close', function() {
    delete clients[conn.id];
  });
});

function broadcast(message) {
  for (var client in clients) {
    clients[client].write(message);
  }
}

echo.installHandlers(server, {prefix:'/api/web-socket'});

function socketRoute() {
  app.post('/api/notify', function(req, res, next) {
    broadcast(JSON.stringify(req.body));
    // console.log(req.body);
    res.status(200).send(req.body);
  });
};

