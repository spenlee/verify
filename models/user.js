// Load required packages
var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

// Define our user schema
var UserSchema = new mongoose.Schema({
  //'name': {'type': String, 'required': true}
  'email': {'type': String, 'required': true, 'unique': true},
  'password': {'type': String, 'required': true},
  'dateCreated': {'type': Date, 'default': Date.now}
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