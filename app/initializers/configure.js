
var express = require("express");
var MongoStore = require('connect-mongo')(express);
module.exports = function(app) {
    console.log("Configuring Express");
    console.log(__dirname);
    app.use(express.errorHandler({ showStack: true, dumpExceptions: true }));
    app.set('port', process.env.PORT || 30005);
    app.set('views', __dirname+'/../views');
    app.set('view engine', 'html');
    app.engine('html', require("hogan-express"));
    app.set('layout', 'layout');
    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.cookieParser());
    app.use(express.bodyParser());
    app.use(express.session({
	secret: "keyboard cat",
	store: new MongoStore({
	    url: process.env.DB_URL
	})
    }));
    app.use(app.passport.initialize());
    app.use(app.passport.session());
    app.use(express.methodOverride());
    app.use(app.router);
    app.use("/public", express.static(__dirname+'/../../public'));
    app.use(function(err, req, res, next){
	res.status(err.status || 500);
	console.log(err.stack);
	res.render('500', { error: err });
    });
    
    app.use(function(req, res, next){
	res.status(404);
	if (req.accepts('html')) {
	    res.render('404', { url: req.url });
	    return;
	}
	if (req.accepts('json')) {
	    res.send({ error: 'Not found' });
	    return;
	}
	res.type('txt').send('Not found');
    });   
};