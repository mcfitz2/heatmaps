var mongoose = require('mongoose');
var moment = require("moment");
var Moves = require('moves');
var bcrypt = require('bcrypt'), SALT_WORK_FACTOR = 10,     passportLocalMongoose = require('passport-local-mongoose');
var Strava = require("strava");
var UserSchema = mongoose.Schema({
    email:    {type:String, required:true},
    strava: {},
    moves: {},
    foursquare: {},
    dropbox:{}
});
UserSchema.plugin(passportLocalMongoose);
UserSchema.methods.getStrava = function() {
    var strava = new Strava({
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.STRAVA_CLIENT_SECRET,
        redirect_uri: process.STRAVA_CALLBACK_URL,
        access_token: this.strava.access_token,
        refresh_token: this.strava.refresh_token
    });
    return strava;
};
UserSchema.statics.findOrCreateOAuthUser = function(profile, done) {
    var User = this;
    console.log(profile);
    if (profile.provider == "strava") {
	return done(null, null);
    }
    // Build dynamic key query
    var query = {moves_id: profile.id};
    
    // Search for a profile from the given auth origin
    User.findOne(query, function(err, user){
	if(err) throw err;
	
	// If a user is returned, load the given user
	if(user){
	   User.update(user, {refresh_token : profile.refresh_token,
                              access_token: profile.access_token}, function(err, numAffected, rawResponse) {
				  done(null, user);
			      });
//	    done(null, user);
	} else {
	    // Fixed fields
	    user = {
		refresh_token : profile.refresh_token,
		access_token: profile.access_token
	    };
		
	    User.create(
		user,
		function(err, user){
		    if(err) throw err;
		    done(null, user);
		});
	}
    });
}

var User = mongoose.model("User", UserSchema);
module.exports = User;