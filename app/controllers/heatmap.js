var mongoose = require("mongoose");
var User = mongoose.model("User");
var Heatmap = mongoose.model("Heatmap");
var moment = require("moment");
var Moves = require("moves");
var Strava = require("strava");
var async = require("async");
function isAuthenticated (req, res, next){
    if (req.isAuthenticated()) {
	res.locals.user = req.user;
        next();
    } else {
        res.redirect("/login");
    }
}
function f(thing) {
    return thing.format("YYYYMMDD");
}

function mkDates(last_post, excludes) {
    var now = moment();
    var diff = moment(now).diff(last_post, 'days');
    var lowEnd = 1;
    var highEnd = diff;
    var arr = [];
    while(lowEnd <= highEnd){
	arr.push(f(moment(now).subtract(lowEnd++, 'days')));
    }
    if (excludes) {
	var filtered = arr.filter(function(x) { 
	    return excludes.indexOf(x) < 0;
	});
	return filtered;
    } 
    return arr;
}
if (Number.prototype.toRad === 'undefined') {
    Number.prototype.toRad = function() {
	return this * Math.PI / 180;
    };
}
function metrics(a, b) {
    var lat1 = parseFloat(a.lat), lat2 = parseFloat(b.lat), lon1 = parseFloat(a.lon), lon2 = parseFloat(b.lon);
    var R = 3958.75587; //miles
    var dLat = (lat2-lat1)* Math.PI / 180;
    var dLon = (lon2-lon1)* Math.PI / 180;
    lat1 = lat1* Math.PI / 180;
    lat2 = lat2* Math.PI / 180;

    var x = Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2); 
    var c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1-x)); 
    return {distance:R * c, time:Math.abs(a.time-b.time), speed:(R*c)/Math.abs(a.time-b.time)};
}
function color(value) {
    var colors = ["#9106D3", "#AA01BE", "#C101A7", "#D5078E", "#E61175", "#F31F5C", "#FB3244", "#FE472F", "#FD5F1D", "#F6780F", "#EA9106", "#DBAA01", "#C7C101", "#B1D507", "#99E611"];
    return colors[(function(from, to, s) {
	return to[0] + (s - from[0]) * (to[1] - to[0]) / (from[1] - from[0]);
    }([0, 100], [0, 15], value))];
}
module.exports = function(app) {
    app.get("/heatmap/view", isAuthenticated, function(req, res) {
	res.render("heatmap.html");
    });
    app.get("/heatmap/json", isAuthenticated, function(req, res) {
	Heatmap.findOne({owner:req.user._id}, function(err, map) {
	    res.json(map);
	});
    });
    app.get("/heatmap/generate", isAuthenticated, function(req, res) {
	var user = req.user;
	var fetchers = [];
	if (user.moves) {
	    var moves = new Moves({
		client_id: process.env.MOVES_CLIENT_ID,
		client_secret: process.MOVES_CLIENT_SECRET,
		redirect_uri: process.MOVES_CALLBACK_URL,
		access_token: user.moves.access_token,
		refresh_token: user.moves.refresh_token
	    });
	    fetchers.push(function(callback) {
		moves.user.storyline.all({trackPoints:true}, function(err, res) {
		    async.reduce(res, [], function(memo, item, callback) {
			callback(null, memo.concat(item.segments));
		    }, function(err, result) {
			async.reduce(result, [], function(memo, item, callback) {
			    if (item && item.activities) {
				callback(null, memo.concat(item.activities));
			    } else {
				callback(null, memo);
			    }
			}, function(err, result) {
			    async.reduce(result, [], function(memo, item, callback) {
				callback(null, memo.concat(item.trackPoints.map(function(item) {
				    return {
					lat:item.lat, 
					lon:item.lon, 
					time:parseInt(moment(item.time, "YYYYMMDDTHHmmssZ").format("X"), 10)
				    };
				})));
			    }, function(err, result) {
				callback(err, result);
			    });
			});
		    });
		});
	    });
	}
	if (user.strava) {
	    var strava = new Strava({
		client_id: process.env.STRAVA_CLIENT_ID,
		client_secret: process.STRAVA_CLIENT_SECRET,
		redirect_uri: process.STRAVA_CALLBACK_URL,
		access_token: user.strava.access_token,
		refresh_token: user.strava.refresh_token
	    });
	    fetchers.push(function(callback) {
		strava.athlete.activities.get({paginated:true}, function(err, activities) {
		    console.log(activities.length);
		    async.concat(activities, function(activity, callback) {
			strava.activities.streams.get(activity.id, ["time", "latlng"], {}, function(err, stream) {
			    var dataSets = 	function(streams) {
				var ret = {};
				for (var i in streams) {
				    ret[streams[i].type] = streams[i];
				}
				return ret;
			    }(stream);
			    var start = moment(activity.start_date);
			    if (dataSets.latlng && dataSets.time) {
				var ret = dataSets.latlng.data.map(function(item, index) {
				    return {
					time:parseInt(moment(start).add(dataSets.time.data[index], "seconds").format("X")),
					lat:item[0],
					lon:item[1]
				    };
				});
//				console.log(ret);
				return callback(null, ret);
			    }
			    return callback(null, []);
			});
		    }, callback);
		});
	    });
	}
	var Allpoints = [];
	    
	async.parallel(fetchers, function(err, results) {
	    points = results.reduce(function(a, b) {
		return a.concat(b);
	    }).sort(function(a, b) {return a.time - b.time});
	    function split(points) {
		var ret = [];
		var chunk = [];
		var max_speed = 0;
		for (var i = 1; i < points.length; i++) {
		    var measurements = metrics(points[i], points[i-1]);
		    if ((measurements.time > 4*60) || (measurements.speed > (100/3600))) {
			ret.push({split:chunk});
			chunk = [points[i]];
			
		    } else {
			chunk.push(points[i]);
		    }
		}
		return ret;
	    }
	    var hm = {
		owner:user._id,
		points:points,
		splits:split(points)
	    };
	    if (hm.points.length > 0 && hm.splits.length > 0) {
		Heatmap.update({owner:user._id}, hm, {upsert:true}, function(err, doc) {
		    res.send(200);
		});
	    }
	});
    });
};