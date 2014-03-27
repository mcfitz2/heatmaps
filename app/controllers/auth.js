var mongoose = require("mongoose");
var User = mongoose.model("User");


module.exports = function(app) {
    app.get('/auth/moves',
	    app.passport.authorize(
		'moves',
		{
		    scope: 'location activity'
		})
	   );
    app.get('/login', function(req, res){
	res.render('login', { layout:"layout-loggedout" });
    });
    app.get("/register", function(req, res) {
	res.render("register", { layout: "layout-loggedout"});
    });
    app.post('/register', function(req, res) {
	User.register(new User({ username : req.body.username, email:req.body.email }), req.body.password, function(err, account) {
            if (err) {
		return res.render('register', { account : account });
            }
            app.passport.authenticate('local')(req, res, function () {
		res.redirect('/heatmap/view');
            });
	});
    });
    app.post('/login', app.passport.authenticate('local'), function(req, res) {
	res.redirect('/heatmap/view');
    });

    app.get('/logout', function(req, res){
	req.logout();
	res.redirect('/login');
    });
    app.get('/auth/moves/callback', 
	    app.passport.authorize('moves', { failureRedirect: '/' }),
	    function(req, res) {
		res.redirect('/heatmap/view');
	    });
    app.get('/auth/strava',
	    app.passport.authorize(
		'strava',
		{
		    scope: 'view_private,write'
		})
	   );
    
    app.get('/auth/strava/callback', 
	    app.passport.authorize('strava', { failureRedirect: '/' }),
	    function(req, res) {
		
		res.redirect('/heatmap/view');
	    });
};