var express = require('express');
var router = express.Router();
var kairos = require('../API/kairos');
var User = require('../models/user.js').User;
var user_ = require('../models/user.js');
var Image = require('../models/image.js').Image;
var img_ = require('../models/image.js');
var Appearance = require('../models/appearance.js');
var Calibration = require('../models/calibration.js');
var Emotion = require('../models/emotions.js');

router.get('/', function(req, res){
  res.render('magicMirror');
});

router.post('/recognize', function(req, res){
  kairos.recognize(req.body.image, function(error, status, userID){
    if (error) res.json({error: true});
    else if (status == 'failure'){
      user_.saveUnknown(req.body.image, function(error, userID, age){
        if(error)
          res.json({error: true});
        else
          res.json({userID: userID, physicalAge: age});
        console.log('saved an unknown!');
      });
    }
    else if (status == 'success'){
      kairos.detect(req.body.image, function(error, status, age, glasses){
        if(status == 'failure'){
          res.json({error: error});
        }
        else if(status == 'success'){
          User.findOne({userID: userID}, function(err, user){
            if(err) throw err;
            if(user.birth) res.json({userID: userID, realAge: getAge(user.birth), physicalAge: age});
            else res.json({userID: userID, physicalAge: age});
          });
          var newAppearnce = new Appearance({user_id: userID, age: age, glasses: glasses});
          img_.saveAvatar(req.body.image, userID, newAppearnce, function(imgID){
            User.update({userID: userID}, {latest_picture_id: imgID}, function(err){
              if(err) throw err;
            });
          });
        }
      });
    }
    else
      res.json({error: true});
  });
});

router.post('/submitData', function(req, res){
  var emotionDifference = {};
  for(var key in req.body.detectedEmotion){
    emotionDifference[key] = req.body.emotionInput[key] - req.body.detectedEmotion[key];
  }
  var imgID;
  User.findOne({userID: req.body.userID}, function(err, user){
    if(err) throw err;
    imgID = user.latest_picture_id;
  });
  if(req.body.birth){
    User.update({userID: req.body.userID}, {birth: new Date(req.body.birth)}, function(err){
      if(err) throw err;
    });
    var ageDifference = req.body.physicalAge - getAge(new Date(req.body.birth));
  }
  else ageDifference = req.body.ageDifference;
  var newEmotion = new Emotion({userID: req.body.userID, media_id: imgID, emotions: req.body.detectedEmotion});
  newEmotion.save(function(err, emotion){
    if(err) throw err;
    var newCalibration = new Calibration({
      detectedEmotions_id: emotion.emotionID,
      trueValue: req.body.emotionInput,
      emotionDifference: emotionDifference,
      ageDifference: ageDifference,
      user_id: req.body.userID
    });

    newCalibration.save(function(err){if(err) throw err});
  });
  res.json({success: true});
});

function getAge(birthday) {
  var today = new Date();
  var age = today.getFullYear() - birthday.getFullYear();
  var m = today.getMonth() - birthday.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthday.getDate())) {
    age--;
  }
  return age;
}

module.exports = router;
