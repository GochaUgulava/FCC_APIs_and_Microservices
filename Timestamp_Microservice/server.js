// server.js
// where your node app starts

// init project
var express = require('express');
var app = express();

// enable CORS (https://en.wikipedia.org/wiki/Cross-origin_resource_sharing)
// so that your API is remotely testable by FCC 
var cors = require('cors');
app.use(cors({optionSuccessStatus: 200}));  // some legacy browsers choke on 204

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (req, res) {
  res.sendFile(__dirname + '/views/index.html');
});


// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

app.get("/api/timestamp/", function (req, res) {
  var dt = new Date();
  var obj = {"unix": dt.getTime(), "utc": dt.toUTCString()};
  res.json(obj);
});

app.get("/api/timestamp/:date_string", function (req, res) {
  var dt;
  var obj;
  if (/\d\d\d\d-\d\d-\d\d/g.test(req.params.date_string)){
      dt = new Date(req.params.date_string);
  }else if(/^[0-9]+$/g.test(req.params.date_string)){
      dt = new Date(parseInt(req.params.date_string));
  }else{
      dt = "Invalid Date";
  }
  if (dt=="Invalid Date"){
      obj = {"error" : "Invalid Date"};
  }else{
      obj = {"unix": dt.getTime(), "utc": dt.toUTCString()};
  }
  res.json(obj);
 
});


// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});