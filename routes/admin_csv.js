var express = require('express');
var router = express.Router();
var Activity = require('../models/activity').Activity;
var Enroll = require('../models/activity').Enroll;
var User = require('../models/user').User;
var RaspiLog = require('../models/raspberryPi').RaspiLog;
var sensorData = require('../models/raspberryPi').sensorData;
var Image = require('../models/image').Image;
var json2csv = require('json2csv');
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
  res.render('getCSV');
});

router.get('/activities', function(req, res){
  var fields = [
    {label: 'ActivityID', value: '_id'},
    {label: 'Title', value: 'title'},
    {label: 'ApplicantID', value: 'applicant_id'},
    {label: 'Type', value: 'activity_type.type'},
    {label: 'Start Time', value: function(row){
      return moment.utc(row.startTime).local().format('YYYY/MM/DD HH:mm:ss');
    }},
    {label: 'End Time', value: function(row){
      return moment.utc(row.endTime).local().format('YYYY/MM/DD HH:mm:ss');
    }},
    {label: 'Venue', value: 'venue'},
    {label: 'content', value: 'content'},
    {label: 'Registration Deadline', value: function(row){
      return moment.utc(row.registrationDeadline).local().format('YYYY/MM/DD HH:mm:ss');
    }},
    {label: 'Quota', value: 'quota'},
    {label: 'Speaker', value: 'speaker'},
    {label: 'Host', value: 'host'},
    {label: 'CoHost', value: 'coHost'},
    {label: 'Click Count', value: 'clickCount'},
    {label: 'Created Time', value: function(row, field, data){
      return moment.utc(row.createdAt).local().format('YYYY/MM/DD HH:mm:ss');
    }},
    {label: 'Coverphoto Path', value: function(row){
      return ('https://120.126.15.20'+row.coverPhoto_path);
    }}
  ];

  var filename = 'activities_' + moment().format('YYYYMMDD');

  Activity.find().lean().populate('activity_type').exec(function(err, activities){
    if(err) console.log(err);
    else{
      json2csv({data: activities, fields: fields}, function(err, csv){
        if(err) console.log(err);
        else{
          res.set("Content-Disposition", "attachment;filename="+filename+".csv");
          res.set("Content-Type", "application/octet-stream");
          res.send(csv);
        }
      });
    }
  });
  res.status(200);
});

router.get('/users', function(req, res){
  var fields = [{label: 'UserID', value: 'userID'},
  {label: 'Name', value: 'name'},
  {label: 'Username', value: 'username'},
  {label: 'Profile Picture', value: function(row){
    return 'https://120.126.15.20/avatar/'+row.profile_picture_id;
  }},
  {label: 'Gender', value: 'gender'},
  {label: 'Email', value: 'email'},
  {label: 'Birthday', value: function(row){
    if(row.birth)
      return moment.utc(row.birth).local().format('YYYY/MM/DD');
    else return null;
  }},
  {label: 'Role', value: 'role'},
  {label: 'Joined Time', value: function(row){
    return moment.utc(row.createdAt).local().format('YYYY/MM/DD HH:mm:ss');
  }}];

  var filename = 'users_' + moment().format('YYYYMMDD');

  User.find().select("-password -_v -latest_picture_id").lean().exec(function(err, users){
    if(err) console.log(err);
    else{
      json2csv({data: users, fields: fields}, function(err, csv){
        if(err) console.log(err);
        else{
          res.set("Content-Disposition", "attachment;filename="+filename+".csv");
          res.set("Content-Type", "application/octet-stream");
          res.send(csv);
        }
      });
    }
  });
  res.status(200);
});

