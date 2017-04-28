// Load required packages
var mongoose = require('mongoose');

// Define schema
var EventSchema = new mongoose.Schema({
  '_id': Number, // event id - override auto generated _id
  'tweets': [String], // tweet ids per event cluster
  'keywords': [String],
  'dateCreated': {'type': Date, 'default': Date.now},
  'lastModified': {'type': Date, 'default': Date.now}
});

// Export the Mongoose model
module.exports = mongoose.model('Event', EventSchema);