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

###Event
Adding an Event for all Users
POST to /api/events
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

###User
Clear all events for all users
PUT to /api/users/clear-events

Refresh Events for a User with id
PUT to /api/users/:id/refresh-events
Params: id: user id

Get all of a user's current events
GET to /api/users/:id/events/:current
Params: id: user id, current: Boolean - true (current)/false (past)
Response:
```
{
  "message": String, (OK on Success)
  "data": [
    {
      "_id": String, // HIT ID
      "keywords": [ // HIT keywords
        String
      ],
      "tweetID": String,
      "lastModified": Date,
      "tweet": {
        "_id": String,
        "id_str": String,
        "text": String,
        "__v": 0,
        "timestamp": Date
      }
    }
  ]
}
```

Clear all events for a user
PUT to /api/users/:id/clear-events
Params: id: user id

###Response
Send a new response
POST to /api/responses
```
{
  "answer": Number, // 0: Yes, 1: No, 2: Uncertain
  "source": Number, // 0: Source1, 1: Source2, 2: SourceOther
  "citation": String, // Not Required
  "userID": String,
  "HITID": String
}
```


