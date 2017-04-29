// Load required packages
var mongoose = require('mongoose');

// Define schema
var HITSchema = new mongoose.Schema({
  // '_id': {'type': String, 'default': ''}, // auto generated HIT id
  // 'eventID': {'type': String},
  'keywords': [String],
  'tweetID': {'type': String},
  'current': {'type': Boolean, 'default': true}, // current or past
  'responses': [String],
  'numYes': {'type': Number, 'default': 0},
  'numNo': {'type': Number, 'default': 0},
  'numUncertain': {'type': Number, 'default': 0},
  'numSource1': {'type': Number, 'default': 0},
  'numSource2': {'type': Number, 'default': 0},
  'numSourceOther': {'type': Number, 'default': 0},
  'citationsYes': [String],
  'citationsNo': [String],
  'citationsUncertain': [String],
  'dateCreated': {'type': Date, 'default': Date.now},
  'lastModified': {'type': Date, 'default': Date.now}
});

// Export the Mongoose model
module.exports = mongoose.model('HIT', HITSchema);