router.get('/logs', function(req, res){
  var fields = [
    {label: 'LogID', value: '_id'},
    {label: 'RaspberryPi_id', value: 'raspberryPi._id'},
    {label: 'Location', value: 'raspberryPi.location'},
    {label: 'UserID', value: 'user_id'},
    {label: 'Appear Time', value: function(row){
      return moment.utc(row.appear_time).local().format('YYYY/MM/DD HH:mm:ss');
    }},
    {label: 'Disappear Time', value: function(row){
      if(row.disappear_time)
        return moment.utc(row.disappear_time).local().format('YYYY/MM/DD HH:mm:ss');
      else
        return null;
    }},
    {label: 'EmotionID', value: function(row){
      if(row.emotion_data)
        return row.emotion_data;
    }}];

  var filename = 'raspiLogs_' + moment().format('YYYYMMDD');
  RaspiLog.find().populate('raspberryPi').lean().exec(function(err, logs){
    if(err) console.log(err);
    else{
      json2csv({data: logs, fields: fields, unwindPath: ['emotion_data']}, function(err, csv){
        if(err) console.log(err);
        else{
          res.set("Content-Disposition", "attachment;filename="+filename+".csv");
          res.set("Content-Type", "application/octet-stream");
          res.send(csv);
        }
      });
    }
  });
  res.status(200);
});

router.get('/sensorData', function(req, res){
  var fields = [
    {label: 'DataID', value: '_id'},
    {label: 'RaspberryPi_id', value: 'raspberryPi._id'},
    {label: 'Temperature', value: 'temperature'},
    {label: 'Humidity', value: 'humidity'},
    {label: 'PM2.5', value: 'pm25'},
    {label: 'CO2', value: 'co2'},
    {label: 'Detected Time', value: function(row){
      return moment.utc(row.detected_time).local().format('YYYY/MM/DD HH:mm:ss');
    }}];
  var filename = 'sensorLogs_' + moment().format('YYYYMMDD');
  SensorData.find({}).populate('raspberryPi').lean().exec(function(err, data){
    if(err) console.log(err);
    else{
      json2csv({data: data, fields: fields}, function(err, csv){
        if(err) console.log(err);
        else{
          res.set("Content-Disposition", "attachment;filename="+filename+".csv");
          res.set("Content-Type", "application/octet-stream");
          res.send(csv);
        }
      });
    }
  });
  res.status(200);
});

router.get('/images', function(req, res){
  var fields = [{label: 'ImageID', value: 'imageID'},
  {label: 'UserID', value: 'people.user_id'},
  {label: 'EmotionID', value: function(row){
    if(row.people.emotions)
      return row.people.emotions;
    else
      return null;
  }},
  {label: 'Image URL', value: function(row){
    return 'https://120.126.15.20'+row.path;
  }},
  {label: 'Upload Time', value: function(row){
    return moment.utc(row.createdAt).local().format('YYYY/MM/DD HH:mm:ss');
  }}];

  var filename = 'images_' + moment().format('YYYYMMDD');

  Image.find({people: { $gt: [] }}).lean().exec(function(err, images){
    if(err) console.log(err);
    else{
      json2csv({data: images, fields: fields, unwindPath: ['people']}, function(err, csv){
        if(err) console.log(err);
        else{
          res.set("Content-Disposition", "attachment;filename="+filename+".csv");
          res.set("Content-Type", "application/octet-stream");
          res.send(csv);
        }
      });
    }
  });
  res.status(200);
});

router.get('/checkin/:id', function(req, res){
  var fields = [
    {label: 'ActivityID', value: 'activity'},
    {label: 'UserID', value: 'enrollList.user_id'},
    {label: 'Username', value: 'enrollList.data.username'},
    {label: 'Name', value: 'enrollList.data.name'},
    {label: 'Enroll Time', value: function(row){
      if(row.enrollList)
        return moment.utc(row.enrollList['enrollTime']).local().format('YYYY/MM/DD HH:mm:ss');
      else
        return null;
    }},
    {label: 'Checkin Time', value: function(row){
      if(row.enrollList && row.enrollList.checkIn)
        return moment.utc(row.enrollList['checkInTime']).local().format('YYYY/MM/DD HH:mm:ss');
    }},
    {label: 'Checkin', value: function(row){
      if(row.enrollList)
        return row.enrollList.checkIn;
    }}
  ];

  var filename = 'checkinList_' + req.params.id;

  Enroll.find({activity: req.params.id}).lean().exec(function(err, lists){
    if(err) console.log(err);
    else{
      json2csv({data: lists, fields: fields, unwindPath: ['enrollList', 'enrollList.data']}, function(err, csv){
        if(err) console.log(err);
        else{
          res.set("Content-Disposition", "attachment;filename="+filename+".csv");
          res.set("Content-Type", "application/octet-stream");
          res.send(csv);
        }
      });
    }
  });
  res.status(200);
});

module.exports = router;
