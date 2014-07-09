var width = window.innerWidth,
	height = window.innerHeight;

var globe = d3.gl.globe()
	.width(width)
	.height(height)
	.texture("./world.200408.3x5400x2700.png")
	.transparency(function(body) {
		return 1;
	});

var windowCanvas = $("<canvas></canvas>")
  .attr({
    width: width,
    height: height
  })
  .css({
    position: "absolute"
  })
  .insertAfter("#globe-container")[0]
  .getContext("2d");

d3.select("#globe-container").call(globe)
  .style("margin-left", (-window.innerWidth/3)+"px")

var geos = [];

var points = globe.points()
  .data(geos)
  .latitude(function(d) { return d.coordinates[0]; })
  .longitude(function(d) { return d.coordinates[1]; })
  .radius(function(d) { return 1; })
  .color(function(d) { return d.selected ? "rgba(240,0,0,0.4)" : "rgba(60,60,60,0.4)"; })
  .lineWidth(function(d) { return 0; })
  .on("click", function() {
    console.log(arguments);
  })

window.g = globe;

var stream = new massrel.Stream('massreldemo', 'happy-birthday-geo');
var tweetContainer = $("#tweet-container")[0];

var poller = stream.poller({
  geo_hint: true,
  network: "twitter"
}).queue(function(tweet, step) {

  if(tweet.geo_hint) {
    if(geos.length) {
      geos[geos.length-1].selected = false;
    }
    tweet.geo_hint.selected = true;
    geos.push(tweet.geo_hint);

    var as_arr = [globe.rotation().lat, globe.rotation().lon]

    d3.transition()
      .duration(5000)
      .tween("rotateZoom", function() {

        var downFactor = 15;

        var r = d3.interpolate(as_arr, [tweet.geo_hint.coordinates[0], tweet.geo_hint.coordinates[1]+60]);
        var z = d3.interpolateZoom([as_arr[0], as_arr[1], globe.zoom()*downFactor], [tweet.geo_hint.coordinates[0], tweet.geo_hint.coordinates[1]+60, globe.zoom()*downFactor])

        return function(t) {

          var newRot = r(t);
          var newZoom = z(t);

          globe.rotation({
            lat: newRot[0],
            lon: newRot[1]
          });
          globe.zoom(newZoom[2]*(1/downFactor))
        }

      })
      .each("end", function() {
        setTimeout(step, 2500);
      })

    $(tweetContainer).empty().css("visibility", "hidden");

    twttr.widgets.createTweet(tweet.id_str, tweetContainer, {
      cards: 'hidden',
      theme: 'dark',
      conversation: 'none'
    }).then(function() {
      setTimeout(function() {
        $(tweetContainer).css("visibility", "visible");
      }, 1);
    })

  } else {
    setTimeout(step, 1);
  }

}).start();
