var express = require('express');
var router = express.Router();
var RaspiLog = require('../models/raspberryPi').RaspiLog;
var RaspberryPi = require('../models/raspberryPi').RaspberryPi;
var SensorData = require('../models/raspberryPi').SensorData;
var LogImgTmp = require('../models/raspberryPi').LogImgTmp;
var async = require('async');
var fs = require('fs');
var moment = require('moment');
var multer = require('multer');
var mkdirp = require('mkdirp');

var storage = multer.diskStorage({
  destination: function(req, file, cb) {
    var dir = 'uploads/tmp/raspi/' + req.body.unknown_id + '/';
    mkdirp(dir, err => cb(err, dir))
  },
  filename: function(req, file, cb) {
    cb(null, req.body.unknown_id + '_' + Date.now() + '.jpg');
  }
});

var upload = multer({
 storage: storage
});

router.get('/', function(req, res){
  async.parallel({
    getLogs: function(callback){
      RaspiLog.find().populate('raspberryPi').lean().exec(function(err, logs){
        if(err) console.log(err);
        else callback(null, logs);
      });
    },
    getSensorData: function(callback){
      SensorData.find().populate('raspberryPi').lean().exec(function(err, data){
        if(err) console.log(err);
        else callback(null, data);
      });
    }
  }, function(err, results){
    console.log(JSON.stringify(results.getLogs[0]));
    if(err) console.log(err);
    else res.render('admin_raspi', {logs: results.getLogs, sensorData: results.getSensorData});
  });
});

router.get('/settings', function(req, res){
  var lastActive = [];
  RaspberryPi.find().lean().exec(function(err, devices){
    if(err) console.log(err);
    else{
      async.each(devices, function(device, callback){
        RaspiLog.find({raspberryPi_id: device._id}).sort('-createdAt').limit(1).exec(function(err, log){
          if(err) console.log(err);
          else{
            if(!log) lastActive.push('');
            else lastActive.push(log.createdAt);
            callback();
          }
        });
      }, function(err){
        if(err) console.log(err);
        else res.render('admin_raspi_settings', {devices: devices, lastActive: lastActive});
      });
    }
  });

});

router.post('/newDevice', function(req, res){
  RaspberryPi.create({location: req.body.location}, function(err, device){
    if(err) res.json({error: true});
    else res.json({error: false, device: device});
  });
});

router.post('/updateDevice/:id', function(req, res){
  RaspberryPi.findOneAndUpdate({_id: req.params.id}, {location: req.body.location}, function(err, updated){
    if(err) res.json({error: true});
    else res.json({error: false, updated: updated});
  });
});

router.post('/deleteDevice/:id', function(req, res){
  RaspberryPi.findOneAndRemove({_id: req.params.id}, function(err){
    if(err) res.json({error: true});
    else res.json({error: false});
  });
});

router.post('/deleteLogs', function(req, res){
  RaspiLog.remove({_id: { $in: req.body.selected}}, function(err){
    if(err) res.json({error: true});
    else res.json({error: false});
  });
});

router.post('/deleteSensorData', function(req, res){
  SensorData.remove({_id: { $in: req.body.selected}}, function(err){
    if(err) res.json({error: true});
    else res.json({error: false});
  });
});

router.post('/saveUnknown', upload.any(), function(req, res, next){
  var unknown_id = req.body.unknown_id;
  var dir = '/tmp/raspi/' + unknown_id;

  LogImgTmp.create({log: req.body.log_id, image_folder: dir}, function(err){
    if(err) console.log(err);
    else console.log('Received images from raspberry pi, unknown_id: '+ unknown_id);
  });

  res.sendStatus(200);
});

module.exports = router;
