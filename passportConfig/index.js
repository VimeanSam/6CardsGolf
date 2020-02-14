const passport = require('passport');
const LocalStrategy = require('./localStrategy');
const Player = require('../models/player');

passport.serializeUser((user, done) => {
	done(null, { _id: user._id });
})

// user object attaches to the request as req.user
passport.deserializeUser((id, done) => {
	Player.findOne(
		{ _id: id },
		'username',
		(err, user) => {
			done(null, user);
		}
	)
})

passport.use(LocalStrategy);
module.exports = passport;