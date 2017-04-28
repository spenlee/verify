// Load required packages
var mongoose = require('mongoose');

// Define schema
var ResponseSchema = new mongoose.Schema({
  // auto generated _id
  'answer': {'type': Number},
  'source': {'type': Number},
  'citation': {'type': String, 'default': ''},
  'userID': {'type': String},
  'HITID': {'type': String},
  'dateCreated': {'type': Date, 'default': Date.now}
});

// Export the Mongoose model
module.exports = mongoose.model('File', ResponseSchema);