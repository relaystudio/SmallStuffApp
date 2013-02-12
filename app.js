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
  , ObjectId = Schema.ObjectId;

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
  , date     : Date
  , amount   : String
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
  });
  res.send(user)
});


// Get a userid from email
app.get('/api/email/:email', function(req,res) {
  var user;
  
  userModel.find( { email : req.params.email} , function(err, result) {
    if(!result) user = "no user"
    else user = result;
  });

  console.log(user);
  res.send(user);
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
  }) 
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
  })
})


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
  var pairId = req.body.pairId || 0;
  var date = req.body.date || new Date().now();
  var amount = req.body.amount || 0;
  var type = 0;
  itemModel.create({
    userId         : userid
  , pairId         : 0
  , date           : date
  , amount         : amount
  , type           : type
  }, function(err, user) {
    if(err) console.log(err);
    //console.log("Item saved : " + users);
  })


});


app.get('/api/difference/:userid/:difference', function(req,res) {

  var diff;

/*
var itemSchema = new Schema({
    userId   : ObjectId 
  , pairId   : ObjectId
  , date     : Date
  , amount   : String
  , type     : String
});
*/

itemModel.aggregate([
        { $group: {
            userId: '$userId',
            amount: { $avg: '$amount'}
        }}
    ], function (err, results) {
        if (err) console.error(err);
        else console.log(results);
        
    }
);

  res.send(diff);
});

app.get('/api/getTestData', function(req,res) {
var testdata = [
  { 
    'userId' : '01234'
    , 'date' : new Date(2013,1,1).getUTCDate()
    , 'amount' : '24.99'
    , 'type' : 4 
  }, {
    'userId' : '01234'
    , 'date' : new Date(2013,1,10).getUTCDate()
    , 'amount' : '24.99'
    , 'type' : 4 
  }, {
    'userId' : '43210'
    , 'date' : new Date(2013,1,12).getUTCDate()
    , 'amount' : '24.99'
    , 'type' : 3 
  }, {
    'userId' : '01234'
    , 'date' : new Date(2013,1,15).getUTCDate()
    , 'amount' : '24.99'
    , 'type' : 3 
  }
]

  res.send(testdata)
}) 


function getPairId(userid) {
  var pairId;
  pairModel.findOne({'userId' : req.params.userid}, function(err, pair) {
    if(err) pairId = null
    else pairId = pair.pairId
  });
  return pairId;
}



http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
