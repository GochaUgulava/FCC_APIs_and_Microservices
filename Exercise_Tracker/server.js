'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var bodyParser = require("body-parser");
var cors = require('cors');


var app = express();


/**  project db  **/ 
mongoose.connect(process.env.MLAB_URI, { useUnifiedTopology: true, useNewUrlParser: true });
const connection = mongoose.connection;
connection.on('error', console.error.bind(console, 'connection error:'));
connection.once('open', () => {
  console.log('MongoDB database connection established successfully');
});

var ETSchema = new mongoose.Schema({
  username: {type: String, required: true},
  exercises: [{description: {type: String, required: true},
               duration: {type: Number,  required: true},
               date: { type: Date, default: Date.now }}]
});
var ETBASE = mongoose.model("ETBASE", ETSchema);


app.use(cors());
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(express.static('public'));

/**  DB manage functions  **/ 

const addUser = function(username, done){
  var newUser = new ETBASE({username: username});
  newUser.save((err, savedUser)=>{
    if(err) done(err);
    done(null, savedUser);
  });
};

const addExercise = function(inputData, done){
  var id = inputData[0];
  var objToAdd = inputData[1];
  ETBASE.findById(id, (err, user)=>{
    if (err) console.error(err);
    user.exercises.push(objToAdd);
    user.save((err, updatedUser)=>{
      if(err) done(err);
      done(null, updatedUser);
    });
  });
};

const findUsers = function(done){
  ETBASE.find()
        .select({username: 1, _id: 1})
        .exec((err, data)=>{
          if (err) done(err);
          done(null, data);
        });
};

const findLogs = function(userid, done){
  ETBASE.find({"_id": userid}, (err, userLog)=>{
    if(err) done(err);
    done(null, userLog);
  });
};


/**  API startpoint  **/ 

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


app.post('/api/exercise/new-user', (req, res)=>{
  let username = req.body.username;
  addUser(username, (err, data)=>{
    if (err) console.error(err);
    res.json({"username": data.username, "_id": data._id});
  });
});


app.post('/api/exercise/add', (req, res)=>{
  let userid = req.body.userId;
  let description = req.body.description;
  let duration = parseInt(req.body.duration);
  let date = req.body.date;
  if (userid==="" || description===""){
    res.json({"error": "userid, description and duration fields are required!"});
  }else if (!duration || duration<0){
    res.json({"error": "duration must be a positive number!"});
  }else{
    if (!/([12]\d{3}-(0?[1-9]|1[0-2])-(0?[1-9]|[12]\d|3[01]))/.test(date) || !date){
       date = new Date();
    }else{
       date = new Date(date + "Z");
    }
    let objToAdd = {description: description, duration: duration, date: date};
    addExercise([userid, objToAdd], (err, data)=>{
      if (data == null){
          res.send({"error":"User not found"});
      }else{
          if (err) console.error(err);
          res.json({"username": data.username,
                    "description": data.exercises[data.exercises.length - 1].description,
                    "duration": data.exercises[data.exercises.length - 1].duration,
                    "_id": data._id, 
                    "date": data.exercises[data.exercises.length - 1].date.toDateString()
                   });
        };
    });
  };
});


app.get('/api/exercise/users', (req, res)=>{
  findUsers((err, data)=>{
    if(err) console.error(err);
    res.json(data);
  });
});


app.get('/api/exercise/log', (req,res)=>{
  let userid = req.query.userId;
  let from = req.query.from;
  let to = req.query.to
  let limit = parseInt(req.query.limit);
  if (!userid){
      res.json({"error": "incorrect query request"});
  }else{
      if (!from && !to && !limit){
          findLogs(userid, (err, userLog)=>{
            if (err) console.error(err);
            res.json({"_id": userLog[0]._id,
                      "username": userLog[0].username,
                      "count": userLog[0].exercises.length,
                      "log": userLog[0].exercises
                      });
          });
      }else if (limit>0){
          findLogs(userid, (err, userLog)=>{
            if (err) console.error(err);
            if (userLog[0].exercises.length<limit) limit = userLog[0].exercises.length;
            res.json({"_id": userLog[0]._id, 
                      "username": userLog[0].username,
                      "count": limit,
                      "log": userLog[0].exercises.slice(0,limit)});
          });
      }else if (/([12]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]))/.test(from) &&
               /([12]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]))/.test(to)){
        let fromDate = new Date(from).getTime();
        let toDate = new Date(to).getTime();
        findLogs(userid, (err, userLog)=>{
            if (err) console.error(err);
            let logArr = userLog[0].exercises.filter(item=>{return(
                                                              (item.date.getTime()>=fromDate &&
                                                              item.date.getTime()<=toDate))})
            res.json({"_id": userLog[0]._id, 
                      "username": userLog[0].username,
                      "count": logArr.length,
                      "log": logArr
                     });
          });
      }else{
        res.json({"error": "incorrect query request"});
      };
  };
});


/**  API endpoint  **/ 

// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
