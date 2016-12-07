// Load required packages
var mongoose = require('mongoose');

// Define schema
var MessageSchema = new mongoose.Schema({
  'content': {'type': String, 'default': ''}
});

// Export the Mongoose model
module.exports = mongoose.model('Message', MessageSchema);