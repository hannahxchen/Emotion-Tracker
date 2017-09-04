var express = require('express');
var router = express.Router();
var Token = require('../models/token');
var User = require('../models/user');
var Face = require('../models/face');
var moment = require('moment');

router.get('/user', function(req, res){
  //console.log(req.headers.key);
  Token.findToken(req.headers.key, function(err, key){
    if(err) throw err;
    if(!key) res.json({success: false, message: 'Authentication failed. Token key not found.'});
    else{
      User.find({}, function(err, users) {
        if(err) throw err;
        res.json({success: true, user: users});
      }).select("-password -_v");
    }
  });
});

router.post('/user', function(req, res){
  Token.findToken(req.headers.key, function(err, key){
    if(err) throw err;
    if(!key) res.json({success: false, message: 'Authentication failed. Token key not found.'});
    else{
      var query;
      if(req.body.username) query ={username : req.body.username};
	    else if(req.body.name) query ={name : req.body.name};
	    else if(req.body.role) query ={role : req.body.role};
	    else if(req.body.age) query ={age : req.body.age};
	    else if(req.body.gender) query ={gender : req.body.gender.toUpperCase()};
      User.find(query, function(err, data) {
        if(err) throw err;
        res.json({success: true, user: data});
      }).select("-password -_v");
    }
  });
});

router.post('/faceTracker', function(req, res){
  Token.findToken(req.headers.key, function(err, key){
    if(err) throw err;
    if(!key) res.json({success: false, message: 'Authentication failed. Token key not found.'});
    else{
      if(!req.body.username) res.json({success: false, message: 'Missing username parameter'});
	    else {
        var query ={username : req.body.username};
        Face.find(query, function(err, data) {
          if(err) throw err;
          res.json({success: true, face: data});
        }).select("-_v -_id");
      }
    }
  });
});

router.post('/userAuthenticate', function(req, res){
  Token.findToken(req.headers.key, function(err, key){
    if(err) throw err;
    if(!key) res.json({success: false, message: 'Authentication failed. Token key not found.'});
    if(!req.body.username || !req.body.password){
      res.json({success:false, message: 'Authentication failed. Missing parameters!'});
    }
    User.getUserByUsername(req.body.username, function(err, user){
      if(err) throw err;
      if(!user){
        res.json({success:false, message: 'Authentication failed. User not found!'});
      }
      else{
        User.validPassword(req.body.password, user.password, function(err, isMatch){
          if(err) throw err;
          if(isMatch){
            res.json({success: true, message: 'User is authenticated!'})
          } else {
            res.json({success: false, message: 'Authentication failed. Invalid password!'});
          }
        });
      }
    });
  });
});

router.post('/face/emotion', function(req, res){
  Token.findToken(req.headers.key, function(err, key){
    if(err) throw err;
    if(!key) res.json({success: false, message: 'Authentication failed. Token key not found.'});
    else{
      if(!req.body.username) res.json({success: false, message: 'Missing username parameter'});
	    else {
        var query ={username : req.body.username};
        Face.findOne(query, function(err, data) {
          if(err) throw err;
          var emotions = [];
          var obj = {};
          data.data.forEach(function(element){
            obj['emotions'] = element.emotion;
            obj['createdAt'] = element.createdAt;
            emotions.push(obj);
            obj = {};
          });
          res.json({success: true, username: data.username, data: emotions});
        }).select("-_v -_id");
      }
    }
  });
});

module.exports = router;
