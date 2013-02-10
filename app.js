
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , mongoose = require('mongoose')
  , path = require('path')
  , config = require('./configLoad.js'); 

var app = express();

mongoose.connect("mongodb://" + config.user + ":" + config.pass + "@linus.mongohq.com:10084/calc_test")

var Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;

var userSchema = new Schema({
    userid    : ObjectId
  , name      : String
  , date      : Date
});

var pairSchema = new Schema({
    users         : [Schema.Types.ObjectId]
    , difference  : Number
    , owe         : ObjectId
});

var itemSchema = new Schema({
    user     : ObjectId
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

app.get('/user/:userId', function(req,res) {

});

app.post('/user', function(req,res) {
  // Make an account 

});

app.get('/list/:userid/:page', function(req,res) {
  var instance = new userModel();
  instance.my.key = 'hello';
  instance.save(function (err) {
    //
  });
});

app.post('/add/:userid/:amount/:type/:date', function(req,res) {


});


app.get('/difference/:userid/:difference', function(req,res) {

});



http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
