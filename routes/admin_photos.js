var express = require('express');
var router = express.Router();
var Album = require('../models/image').Album;
var Image = require('../models/image').Image;
var User = require('../models/user').User;
var mongoose = require('mongoose');
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
  Album.find().populate('image_list').lean().exec(function(err, albums){
    if(err) console.log(err);
    else res.render('admin_album', {albums: albums});
  });
});

router.get('/:id', ensureAuthenticated, function(req, res){
  console.log(req.params.id);
  if(req.params.id == '...'){
    res.sendStatus(304);
  }
  else{
    async.parallel({
      getAlbum: function(callback){
        Album.findOne({_id: req.params.id}).populate('image_list').lean().exec(function(err, album){
          if(err) callback(true);
          else {
            callback(null, album);
          }
        });
      },
      getUsers: function(callback){
        User.find().lean().exec(function(err, users){
          if(err) callback(true);
          else callback(null, users);
        });
      }
    }, function(err, results){
      if(err) console.log(err);
      else
        res.render('admin_photos', {album: results.getAlbum, users: results.getUsers});
    });

  }
});

router.get('/getImgs/:id', function(req, res){
  Album.findOne({_id: req.params.id}).populate('image_list').lean().exec(function(err, album){
    if(err) res.json({error: true});
    else {
      var profile = [];
      async.each(album.image_list, function(img, callback){
        if(img.people.length > 0){
          var userData = [];
          async.each(img.people, function(person, callback){
            var currentUser = {};
            if(person.user_id != 'unknown'){
              User.findOne({userID: person.user_id}, function(err, user){
                if(user){
                  currentUser.user_id = user.userID;
                  currentUser.name = user.name;
                  currentUser.role = user.role;
                  userData.push(currentUser);
                }
                callback();
              });
            }
            else callback();
          }, function(err){
            profile.push({image_id: img.imageID, userData: userData});
            callback();
          });
        }
        else callback();
      }, function(err){
        res.json({error: false, image_list: album.image_list, profile: profile});
      });
    }
  });
});

router.post('/updateImg/:id', function(req, res){
  Image.findOneAndUpdate({imageID: req.params.id, 'people.index': req.body.index}, {'$set': {'people.$.user_id': req.body.userID}}, {new: true}, function(err, img){
    if(err) res.json({error: true});
    else {
      var userData = [];
      async.each(img.people, function(person, callback){
        if(person.user_id != 'unknown'){
          User.findOne({userID: person.user_id}, function(err, user){
            if(err) callback(true);
            else{
              userData.push({
                user_id: user.userID,
                name: user.name,
                role: user.role
              });
              callback();
            }
          });
        }
        else callback();
      }, function(err){
        if(err) res.json({error: true});
        else res.json({error: false, updated: img, userData: userData});
      });
    }
  });

});

module.exports = router;
