var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , mongoose = require('mongoose')
  , path = require('path')
  , config = require('./configLoad.js'); 

var app = express();
console.log("mongodb://" + config.user + ":" + config.pass + "@linus.mongohq.com:10084/calc_test");
mongoose.connect("mongodb://" + config.user + ":" + config.pass + "@linus.mongohq.com:10084/calc_test")

var Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId
  , objId = require('mongoose').Types.ObjectId; 

var userSchema = new Schema({
    userId    : ObjectId
  , name      : String
  , email     : String
  , date      : Date
});

var pairSchema = new Schema({
    pairId        : ObjectId
    , users       : [Schema.Types.ObjectId]
    , difference  : Number
    , owe         : ObjectId // -1 is equal, anything above is objID
});

var itemSchema = new Schema({
    userId   : ObjectId 
  , pairId   : ObjectId
  , netVal   : 0
  , weight   : { type: Number, default: .5 } // Weighting of how much goes into the calc
  , date     : { type: Date, default: Date.now }
  , amount   : Number
  , type     : String
});

var userModel = mongoose.model('user', userSchema, 'users');
var pairModel = mongoose.model('pair', pairSchema, 'pairs');
var itemModel = mongoose.model('item', itemSchema, 'items');

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});


// Check if a userid exists
app.get('/api/user/:userId', function(req,res) {
  var user;
  userModel.findOne({email : req.params.userId}, function(err, result) {
    if(!result) user = "No user"
    else user = result;
    res.send(user)
  });
});


// Get a userid from email
app.get('/api/email/:email', function(req,res) {
  var user;
  
  userModel.find( { email : req.params.email} , function(err, result) {
    if(!result) user = "no user"
    else user = result;
    console.log(user);
    res.send(user);
  });
}); 

// Create an account
// Need name only
app.post('/api/user', function(req,res) {
  userModel.create({
    name      : req.body.name
  , email     : req.body.email
  , date      : new Date()
  }, function(err, user) {
    if(err) return handleError(err);
    console.log("User saved: " + user);
  }); 
});

// Make a new pairing on the account
app.post('/api/makePair', function(req,res) {
  var userReturn = req.body.users;
  var users = userReturn.split(',')

  pairModel.create({
    users          : users
  , difference     : 0
  , owe            : users[Math.random(0,user.length-1)]
  }, function(err, user) {
    if(err) console.log(err);
    console.log("User saved : " + users);
  });
});


// Gets a list of items for that user
app.get('/api/list/:userid/:page?', function(req,res) {
  var pageAmount = 25;
  var page = req.params.page || 0;
  var pairId = getPairId(req.params.userid); // Returns pair id or null
  if(!pairId) { res.send('no pairing'); return } // If there's no pairing

  var query = itemModel.find({'pairId' : pairId})
  .sort('date', -1)
  .skip(page*pageAmount)
  .limit((page+1)*pageAmount)
  

  query.execFind( function(err, items){ // Exec the query


  });

  res.send(itemList)
});

app.post('/api/addItem', function(req,res) {
//:userid/:amount/:type/:date
  var userId = req.body.userid || 0;
  var date = req.body.date || new Date();
  var amount = req.body.amount || 0;
  var type = 0;
  var weight = req.body.weight || 0.5; // Default weight is .5
  var netVal = amount * weight; // ( (1 - weight) * 2 ); // Probably not right...

 getPairId(userId, function(pairId) {
    console.log("Pair id");
    itemModel.create({
      userId         : userId
    , pairId         : pairId
    , date           : date
    , weight         : weight
    , netVal         : netVal
    , amount         : amount
    , type           : type
    }, function(err, user) {
      if(err) console.log(err);
      console.log("Item saved : " + user);
    })
    res.send("Okay")
 }) || 0; // Checks if there is a pair id

});


app.get('/api/difference/:userid', function(req,res) {

  var diff;

  getPairId(req.params.userid, function(pairId) {
    calcDifference(pairId, function(difference) {
      res.send(difference);
    });
  });
});


function getPairId(userid, callback) {
  var pairId;
  pairModel.findOne({users : userid}, function(err, pair) {
    if(err) console.log(err);
    pairId = pair._id;
    console.log("Found " + pairId);
    //return pairId;
    callback(pairId);
  });
}

function calcDifference(pairId, callback) {
  var users = [];
  var difference;

  pairModel.findOne({_id : pairId}, function(err, pair) { // Find the user objects
    if(err) console.log(err);
    
    console.log("resturned " + pair);
    var userIds = JSON.stringify(pair["users"]).split(',');
    console.log("Parsed to " + userIds)
    var o = [];
    for(var key in userIds) {

        o[key] = {};
        o[key].theUserId = userIds[key].match('\"(.*?)\"')[1];
        o[key].map = function () { emit(this.netVal, 1) }
        o[key].reduce = function (k, vals) { return vals.length }
        o[key].query = function() { userId : o[key].theUserId }
        console.log("userId found " + o[key].theUserId);

    } // end user loop

    for( var key in o) {

        itemModel.aggregate(
              { $match: { userId: objId.fromString(o[key].theUserId) } }
            , { $group: { _id: "$userId",
                grossTotal: { $sum: '$amount' }, 
                weightedTotal: {$sum: '$netVal'},
                averageWeight: {$avg: '$weight'} }
              }

          // , { $project: { userId: 0, netVal: 1 }}
          , function (err, res) {
          if (err) console.log(err);
          console.log(res); // [ { maxAge: 98 } ]

          callback(res);
        });



// Tried map reduce, but kinda got it wrong...
/*        itemModel.mapReduce(o[key], function (err, results) {
          if(err) console.log(err);
          console.log("Res for " + o[key].theUserId + ": ");
          console.log(results)
        })*/
    }
  })
}

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
