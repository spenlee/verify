// Load required packages
var mongoose = require('mongoose');

// Define schema
var FileSchema = new mongoose.Schema({
  'name': {'type': String, 'default': ''},
  'content': {'type': String, 'default': ''},
  'dateCreated': {'type': Date, 'default': Date.now}
});

// Export the Mongoose model
module.exports = mongoose.model('File', FileSchema);