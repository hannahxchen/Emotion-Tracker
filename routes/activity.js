var express = require('express');
var router = express.Router();
var ActivityType = require('../models/activity').ActivityType;
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
  res.render('activity');
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

module.exports = router;
