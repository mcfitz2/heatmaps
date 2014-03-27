var mongoose = require('mongoose')
, Moves = require("moves")
, moment = require("moment")
, MovesStrategy = require('passport-moves').Strategy
, StravaStrategy = require('passport-strava').Strategy
, User = mongoose.model('User')
, LocalStrategy = require("passport-local").Strategy;
function callback(req, accessToken, refreshToken, profile, done) {
    profile.access_token = accessToken;
    profile.refresh_token = refreshToken;	
    User.findById(req.user._id, function(err, user) {
	delete profile._raw;
	delete profile._json;
	user[profile.provider] = profile;
	if (profile.provider === "strava") { 
	    user[profile.provider].last_post = 0;
	}
	if (profile.provider == "moves") {
	    var moves = new Moves({
		client_id: process.env.MOVES_CLIENT_ID,
		client_secret: process.MOVES_CLIENT_SECRET,
		redirect_uri: process.MOVES_CALLBACK_URL,
		access_token: user.moves.access_token,
		refresh_token: user.moves.refresh_token
	    });
	    moves.get("/user/profile", {}, function(err, res, body) {
		if (err) {
		    done(err, null);
		} else {
		    user.moves.firstDate = body.profile.firstDate;
		    user.save(function(err) {
			done(err);
		    });
		}
	    });
	} else {
	    user.save(function(err) {
		done(err);
	    });
	}	
    });
}
module.exports = function (app) {
    
    app.passport.serializeUser(User.serializeUser());
    app.passport.deserializeUser(User.deserializeUser());
    app.passport.use(new MovesStrategy({
	clientID: process.env.MOVES_CLIENT_ID,
	clientSecret: process.env.MOVES_CLIENT_SECRET,
	callbackURL: process.env.MOVES_CALLBACK_URL,
	passReqToCallback:true
    }, callback));
    app.passport.use(new FoursquareStrategy({
	clientID: process.env.FOURSQUARE_CLIENT_ID,
	clientSecret: process.env.FOURSQUARE_CLIENT_SECRET,
	callbackURL: process.env.FOURSQUARE_CALLBACK_URL,
	passReqToCallback:true
    }, callback));
    app.passport.use(new DropboxStrategy({
	consumerKey: process.env.DROPBOX_CLIENT_ID,
	consumerSecret: process.env.DROPBOX_CLIENT_SECRET,
	callbackURL: process.env.DROPBOX_CALLBACK_URL,
	passReqToCallback:true
    }, callback));
    app.passport.use(User.createStrategy());
    app.passport.use(new StravaStrategy({
	clientID: process.env.STRAVA_CLIENT_ID,
	clientSecret: process.env.STRAVA_CLIENT_SECRET,
	callbackURL: process.env.STRAVA_CALLBACK_URL,
	passReqToCallback:true
    }, callback));    
};
