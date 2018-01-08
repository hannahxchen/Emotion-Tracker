var express = require('express');
var router = express.Router();
var Task = require('../models/task').Task;
var TaskType = require('../models/task').TaskType;
var User = require('../models/user').User;
var async = require('async');

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
    getTasks: function(callback){
      Task.find({}).populate('task_type').lean().exec(function(err, tasks){
        if(err) console.log(err);
        else callback(null, tasks);
      });
    },
    getTaskTypes: function(callback){
      TaskType.find({}).lean().exec(function(err, types){
        if(err) console.log(err);
        else callback(null, types);
      });
    },
    getUsers: function(callback){
      User.find({role: 'elder'}).populate('group').lean().exec(function(err, users){
        if(err) console.log(err);
        else callback(null, users);
      });
    }
  }, function(err, results){
    if(err) console.log(err);
    else res.render('task', {tasks: results.getTasks, taskTypes: results.getTaskTypes, users: results.getUsers});
  });
});

router.post('/createTask', function(req, res){
  var task_id = [];
  TaskType.findOne({type: req.body.type}, function(err, type){
    if(err) console.log(err);
    else{
      async.each(req.body.object_id, function(object_id, callback){
        Task.create({applicant_id: req.user.userID, object_id: object_id, task_type: type._id, content: req.body.content, urgency: req.body.urgency}, function(err, task){
          if(err) res.json({error: true});
          else {
            task_id.push(task._id);
            callback();
          }
        });
      }, function(err){
        if(err) console.log(err);
        else{
          Task.find({_id: { $in: task_id}}).populate('task_type').lean().exec(function(err, tasks){
            if(err) console.log(err);
            else res.json({error: false, tasks: tasks});
          });
        }
      });
    }
  });
});

router.post('/createTaskType', function(req, res){
  TaskType.create({type: req.body.type}, function(err){
    if(err){
      console.log(err);
      res.json({error: true});
    }
    else
      res.json({error: false});
  });
});

router.post('/deleteTasks', function(req, res){
  Task.remove({_id: { $in: req.body.selected }}, function(err){
    if(err) res.json({error: true});
    else res.json({error: false});
  });
});

module.exports = router;
