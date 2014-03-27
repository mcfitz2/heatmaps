var map, pointarray, heatmap;
function loading() {
    $(".map-canvas").html('<span class="icon-refresh-animate refresh-icon glyphicon glyphicon-refresh"></span>Regenerating...');
    $("#regen").html("Regenerating...");
}
function stopLoading() {
    $("#regen").html("Regenerate");
}
function initialize() {
    $.getJSON("/heatmap/json", function(data) {
	if (data && data.splits && data.points && data.splits.length > 0 && data.points.length > 0) {
	    var mapOptions = {
		zoom: 13,
		center: new google.maps.LatLng(data.points[0].lat, data.points[0].lon),
		mapTypeId: google.maps.MapTypeId.SATELLITE
	    };
	    
	    map = new google.maps.Map(document.getElementById('m1'), mapOptions);
	    map2 = new google.maps.Map(document.getElementById('m2'), mapOptions);
	    var pointArray = new google.maps.MVCArray(data.points.map(function(item) {
		return new google.maps.LatLng(item.lat, item.lon);
	    }));
	    
	    heatmap = new google.maps.visualization.HeatmapLayer({
		data: pointArray, 
	    });
	    
	    heatmap.setMap(map);
	    for (var i = 0; i < data.splits.length; i++) {
		new google.maps.Polyline({
		    path: data.splits[i].split.map(function(item) {
			return new google.maps.LatLng(item.lat, item.lon);
		    }),
		    geodesic: true,
		    strokeColor: '#FF0000',
		    strokeOpacity: 1.0,
		    strokeWeight: 2
		}).setMap(map2);
	    }
	} else {
	    $("#regen").html("Generating...").show();
	    loading();
	    $.get("/heatmap/generate", function(data, textStatus) {
		initialize();
		stopLoading();
	    }).fail(function() {
		$("#regen").html("Regenerate");
		$(".map-canvas").html("<p>There was an issue generating your maps. Please try again.</p>");
	    });
	}
    });
}	
google.maps.event.addDomListener(window, 'load', initialize);
$("#regen").on("click", function(el) {
    var btn = $(this);
    loading();
    $.get("/heatmap/generate", function(data, textStatus) {
	initialize();
	stopLoading();
    }).fail(function() {
	$("#regen").html("Regenerate");
	$(".map-canvas").html("<p>There was an issue generating your maps. Please try again.</p>");
    });
});
