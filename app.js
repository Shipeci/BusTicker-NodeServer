
var express = require('express');
var pg = require('pg');
var parseXML = require('xml2js').parseString;
var ejs = require('ejs');
var http = require('http');

var app = express();
app.set('port', process.env.PORT || 3000);
app.use(express.static(__dirname + '/public'));
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');


app.engine('html', ejs.renderFile); //set HTML files to be rendered by ejs


app.get('/', function(req, res){ // example get request routing the '/' directory to the results of this anonymous function
  res.send('Welcome to BusTicker!');
});

/*
app.use(function(err, req, res, next){
  console.error("req: "+req +"\nerror:"+err.stack);
  res.statusCode = 500;
  res.render('error',{error:err});
});
*/

var apikey = "HWbvqrH8fJgqZ2PPRS6UyfBaW"; //get this out of here

var haversineDistance = function(lat1, lon1, lat2, lon2) {
  // thanks to http://andrew.hedges.name/experiments/haversine/
  var d2r = function (degrees) {return degrees*Math.PI/180;}
  lat1 = d2r(lat1);
  lat2 = d2r(lat2);
  lon1 = d2r(lon1);
  lon2 = d2r(lon2);
  var dlon = lon2 - lon1;
  var dlat = lat2 - lat1;
  var a = Math.pow((Math.sin(dlat/2)),2) + Math.cos(lat1) * Math.cos(lat2) * Math.pow((Math.sin(dlon/2)),2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a) );
  return (3958.7 * c);
}

var findNearestStop = function(req, res){
  var rt = req.params.route; // need to validate stuff!
  var lat = parseFloat(req.params.lat);
  var lng = parseFloat(req.params.lng);
  var dir = req.params.busDir;
  var pathString = '/bustime/api/v1/getstops?key='+apikey+'&rt='+rt+"&dir="+dir;

  var options = {
    host : 'realtime.ridemcts.com',
    path : pathString,
    method : 'GET'
  }

  var request = http.request(options, function(response){
    var body = ""
    response.on('data', function(data) {
      body += data;
    });
    response.on('end', function() {
      parseXML(body, function(err, result) {
        var data = result['bustime-response'];
        var stops = data['stop'];
        var numStops = stops.length;
        var unsortedStops = [];
        //console.log("Distances to stops");
        for (var i = 0; i<numStops; i++) {
          unsortedStops.push({});
          unsortedStops[i].responseObj = {};
          unsortedStops[i].responseObj.stopID = parseInt(stops[i].stpid[0]);
          unsortedStops[i].responseObj.stopName = stops[i].stpnm[0];
          unsortedStops[i].responseObj.distance = haversineDistance(lat,lng,stops[i].lat[0],stops[i].lon[0]);
          //console.log("Stop "+stops[i].stpnm[0]+" is "+unsortedStops[i].responseObj.distance);
        }

        var sortedStops = [];
        var shortestDist, currentDist, closestIndex, len, currentObj;
        while (unsortedStops.length > 1) {
          len = unsortedStops.length;
          shortestDist = 100000;
          for (var i = 0; i<len; i++) {
            currentDist = unsortedStops[i].responseObj.distance
            if (currentDist < shortestDist) {
              shortestDist = currentDist;
              closestIndex = i;
            }
          }
          currentObj = unsortedStops.splice(closestIndex, 1)[0].responseObj;
          //console.log(currentObj);
          sortedStops.push(currentObj);
        }
        res.json(sortedStops);
      });
    });
  });
  request.on('error', function(e) {
    console.log('Problem with request: ' + e.message);
  });
  request.end();
}

var getPredictions = function(req, res){
  var rt = 21;
  var stpid = req.params.stopID;
  //var checkDir = false;
  var pathString = '/bustime/api/v1/getpredictions?key='+apikey+'&rt='+rt+'&stpid='+stpid;
  /* if (["EAST", "WEST", "NORTH", "SOUTH"].indexOf(req.params.busDir) > -1) {
    checkDir = true;
  } */

  var options = {
    host : 'realtime.ridemcts.com',
    path : pathString,
    method : 'GET'
  }

  var request = http.request(options, function(response){
    var body = ""
    response.on('data', function(data) {
      body += data;
    });
    response.on('end', function() {
      parseXML(body, function(err, result) {
        var data = result['bustime-response'];
        var predictions = data['prd'];
        var numPred = predictions.length;
        var jsonResponse = [];
        for (var i = 0; i<numPred; i++) {
          jsonResponse.push({});
          jsonResponse[i].age = 0;
          jsonResponse[i].prediction = predictions[i].prdtm[0];
          jsonResponse[i].delayed = (predictions[i].dly && predictions[i].dly[0] ? true : false);
          jsonResponse[i].route = predictions[i].rt[0];
          jsonResponse[i].direction = predictions[i].rtdir[0];
        }
        res.json(jsonResponse);
      });
    });
  });
  console.log("request sent");
  request.on('error', function(e) {
    console.log('Problem with request: ' + e.message);
  });
  request.end();
};

app.get('/predictions/:stopID', getPredictions);
app.get('/times/:stopID', getPredictions);
app.get('/next/:stopID', getPredictions);
app.get('/stop/:route/:busDir/:lat/:lng', findNearestStop);

/*
app.use(function(req, res) { //direct 404s to /views/404.html
  console.log("404 on request: "+req);
  res.render('404.html', { status: 404 });
});
*/

var server = app.listen(3000, function() {
    console.log('Listening on port %d', server.address().port);
}); // begin the http server

