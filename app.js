
var express = require('express');
var pg = require('pg');
var parseXML = require('xml2js').parseString;
var ejs = require('ejs');
var http = require('http');

var stopsCache = require(__dirname + '/stopsCache.json');

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
  var dir = (req.params.busDir).toUpperCase();

  var stopCacheKey = "" + rt + dir;
  if (stopCacheKey in stopsCache) {
    var stops = stopsCache[stopCacheKey];
    var numStops = stops.length;
    var unsortedStops = [];
    //console.log("Distances to stops");
    for (var i = 0; i<numStops; i++) {
      unsortedStops.push({});
      unsortedStops[i].responseObj = {};
      unsortedStops[i].responseObj.stopID = stops[i].stopID;
      unsortedStops[i].responseObj.stopName = stops[i].stopName;
      unsortedStops[i].responseObj.distance = haversineDistance(lat,lng,stops[i].lat,stops[i].lon);
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
  } else {
    res.send("Could not find route "+stopCacheKey+" in cache.");
  }
}

var findStops = function(req, res){
  var rt = req.params.route; // need to validate stuff!
  var lat = parseFloat(req.params.lat);
  var lng = parseFloat(req.params.lng);
  var dir = (req.params.busDir).toUpperCase();

  var stopCacheKey = "" + rt + dir;
  if (stopCacheKey in stopsCache) {
    res.json(stopsCache[stopCacheKey]);
  } else {
    res.send("Could not find route "+stopCacheKey+" in cache.");
  }
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
        if (!predictions) {res.send("Error: " + data.error[0].msg); return;}
        var numPred = predictions.length;
        var jsonResponse = [];
        for (var i = 0; i<numPred; i++) {
          jsonResponse.push({});
          jsonResponse[i].age = 0;
          jsonResponse[i].prediction = to8601(predictions[i].prdtm[0]);
          jsonResponse[i].delayed = (predictions[i].dly && predictions[i].dly[0] ? true : false);
          jsonResponse[i].route = predictions[i].rt[0];
          jsonResponse[i].direction = predictions[i].rtdir[0];
        }
        res.json(jsonResponse);
      });
    });
  });
  console.log("Sending request to BusTime (predictions)");
  request.on('error', function(e) {
    console.log('Problem with request: ' + e.message);
  });
  request.end();
};

var getRoutesAvailable = function(req, res) {
  var routes = [];
  routes.push({
    "route": 21,
    "direction": "EAST"
  });
  routes.push({
    "route": 21,
    "direction": "WEST"
  });
  res.json(routes);
}

var generateStopsCache = function(req, res) {
  console.log("STOPS CACHE FUNCTION NOT AVAILABLE");
}

var to8601 = function (timeStr) {
  var timezone = "-05:00";
  return timeStr.substring(0,4) + "-" + timeStr.substring(4,6) + "-" + timeStr.substring(6,8) + "T" + timeStr.substring(10,15) + timezone;
}

var getPredictionsNearest = function(req, res) {
  var lat = parseFloat(req.params.lat);
  var lng = parseFloat(req.params.lng);
  var shortestDist, currentDist;
  var closestIndex = [];
  var bestForRoute = [];
  for (var i = 0; i < 2; i++) {
    var stops = stopsCache[(["21EAST","21WEST"])[i]];
    var numStops = stops.length;
    shortestDist = 100000;
    for (var j = 0; j < numStops; j++) {
      currentDist = haversineDistance(lat,lng,stops[j].lat,stops[j].lon);
      if (currentDist < shortestDist) {
        shortestDist = currentDist;
        closestIndex[i] = j;
      }
    }
    bestForRoute[i] = shortestDist;
  }

  var chosenStop = {};
  if (bestForRoute[0] < bestForRoute[1]) {
    stops = stopsCache["21EAST"];
    chosenStop = stops[closestIndex[0]];
    chosenStop.dist = bestForRoute[0];
  } else {
    stops = stopsCache["21WEST"];
    chosenStop = stops[closestIndex[1]];
    chosenStop.dist = bestForRoute[1];
  }
  var returnedStop = {};
  var stpid = returnedStop.stopID = chosenStop.stopID;
  returnedStop.stopName = chosenStop.stopName;
  returnedStop.distance = chosenStop.dist;

  var rt = 21;
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
        if (!predictions) {res.send("Error: " + data.error[0].msg); return;}
        var numPred = predictions.length;
        var jsonResponse = []
        for (var i = 0; i<numPred; i++) {
          jsonResponse.push({});
          jsonResponse[i].age = 0;
          jsonResponse[i].prediction = to8601(predictions[i].prdtm[0]);
          jsonResponse[i].delayed = (predictions[i].dly && predictions[i].dly[0] ? true : false);
          jsonResponse[i].route = predictions[i].rt[0];
          jsonResponse[i].direction = predictions[i].rtdir[0];
        }
        res.json(jsonResponse);
      });
    });
  });
  console.log("Sending request to BusTime (predictions)");
  request.on('error', function(e) {
    console.log('Problem with request: ' + e.message);
  });
  request.end();
}

app.get('/predictions/nearest/:lat/:lng', getPredictionsNearest);
app.get('/predictions/:stopID', getPredictions);
app.get('/times/:stopID', getPredictions);
app.get('/next/:stopID', getPredictions);
app.get('/stop/:route/:busDir/:lat/:lng', findNearestStop);
app.get('/stop/:route/:busDir', findStops);
app.get('/routes', getRoutesAvailable);



/*
app.use(function(req, res) { //direct 404s to /views/404.html
  console.log("404 on request: "+req);
  res.render('404.html', { status: 404 });
});
*/

var server = app.listen(3000, function() {
    console.log('Listening on port %d', server.address().port);
}); // begin the http server

