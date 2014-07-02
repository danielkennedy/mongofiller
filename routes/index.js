var _ = require('underscore');
var async = require('async');
var mongoose = require('mongoose');
var validator = require('validator');
var randomstring = require('randomstring');
if(process.env.VCAP_SERVICES){
  var env = JSON.parse(process.env.VCAP_SERVICES);
  console.log('SERVICES:', process.env.VCAP_SERVICES);
  var obj = env['mongodb-1.8'][0]['credentials'];
  var mongo_url = "mongodb://" + obj.username + ":" + obj.password + "@" + obj.hostname + ":" + obj.port + "/" + obj.db;
} else {
  var mongo_url = 'mongodb://localhost/records';
}
console.log('Attempting Mongoose connection to', mongo_url);
mongoose.connect(mongo_url);

// When successfully connected
mongoose.connection.on('connected', function () {
  console.log('Mongoose default connection open to ' + mongo_url);
});

// If the connection throws an error
mongoose.connection.on('error',function (err) {
  console.log('Mongoose default connection error: ' + err);
});

// When the connection is disconnected
mongoose.connection.on('disconnected', function () {
  console.log('Mongoose default connection disconnected');
});

// If the Node process ends, close the Mongoose connection
process.on('SIGINT', function() {
  mongoose.connection.close(function () {
    console.log('Mongoose default connection disconnected through app termination');
    process.exit(0);
  });
});

var recordSchema = mongoose.Schema({
  string: String
});

var Record = mongoose.model('Record', recordSchema);

var C = function (callback) {
  console.log('CREATE');
  Record.create({ string: 'create' }, callback);
};
var R = function (record, callback) {
  console.log('READ', record);
  Record.findById(record._id, callback);
};
var U = function (record, callback) {
  console.log('UPDATE', record);
  Record.findByIdAndUpdate(record._id, {string: 'update'}, callback);
};
var D = function (record, callback) {
  console.log('DELETE', record);
  Record.findByIdAndRemove(record._id, callback);
};

exports.index = function(req, res){
  // PERFORM FULL CRUD AND OUTPUT THE FINAL RESULT
  async.waterfall([C, R, U, D], function (err, result) {
    var output = 'OK';
    if (!!err) {
      output = 'ERROR';
    }
    res.render('index', { output: output });
  })
};

exports.postData = function (req, res) {
  console.log('req.params:', req.params);
  if (validator.isNumeric(req.params.count)) {
    var count = req.params.count;
  } else {
    var count = 256;
  }
  var string = randomstring.generate(count * 1024);
  Record.create({ string: string }, function (err, result) {
    if (err) {
      res.send(500, err);
    } else {
      res.send(200, 'Stored ' + count + ' KB');
    }
  });
};
