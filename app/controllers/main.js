var mongoose = require("mongoose");
var User = mongoose.model("User");
var moment = require("moment");
function isAuthenticated (req, res, next){
    if (req.isAuthenticated()) {
	res.locals.user = req.user;
        next();
    } else {
        res.redirect("/login");
    }
}
module.exports = function(app) {
    app.get("/", isAuthenticated, function(req, res){ 
	res.redirect("/heatmap/view");
    });    
};