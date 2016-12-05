var LocalStrategy = require('passport-local').Strategy;
var User = require('../models/user');

module.exports = function(passport) {
	// serialize and deserialize users with minimal id info, for cookies and sessions
	passport.serializeUser(function(user, done) {
		done(null, user.id);
	});

	passport.deserializeUser(function(id, done) {
		User.findById(id, function(err, user) {
			done(err, user);
		});
	});

	// sign-up strategy
	passport.use('local-sign-up', new LocalStrategy({
	        // passport default uses a username field, override to use email
	        'usernameField': 'email',
	        'passwordField': 'password'
	    },
	    function(email, password, done) {
	        // User.findOne wont fire unless data is sent back -- async
	        process.nextTick(function() {
	        	// find user with email
		        User.findOne({'email':email}, function(err, user) {
		            if (err) {
		                return done(err); // server err
		            }

		            if (user) {
		                return done(null, false, 'Email already exists!'); // false sent back as user -- error on signup
		            } else {
		                // create the user
		                var newUser = new User();
		                // set the user's local credentials
		                newUser.email = email;
		                newUser.password = newUser.generateHash(password);
		                // save the user
		                newUser.save(function(err) {
		                    if (err) {
		                        throw err;
		                    }
		                    return done(null, newUser, 'Sign-up Success!'); // return user
		                });
		            }
		        });
	        });
	    }));

	// login strategy
	passport.use('local-login', new LocalStrategy({
	        // passport default uses a username field, override to use email
	        'usernameField': 'email',
	        'passwordField': 'password'
	    },
	    function(email, password, done) {
	        // User.findOne wont fire unless data is sent back -- async
	        process.nextTick(function() {
	        	// find user with email
		        User.findOne({'email':email}, function(err, user) {
		            if (err) {
		                return done(err); // server err
		            }

		            if (!user) { // email not matched
		                return done(null, false, 'Invalid Email!'); // false sent back as user -- error on signup
		            } 

		            if (!user.validPassword(password)) { // invalid password
		            	return done(null, false, 'Invalid Password!');
		            }
		            // email, password valid
		            return done(null, user, 'Login Success!');
		        });
	        });
	    }));
};