var d3 = require('d3');
var firebase = require('firebase');
var $ = require('jquery');

var ref = new Firebase('https://popping-torch-7884.firebaseio.com/');

var width = $("#map").width(),
    height = $("#map").height(),
    country;

var projection = d3.geo.mercator()
        .scale(1)
		.translate([0, 0]);

var path = d3.geo.path().projection(projection);

var svg = d3.select("#map").append("svg")
    .attr("preserveAspectRatio", "xMidYMid")
    .attr("viewBox", "0 0 " + width + " " + height)
    .attr("width", width)
    .attr("height", height);

ref.child('sessions')
.orderByChild("timestamp")
.startAt(Date.now() - (60000 * 60 * 24 * 7))
.endAt(Date.now() - (60000 * 60 * 24))
.on('child_added', function(snapshot) {

    var data = snapshot.val();
    var latlon = projection([data.lon, data.lat]);
    svg.append('line')
        .attr('class', 'sessionmarker-week')
        .attr('x1', latlon[0])
        .attr('y1', latlon[1])
        .attr('x2', latlon[0])
        .attr('y2', latlon[1])
        .attr('r', '5px'); 
});

ref.child('sessions')
.orderByChild("timestamp")
.startAt(Date.now() - (60000 * 60 + 1))
.on('child_added', function(snapshot) {

    var data = snapshot.val();
    var latlon = projection([data.lon, data.lat]);
    svg.append('line')
        .attr('class', 'sessionmarker')
        .attr('x1', latlon[0])
        .attr('y1', latlon[1])
        .attr('x2', latlon[0])
        .attr('y2', latlon[1])
        .attr('r', '5px'); 
});

svg.append("rect") 
    .attr("class", "background")
    .attr("width", width)
    .attr("height", height)
    .on("click", country_clicked);

var g = svg.append("g");

d3.json('world.geo.json', function(error, world) {
    

    b = path.bounds(world),
        s = .95 / Math.max((b[1][0] - b[0][0]) / width, (b[1][1] - b[0][1]) / height),
        t = [(width - s * (b[1][0] + b[0][0])) / 2, (height - s * (b[1][1] + b[0][1])) / 2];

    projection
        .scale(s)
        .translate(t);

    g.append("g")
        .attr("id", "countries")
        .selectAll("path")
        .data(world.features)
        .enter()
        .append("path")
        .attr("id", function(d) { return d.id; })
        .attr("d", path)
        .on("click", country_clicked);
        
});

function zoom(xyz) {
    g.transition()
        .duration(750)
        .attr("transform", "translate(" + projection.translate() + ")scale(" + xyz[2] + ")translate(-" + xyz[0] + ",-" + xyz[1] + ")")
        .selectAll(["#countries"])
        .style("stroke-width", 1.0 / xyz[2] + "px")
        
        d3.selectAll('.sessionmarker, .sessionmarker-week').transition()
        .duration(750)
        .attr("transform", "translate(" + projection.translate() + ")scale(" + xyz[2] + ")translate(-" + xyz[0] + ",-" + xyz[1] + ")");
}

function get_xyz(d) {
    var bounds = path.bounds(d);
    var w_scale = (bounds[1][0] - bounds[0][0]) / width;
    var h_scale = (bounds[1][1] - bounds[0][1]) / height;
    var z = .96 / Math.max(w_scale, h_scale);
    var x = (bounds[1][0] + bounds[0][0]) / 2;
    var y = (bounds[1][1] + bounds[0][1]) / 2 + (height / z / 6);
    return [x, y, z];
}

function country_clicked(d) {

    if (country) {
        g.selectAll("#" + country.id).style('display', null);
    }

    if (d && country !== d) {
        var xyz = get_xyz(d);
        country = d;

        zoom(xyz);

    } else {
        var xyz = [width / 2, height / 1.5, 1];
        country = null;
        zoom(xyz);
    }
}