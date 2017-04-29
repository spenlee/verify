Verify, the Crowdsourced Verification Network

Note: config/secrets.js is a .gitignored file because it contains database related user and password information.
To connect your own database, create a mongodb instance (perhaps use mLab, hosted mongodb instances) and add
config/secrets.js which should include
```
module.exports = {
    mongo_connection : "mongodb://<user>:<password>@<mongodb connection information>"
};
```
For example:
```
module.exports = {
    mongo_connection : "mongodb://<user>:<password>@ds119081.mlab.com:19081/verify"
};
```

Project structure:
models/ contains data models
server.js contains server setup information
package.json contains node dependency information
sockets/ contains socket code
routes/ contains routing code
config/ contains constants and login code

Installation:
1) install node
2) install npm
3) Install dependencies from package.json
$ npm install
4) create config/secrets.js and export a module with mongo_connection defined
5) Run the server
$ node server.js

open API:

###EVENT
Adding an Event for all Users
POST to /api/new-event
```
{
  "eventID": String,
  "keywords":[String],
  "eventTimestamp": Date,
  "tweetID": String,
  "tweetText": String,
  "tweetImage": String, // Not Required
  "tweetTimestamp": Date
}
```

###USER
Clear all events for all users
PUT to /api/users/clear-events

Refresh Events for a User with id
PUT to /api/users/:id/refresh-events
Params: id: user id

Get all of a user's current events
GET to /api/users/:id/events/:current
Params: id: user id, current: Boolean - true (current)/false (past)

Clear all events for a user
PUT to /api/users/:id/clear-events
Params: id: user id




