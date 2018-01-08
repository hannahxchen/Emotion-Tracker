var express = require('express');
var router = express.Router();
var img_ = require('../models/image');
var Image = require('../models/image').Image;
var Album = require('../models/image').Album;
var UploadTmp = require('../models/image').UploadTmp;
var Activity = require('../models/activity').Activity;
var User = require('../models/user').User;
var multer = require('multer');
var kairos = require('../API/kairos');
var Jimp = require('jimp');
var ExifImage = require('exif').ExifImage;
var async = require('async');
var socket_ = require('../sockets');
var offset = 25;

var storage = multer.diskStorage({
 destination: function(req, file, cb) {
 cb(null, 'uploads/images/');
 },
 filename: function(req, file, cb) {
 cb(null, 'image_' + Date.now() + '.jpg');
 }
});

var upload = multer({
 storage: storage
});

router.get('/', function(req, res, next){
  Album.find({}).populate('image_list').exec(function(err, albums){
    if(err) console.log(err);
    else res.render('photos', {albums: albums});
  });
});

router.get('/album/:id', function(req, res){
  Album.findOne({_id: req.params.id}).populate('image_list').lean().exec(function(err, album){
    if(err) console.log(err);
    else {
      if(album.title){
        res.render('photo_gallery', {album: album});
      }
      else{
        Activity.findOne({album: album._id}, function(err, activity){
          album.title = activity.title
          res.render('photo_gallery', album);
        });
      }
    }
  });
});

router.post('/:id/upload', upload.any(), function(req, res, next){
  console.log(req.files);
  res.send(req.files);

  var path = [];
  var img_ids = [];
  var counter2 = 0;
  var album_id;

  async.waterfall([
    function updatePath(callback){
      for(var i = 0; i < req.files.length; i++){
        path.push({path: (req.files[i].destination + req.files[i].filename).replace('uploads', '')});
      }
      callback(null, path);
    },
    function saveImage(path, callback){
      Image.create(path, function(err, imgs){
        if(err) console.log(err);
        else{
          async.each(imgs, function(img, callback){
            img_ids.push(img.imageID);
            callback();
          }, function(err){
            if(err) console.log(err);
            else callback(null, img_ids);
          });
        }
      });
    },
    function updateAlbum(img_ids, callback){
      console.log('uploaded image_ids: ' + img_ids);
      Album.findOneAndUpdate({_id: req.params.id}, {'$push': {image_id: {$each: img_ids}}, lastModified: Date.now()}, {upsert: true, new: true}, function(err, album){
        if(err) console.log(err);
        else {
          album_id = album._id;
          callback(null);
        }
      });
    }
  ], function(err){
    if(err) console.log(err);
    else{
      async.each(img_ids, function(img_id, callback){
        async.parallel({
          recognizeFaces: function(callback){
            img_.recognizeFaces(img_id, function(err){
              callback(null, 'finish');
            });
          },
          detectEmotions: function(callback){
            img_.detectEmotions(img_id, function(err){
              callback(null, 'finish');
            });
          }
        }, function(err){
          if(err) console.log('Error processing image: ' + img_id);
          else{
            img_.updateEmotions(img_id);
            socket_.continueUpload();
            callback();
          }
        })
      }, function(err){
        if(err) console.log(err);
        else {
          socket_.updateAlbum(album_id);
          console.log('Finish processing images: ' + img_ids);
        }
      });
    }
  });

});

router.post('/newAlbum', function(req, res){
  Album.create({title: req.body.albumName}, function(err){
    if(err){
      req.flash('error_msg','系統錯誤');
      res.redirect('/photos');
    }
    else{
      req.flash('success_msg','新增成功');
      res.redirect('/photos');
    }
  });
});

router.post('/removeAlbum/:id', function(req, res){
  Album.findOneAndRemove({_id: req.params.id}, function(err, removed){
    if(err){
      req.flash('error_msg','系統錯誤');
      res.send();
    }
    else{
      if(removed.image_id)
        Image.remove({imageID: {$in: removed.image_id}}).exec();
      req.flash('success_msg','刪除成功');
      res.send();
    }
  });
});

router.post('/deletePhotos', function(req, res){
  img_.deleteImage(req.body.album_id, req.body.img_ids, function(err){
    if(err) res.json({error: true});
    else res.json({error: false});
  });
});

router.post('/album/:id/edit', function(req, res){
  Album.findOneAndUpdate({_id: req.params.id}, {title: req.body.title}, function(err){
    if(err) res.json({error: true});
    else res.json({error: false});
  });
});

module.exports = router;
