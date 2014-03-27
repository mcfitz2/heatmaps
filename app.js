var express = require('express'),
fs = require('fs'),
http = require('http'),
path = require('path'),
mongoose = require('mongoose'),
passport = require("passport");








var app = express();
app.passport = passport;


mongoose.connect(process.env.DB_URL);
var models_dir = __dirname + '/app/models';
fs.readdirSync(models_dir).forEach(function (file) {
  if(file[0] === '.') return; 
  require(models_dir+'/'+ file);
});
fs.readdirSync("./app/initializers").forEach(function (file) {
  if(file[0] === '.') return; 
    require("./app/initializers/"+ file)(app);
});



fs.readdirSync("./app/controllers").forEach(function (file) {
  if(file[0] === '.') return; 
    if (fs.statSync("./app/controllers/"+file).isFile()) {
	require("./app/controllers/"+ file)(app);
    }
});

http.createServer(app).listen(app.get('port'), function () {
    console.log("Express server listening on port " + app.get('port'));
});
