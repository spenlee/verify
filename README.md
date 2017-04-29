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

#### Event

##### Adding an Event for all Users
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

#### User

##### Create a new user
POST to /api/users/sign-up
```
{
  "email": String, // required
  "password": String // required
}
```

##### Clear all events for all users
PUT to /api/users/clear-events

##### Refresh Events for a User with id
PUT to /api/users/:id/refresh-events
Params: id: user id

##### Get all of a user's current events
GET to /api/users/:id/events/:current
Params: id: user id, current: Boolean - true (current)/false (past)
Response:
###### If current is true:
```
{
  "message": String, (OK on Success)
  "data": [
    {
      "HITID": String,
      "HITKeywords": [String],
      "tweetID": String,
      "eventTimestamp": Date,
      "current": Boolean,
      "tweet": {
        "id_str": String,
        "text": String,
        "image": String,
        "timestamp": Date
      }
    }
  ]
}
```
###### If current is false:
```
{
  "message": String, (OK on Success)
  "data": [
    {
      "HITID": String,
      "HITKeywords": [String],
      "tweetID": String,
      "eventTimestamp": Date,
      "current": Boolean,
      "tweet": {
        "id_str": String,
        "text": String,
        "image": String,
        "timestamp": Date
      },
      "numYes": Number,
      "numNo": Number,
      "numUncertain": Number,
      "numSource1": Number,
      "numSource2": Number,
      "numSourceOther": Number,
      "citationsYes": [String],
      "citationsNo": [String],
      "citationsUncertain": [String],
      "response": {
        "responseID": String,
        "answer": Number,
        "source": Number,
        "dateCreated": Date,
        "citation": String
      }
    }
  ]
}
```

##### Clear all events for a user
PUT to /api/users/:id/clear-events
Params: id: user id

#### Response

##### Send a new response
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

#### GET

##### Get All Events
GET to /api/events

##### Get All HITs
GET to /api/hits

##### Get All Tweets
GET to /api/tweets

##### Get All Responses
GET to /api/responses

##### Get All Users
GET to /api/users

#### DELETE

##### Delete Events Collection
DELETE to /api/events

##### Delete HITs Collection
DELETE to /api/hits

##### Delete Tweets Collection
DELETE to /api/tweets

##### Delete Responses Collection
DELETE to /api/responses
