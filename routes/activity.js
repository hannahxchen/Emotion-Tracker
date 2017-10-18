var express = require('express');
var router = express.Router();
var async = require('async');
var moment = require('moment');
var ActivityType = require('../models/activity').ActivityType;
var Activity = require('../models/activity').Activity;
var activity_function = require('../models/activity');
var multer  =   require('multer');
var storage =   multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, './uploads/activityCover');
  },
  filename: function (req, file, callback) {
    callback(null, file.fieldname + '_' + Date.now() + '.jpg');
  }
});
var upload = multer({ storage : storage});

router.get('/', function(req, res){
  async.parallel({
  	getType: function(callback){
  		ActivityType.find({}, function(err, docs){
  		    if(err) throw err;
  		    var types = [];
  		    docs.forEach(function(element){
  		      types.push(element.type);
  		    });
  		    callback(null, types);
  		});
  	},
  	getLatest: function(callback){
  		Activity.find({}).sort('-createdAt').limit(3).exec(function(err, docs){
  			if(err) throw err;
  			callback(null, docs);
  		});
  	},
  }, function(err, results){
  	res.render('activity', {types: results.getType, latest: results.getLatest, moment: moment});
  });
});

router.get('/myCalendar', function(req, res){
  res.render('myCalendar');
});

router.get('/all', function(req, res){
  res.render('activityAll');
});

router.get('/upload', function(req, res){
  ActivityType.find({}, function(err, docs){
    if(err) throw err;
    var types = [];
    docs.forEach(function(element){
      types.push(element.type);
    });
    res.render('uploadActivity', {types: types, errors: false, success_msg: false});
  });
});

router.post('/upload', upload.single('coverPhoto'), function(req, res){
  var title = req.body.title;
  var contactPerson = req.body.contactPerson;
  var email = req.body.email;
  var tel = req.body.tel;

  req.checkBody('title', '活動名稱為必填').notEmpty();
  req.checkBody('contactPerson', '聯絡人為必填').notEmpty();
  req.checkBody('email', 'Email 為必填').notEmpty();
	req.checkBody('email', 'Email 格式錯誤').isEmail();
  req.checkBody('tel', '電話為必填').notEmpty();

  var errors = req.validationErrors();

  if(errors){
    ActivityType.find({}, function(err, docs){
      if(err) throw err;
      var types = [];
      docs.forEach(function(element){
        types.push(element.type);
      });
      res.render('uploadActivity', {types: types, errors: errors});
    });
	} else {
    if(req.file) activity_function.createActivity(req.body, req.file.destination + '/' + req.file.filename, req.user.userID);
    else activity_function.createActivity(req.body, undefined);

    //req.flash('success_msg', '新增完成！');
    ActivityType.find({}, function(err, docs){
      if(err) throw err;
      var types = [];
      docs.forEach(function(element){
        types.push(element.type);
      });
      res.render('uploadActivity', {types: types, errors: false, success_msg: '新增完成'});
    });

  }
});

router.post('/getData', function(req, res){
  var query = {};
  if (req.body.activityID) query.activityID = req.body.activityID;
});

module.exports = router;
