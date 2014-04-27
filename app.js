
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

app.get('/stop/:stopID/:busDir', function(req, res){
  var apikey = "HWbvqrH8fJgqZ2PPRS6UyfBaW";
  var rt = 21;
  var stpid = req.params.stopID;
  if (req.params.busDir in )
  var pathString = '/bustime/api/v1/getpredictions?key='+apikey+'&rt='+rt+'&stpid='+stpid;
  if (direction) {pathString += '&dir='+direction;}

  var options = {
    host : 'realtime.ridemcts.com',
    path : pathString,
    //port : 80,
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
          //console.log(predictions[i]);
          jsonResponse.push({});
          //jsonResponse[i].order = i;
          jsonResponse[i].age = 0;
          jsonResponse[i].prediction = predictions[i].prdtm[0];
          jsonResponse[i].delayed = (predictions[i].dly ? true : false);
          jsonResponse[i].route = predictions[i].rt;
          jsonResponse[i].direction = predictions[i].rtdir;
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
});

/*
app.use(function(req, res) { //direct 404s to /views/404.html
  console.log("404 on request: "+req);
  res.render('404.html', { status: 404 });
});
*/

var server = app.listen(3000, function() {
    console.log('Listening on port %d', server.address().port);
}); // begin the http server

