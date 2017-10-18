var express = require('express');
var router = express.Router();
var img_ = require('../models/image');
var User = require('../models/user');
var multer = require('multer');
var kairos = require('../API/kairos');
var Jimp = require('jimp');
var async = require('async');
var offset = 25;

var storage = multer.diskStorage({
 destination: function(req, file, cb) {
 cb(null, 'uploads/images/')
 },
 filename: function(req, file, cb) {
 cb(null, file.originalname);
 }
});

var upload = multer({
 storage: storage
});


router.get('/', function(req, res, next){
  res.render('photos');
});

router.post('/upload', upload.any(), function(req, res, next){
  console.log(req.files);
  res.send(req.files);

  var path = req.files[0].destination + req.files[0].originalname;

  Jimp.read(path, function (err, image) {
    if(err) throw err;
    image.exifRotate().getBase64(Jimp.AUTO, function(err, img64){
      kairos.recognizeMultiple(img64.replace('data:image/jpeg;base64,', ''), function(error, results){
        if(error) console.log('No faces found!');
        else{
          var people = [];
          async.waterfall([
            function processFaces(callback){
              var counter = 0;
              var unknownCount = 0;
              var unknownID;
              async.whilst(
                function(){return counter < results.length;},
                function loopFaces(callback){
                  var face = results[counter].transaction;
                  counter++;
                  if(face.status == 'success'){
                    people.push({
                      user_id: face.subject_id,
                      position: {x: face.topLeftX, y: face.topLeftY},
                      faceScale: {width: face.width, height: face.height}
                    });
                    callback();
                  }
                  else{
                    Jimp.read(path, function (err, image) {
                      image.crop(face.topLeftX-offset, face.topLeftY-offset, face.width+(2*offset), face.height+(2*offset)).getBase64(Jimp.AUTO, function(err, img64){
                        User.saveUnknown(img64.replace('data:image/jpeg;base64,', ''), function(error, userID, age){
                          console.log(userID);
                          people.push({
                            user_id: userID,
                            position: {x: face.topLeftX, y: face.topLeftY},
                            faceScale: {width: face.width, height: face.height}
                          });
                          callback();
                        });
                      });
                    });
                  }
                },function(err){
                  if(err) console.log(err);
                  else callback(null, people);
                });
            },
            function saveImage(people){
              console.log(people);
              Image.saveImage(people, path.replace('uploads', ''));
            }
          ],  function(error){
              if(error) console.log(error);
          });

        }
      });
    });
  });
});

router.post('/upload_v2', upload.any(), function(req, res, next){
  console.log(req.files);
  res.send(req.files);

  var path = [];

  for(var i = 0; i < req.files.length; i++){
    path.push(req.files[i].destination + req.files[i].originalname);
  }

  async.eachSeries(path, function(path, callback){
    Jimp.read(path, function (err, image) {
      if(err) throw err;
      image.exifRotate().getBase64(Jimp.AUTO, function(err, img64){
        kairos.recognizeMultiple(img64.replace('data:image/jpeg;base64,', ''), function(error, results){
          if(error) console.log('No faces found!');
          else{
            var people = [];
            var tmp_path = [];
            async.waterfall([
              function processFaces(callback){
                var counter = 0;
                async.whilst(
                  function(){return counter < results.length;},
                  function loopFaces(callback){
                    var face = results[counter].transaction;
                    if(face.status == 'success'){
                      people.push({
                        index: counter,
                        user_id: face.subject_id,
                        position: {x: face.topLeftX, y: face.topLeftY},
                        faceScale: {width: face.width, height: face.height}
                      });
                      callback();
                    }
                    else{
                      Jimp.read(path, function (err, image) {
                        image.crop(face.topLeftX-offset, face.topLeftY-offset, face.width+(2*offset), face.height+(2*offset)).getBase64(Jimp.AUTO, function(err, img64){
                          img_.saveAvatar(img64.replace('data:image/jpeg;base64,', ''), 'unknown', undefined, function(imgID){
                            tmp_path.push({
                              index: counter,
                              img_id: imgID,
                              path: "./uploads/avatar/"+ imgID +'.jpg'
                            });

                            people.push({
                              index: counter,
                              user_id: 'unknown',
                              position: {x: face.topLeftX, y: face.topLeftY},
                              faceScale: {width: face.width, height: face.height}
                            });
                            callback();
                          });
                        });
                      });
                    }
                    counter++;
                  },function(err){
                    if(err) console.log(err);
                    else callback(null, people);
                  });
              },
              function saveImage(people, callback){
                console.log(people);
                img_.saveImage(people, path.replace('uploads', ''), function(imgID){
                  console.log(imgID);
                  img_.saveTmp(imgID, tmp_path);
                  callback(null, 'done');
                });
              }
            ],  function(error){
                if(error) console.log(error);
                else{
                  async.setImmediate(function(){callback(err)});
                }
            });
          }
        });
      });
    });
  },function(err){
    if(err) console.log(err);
    else{
      img_.enrollTmp();
    }
  });
});

module.exports = router;
