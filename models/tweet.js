// Load required packages
var mongoose = require('mongoose');

// Define schema
var TweetSchema = new mongoose.Schema({
  // '_id': {'type': String, 'default': ''}, // auto generated id
  'id_str': {'type': String}, // Twitter associated ID
  'text': {'type': String},
  'image': {'type': String},
  'timestamp': {'type': Date, 'default': Date.now}
});

// Export the Mongoose model
module.exports = mongoose.model('File', TweetSchema);