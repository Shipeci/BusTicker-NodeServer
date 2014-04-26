
var express = require('express');
var postgres = require('pg');
var xml2js = require('xml2js');
var ejs = require('ejs');

var app = express();
app.set('port', process.env.PORT || 3000);
app.use(express.static(__dirname + '/public'));
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');


app.engine('html', ejs.renderFile); //set HTML files to be rendered by ejs


app.get('/', function(req, res){ // example get request routing the '/' directory to the results of this anonymous function
  res.send('Welcome to BusTicker!');
});

app.get('/test', function(req, res){ // example get request routing /test to /views/test.html
  res.render('test.html',{});
});

app.use(function(req, res) { //direct 404s to /views/404.html
  console.log("404 on request: "+req);
  res.render('404.html', { status: 404 });
});

/*
app.use(function(err, req, res, next){
  console.error("req: "+req +"\nerror:"+err.stack);
  res.statusCode = 500;
  res.render('error',{error:err});
});
*/

var server = app.listen(3000, function() {
    console.log('Listening on port %d', server.address().port);
}); // begin the http server