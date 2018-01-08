var express = require('express');
var router = express.Router();
var kairos = require('../API/kairos');
var azure = require('../API/azure');
var User = require('../models/user').User;
var user_ = require('../models/user');
var Image = require('../models/image').Image;
var Avatar = require('../models/image').Avatar;
var img_ = require('../models/image');
var Appearance = require('../models/appearance');
var Calibration = require('../models/calibration');
var Emotion = require('../models/emotions').Emotion;
var async = require('async');
var Jimp = require('jimp');
var fs = require('fs');

router.get('/', function(req, res){
  res.render('magicMirror2');
});

router.post('/recognize', function(req, res){
  var path = './uploads/avatar/avatar_'+Date.now()+'.jpg';
  Jimp.read(Buffer.from(req.body.image, 'base64'), function(err, image){
    image.exifRotate().write( path, function(err){
      if(err) console.log(err);
    });
    image.exifRotate().getBase64(Jimp.AUTO, function(err, img64){
      kairos.recognize(img64.replace('data:image/jpeg;base64,', ''), function(error, status, subjectID){
        if (error){
          fs.unlink(path, function(err){
            if(err) console.log(err);
          });
          res.json({error: true, status: status});
        }
        else if (status == 'failure'){
          async.parallel({
            saveUnknown: function(callback){
              User.create({role: 'unknown'}, function(err, user){
                if(err) console.log(err);
                kairos.enroll(img64.replace('data:image/jpeg;base64,', ''), user.userID, function(error, status, appearance){
            			if(error){
                    fs.unlink(path, function(err){
                      if(err) console.log(err);
                    });
            				callback(null, {error: true, status: status});
            			}
                  else if(status == 'success'){
                    if(appearance.glasses == 'None')
            					var glasses = false;
            				else
            					var glasses = true;
                    Image.create({path: path.replace('./uploads', '')}, function(err, image){
                      Appearance.create({media_id: image.imageID, glasses: glasses, age: appearance.age, user_id: user.userID}, function(err){});
                      Avatar.create({image_id: image.imageID, user_id: user.userID}, function(err){});
                      User.findOneAndUpdate({userID: user.userID}, {gender: appearance.gender.type, profile_picture_id: image.imageID, latest_picture_id: image.imageID}, function(err){});
                      callback(null, {error: false, userID: user.userID, age: appearance.age, gender: appearance.gender.type, imageID: image.imageID});
                    });
            			}
                });
              });
            },
            detectEmotion: function(callback){
              azure.recognize(path, function(err, faces){
                if(err) callback(null, {error: true});
                else callback(null, {error: false, emotions: faces[0].emotions});
              });
            }
          }, function(err, results){
            if(err) res.json({error: true});
            else{
              if(!results.detectEmotion.error && !results.saveUnknown.error){
                Emotion.create({user_id: results.saveUnknown.userID, emotions: results.detectEmotion.emotions}, function(err, emotion){
                  Image.findOneAndUpdate({imageID: results.saveUnknown.imageID}, {$push: {people: {user_id: results.saveUnknown.userID, emotions: emotion._id}}}, function(err){});
                });
                res.json({error: false, emotions: results.detectEmotion.emotions, age: results.saveUnknown.age, gender: results.saveUnknown.gender});
              }
              else{
                res.json({error: true, status: results.saveUnknown.status});
              }
            }
          });
        }
        else if (status == 'success'){
          async.parallel({
            detectAge: function(callback){
              kairos.detect(img64.replace('data:image/jpeg;base64,', ''), function(error, status, age, glasses){
                if(status == 'failure'){
                  callback(null, {error: true});
                }
                else if(status == 'success'){
                  User.findOne({userID: subjectID}, function(err, user){
                    if(err) throw err;
                    else {
                      Image.create({path: path.replace('./uploads', '')}, function(err, image){
                        Avatar.create({image_id: image.imageID}, function(err){});
                        User.update({userID: subjectID}, {latest_picture_id: image.imageID}).exec();
                        Appearance.create({user_id: subjectID, age: age, glasses: glasses, media_id: image.imageID}, function(err){});
                        callback(null, {error: false, userID: subjectID, physicalAge: age, gender: user.gender, imageID: image.imageID});
                      });
                    }
                  });
                }
              });
            },
            detectEmotion: function(callback){
              azure.recognize(path, function(err, faces){
                if(err) callback(null, {error: true});
                else {
                  Emotion.create({user_id: subjectID, emotions: faces[0].emotions}, function(err, emotion){
                    callback(null, {error: false, emotions: faces[0].emotions, emotionID: emotion._id});
                  });
                }
              });
            }
          }, function(err, results){
            if(err) res.json({error: true});
            else{
              if(!results.detectAge.error && !results.detectEmotion.error){
                Image.findOneAndUpdate({imageID: results.detectAge.imageID}, {$push: {people: {user_id: subjectID, emotions: results.detectEmotion.emotionID}}}, function(err){});
                res.json({error: false, age: results.detectAge.physicalAge, realAge: results.detectAge.realAge, emotions: results.detectEmotion.emotions, gender: results.detectAge.gender});
              }
              else res.json({error: true});
            }
          });
        }
        else
          res.json({error: true});
      });
    });
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
    /*var newCalibration = new Calibration({
      detectedEmotions_id: emotion.emotionID,
      trueValue: req.body.emotionInput,
      emotionDifference: emotionDifference,
      ageDifference: ageDifference,
      user_id: req.body.userID
    });

    newCalibration.save(function(err){if(err) throw err});*/
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
