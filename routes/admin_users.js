var express = require('express');
var router = express.Router();
var User = require('../models/user').User;
var Relation = require('../models/user').Relation;
var RelationType = require('../models/user').RelationType;
var TaskType = require('../models/task').TaskType;
var async = require('async');
var moment = require('moment');

function ensureAuthenticated(req, res, next){
	if(req.isAuthenticated()){
		return next();
	} else {
		req.flash('error_msg','您還尚未登入！');
		res.redirect('/login');
	}
}

router.get('/', ensureAuthenticated, function(req, res){
  async.parallel({
    getUsers: function(callback){
      User.find().populate('group').lean().exec(function(err, users){
        if(err) callback(true);
        else callback(null, users);
      });
    },
    getTaskTypes: function(callback){
      TaskType.find({}).lean().exec(function(err, types){
        if(err) callback(true);
        else callback(null, types);
      });
    }
  }, function(err, results){
    if(err) console.log(err);
    else res.render('manage_users', {users: results.getUsers, taskTypes: results.getTaskTypes});
  });
});

module.exports = router;
