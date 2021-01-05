'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var bodyParser = require("body-parser");
var cors = require('cors');
var shortId = require("shortid");


var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

/**  project db  **/ 
mongoose.connect(process.env.DB_URI, { useUnifiedTopology: true, useNewUrlParser: true });
const connection = mongoose.connection;
connection.on('error', console.error.bind(console, 'connection error:'));
connection.once('open', () => {
  console.log('MongoDB database connection established successfully');
});

var urlSchema = new mongoose.Schema({
  longUrl: String,
  shortUrl: String
});
var UrlBase = mongoose.model("UrlBase", urlSchema);


app.use(cors());
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use('/public', express.static(process.cwd() + '/public'));


/** DB manage functions **/

var findDoc = function(objToFind, done){
      UrlBase.findOne(objToFind, (err, data)=>{
      if (err)  done(err);
      done (null, data)});
}

var addDoc = function(resultObject, done){
  var newDoc = new UrlBase(resultObject);
  newDoc.save((err, data)=>{
    if (err) done(err);
    done(null, data);
  });
}


//   API startpoint... 

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});


app.post('/api/shorturl/new', function(req, res){
  let inputUrl = req.body.url;
  if (/^(https?:\/\/)([^\s\/$.?\-#])+(\.[^\s\/$.?\-#]+)+(\/[^\s\.]+)*\/?$/gi.test(inputUrl)){
      let newShortUrl = shortId.generate();
      findDoc({longUrl: inputUrl}, (err, data)=>{
        if (err) console.error(err);
        if (data){
          res.json({"original_url": data.longUrl,"short_url": data.shortUrl});
        }else{
          let resultObject = {longUrl: inputUrl, shortUrl: newShortUrl};
          addDoc(resultObject, (err, data)=>{
             if (err) console.error(err);
             res.json({"original_url": data.longUrl,"short_url": data.shortUrl});
          });
        };
     }); 
  }else{
      res.json({"error":"invalid URL"})
  }
});
  

app.get('/api/shorturl/:value',  function(req, res){
  let inputUrl = req.params.value;
  findDoc({shortUrl: inputUrl}, (err, data)=>{
    if (err) console.error(err);
    if (data){
      res.redirect(data.longUrl);
    }else{
      res.json({"error":"invalid URL"});
    };
 });   
});


app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

//  API endpoint... 

app.listen(port, function () {
  console.log('Node.js listening ...');
});