// Load required packages
var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

// Lean HIT reference object
var HIT = mongoose.Schema({
  'timestamp': Date,
  'HITID': Number
},{ _id : false });

// Define our user schema
var UserSchema = new mongoose.Schema({
  // 'username': {'type': String, 'required': true},
  // auto generated user id _id
  'email': {'type': String, 'required': true, 'unique': true},
  'password': {'type': String, 'required': true},
  'dateCreated': {'type': Date, 'default': Date.now},
  'currentEvents': [HIT],
  'pastEvents': [HIT]
  // FUTURE: click and profile related
});

// generate a hash
UserSchema.methods.generateHash = function(password) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// check validity
UserSchema.methods.validPassword = function(password) {
  return bcrypt.compareSync(password, this.password);
};

// Export the Mongoose model
module.exports = mongoose.model('User', UserSchema);