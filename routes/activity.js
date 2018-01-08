var express = require('express');
var router = express.Router();
var async = require('async');
var moment = require('moment');
var ActivityType = require('../models/activity').ActivityType;
var Activity = require('../models/activity').Activity;
var Enroll = require('../models/activity').Enroll;
var CheckInTmp = require('../models/activity').CheckInTmp;
var Album = require('../models/image').Album;
var activity_function = require('../models/activity');
var multer  =   require('multer');
var kairos = require('../API/kairos');
var User = require('../models/user').User;
var user_ = require('../models/user');
var moment = require('moment');
var Jimp = require('jimp');
var fs = require('fs');
var socket_ = require('../sockets');
var storage =   multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, './uploads/activityCover');
  },
  filename: function (req, file, callback) {
    callback(null, file.fieldname + '_' + Date.now() + '.jpg');
  }
});
var upload = multer({ storage : storage});

function ensureAuthenticated(req, res, next){
	if(req.isAuthenticated()){
		return next();
	} else {
		req.flash('error_msg','您還尚未登入！');
		res.redirect('/login');
	}
}

router.get('/', function(req, res){
  async.parallel({
  	getType: function(callback){
  		ActivityType.find({}, function(err, docs){
  		    if(err) console.log(err);
  		    var types = [];
  		    docs.forEach(function(element){
  		      types.push(element.type);
  		    });
  		    callback(null, types);
  		});
  	},
  	getLatest: function(callback){
      query = {startTime: {"$gte": Date.now()}};
      Activity.find(query).sort('startTime').limit(9).lean().exec(function(err, docs) {
        if(err) console.log(err);
  			else callback(null, docs);
      });
  	},
    getPopular: function(callback){
      query = {endTime: {"$gte": Date.now()}};
      Activity.find({}).sort('-clickCount').limit(9).lean().exec(function(err, docs){
        if(err) console.log(err);
        else callback(null, docs);
      });
    }
  }, function(err, results){
  	res.render('activity_home', {types: results.getType, latest: results.getLatest, popular: results.getPopular, moment: moment});
  });
});

router.get('/type/:id', function(req, res){
  async.parallel({
  	getType: function(callback){
  		ActivityType.find().lean().exec(function(err, docs){
  		    if(err) console.log(err);
  		    var types = [];
  		    docs.forEach(function(element){
  		      types.push(element.type);
  		    });
  		    callback(null, types);
  		});
  	},
  	getLatest: function(callback){
      ActivityType.findOne({type: req.params.id}, function(err, type){
        query = {activity_type: type._id, startTime: {"$gte": Date.now()}};
        Activity.find(query).sort('startTime').limit(9).lean().exec(function(err, docs) {
          console.log(docs);
          if(err) console.log(err);
    			else callback(null, docs);
        });
      });
  	},
    getPopular: function(callback){
      ActivityType.findOne({type: req.params.id}, function(err, type){
        query = {activity_type: type._id, endTime: {"$gte": Date.now()}};
        Activity.find(query).sort('-clickCount').limit(9).lean().exec(function(err, docs){
          console.log(docs);
          if(err) console.log(err);
          else callback(null, docs);
        });
      });
    }
  }, function(err, results){
  	res.render('activity_home', {types: results.getType, latest: results.getLatest, popular: results.getPopular, moment: moment});
  });
});

router.get('/myCalendar', ensureAuthenticated, function(req, res){
  res.render('myCalendar');
});

router.get('/all', function(req, res){
  res.render('activityAll');
});

router.post('/upload', upload.single('coverPhoto'), function(req, res){
  var title = req.body.title;
  var contactPerson = req.body.contactPerson;
  var email = req.body.email;

  req.checkBody('title', '活動名稱為必填').notEmpty();
  req.checkBody('contactPerson', '聯絡人為必填').notEmpty();
  req.checkBody('email', 'Email 為必填').notEmpty();
	req.checkBody('email', 'Email 格式錯誤').isEmail();

  var check_errors = req.validationErrors();

  if(check_errors){
    res.json({error: true, check_errors: check_errors});
	} else {
    console.log(req.file);
    console.log(req.body);
    if(req.file) activity_function.createActivity(req.body, req.file.destination + '/' + req.file.filename, req.user.userID, function(err, activity){
      if(err) res.json({error: true});
      else res.json({error: false, newActivity: activity});
    });
    else activity_function.createActivity(req.body, undefined, req.user.userID, function(err, activity){
      if(err) res.json({error: true});
      else res.json({error: false, newActivity: activity});
    });

  }
});

router.get('/:id', function(req, res){
  async.parallel({
    getActivity: function(callback){
      Activity.findOneAndUpdate({_id: req.params.id},  {$inc: {clickCount: 1 }}, {new: true}).lean().exec(function(err, doc){
        if(err) console.log(err);
        else callback(null ,doc);
      });
    },
    getEnroll: function(callback){
      if(req.user){
        Activity.findOne({_id: req.params.id}).populate('enroll').populate('activity_type').exec(function(err, doc){
          if(err) console.log(err);
          else{
            Enroll.findOne({_id: doc.enroll._id, 'enrollList.user_id': req.user.userID}, function(err, enroll){
              if(err) console.log(err);
              else if(!enroll) callback(null, {ifEnrolled: false, data: doc.enroll, enrollCount: doc.enroll.enrollList.length, activity_type: doc.activity_type.type});
              else callback(null, {ifEnrolled: true, data: doc.enroll, enrollCount: doc.enroll.enrollList.length, activity_type: doc.activity_type.type});
            });
          }
        });
      }
      else callback(null, {ifEnrolled: false, data: null});
    },
    getAlbum: function(callback){
      Album.findOne({activity: req.params.id}).populate('image_list').lean().exec(function(err, album){
        if(err) callback(true);
        else if(!album) callback(null, null);
        else callback(null, album.image_list);
      });
    }
  }, function(err, results){
      if(err) console.log(err);
      else res.render('activity_info', {
        data: results.getActivity,
        moment: moment,
        enroll: results.getEnroll,
        enrollCount: results.getEnroll.enrollCount,
        image_list: results.getAlbum,
        type: results.getEnroll.activity_type
      });
  });
});

router.get('/:id/checkin', function(req, res){
  var unchecked = [];
  var checked = [];
  /*async.parallel({
    getEnroll: function(callback){
      Enroll.findOne({activity: req.params.id}).populate('activity').lean().exec(function(err, doc){
        if(err) console.log(err);
        else{
          callback(null, doc);
        }
      });
    },
    getTmp: function(callback){
      CheckInTmp.find({activity: req.params.id}).lean().exec(function(err, tmps){
        if(err) console.log(err);
        else callback(null, tmps);
      });
    }
  }, function(err, results){
    if(err) console.log(err);
    else res.render('activity_checkin', {enroll: results.getEnroll, tmps: results.getTmp});
  });*/
  Enroll.findOne({activity: req.params.id}).populate('activity').lean().exec(function(err, enroll){
    var checked = [];
    var unchecked = [];
    if(err) console.log(err);
    else{
      async.each(enroll.enrollList, function(person, callback){
        if(person.checkIn == true){
          checked.push({
            username: person.data.username,
            name: person.data.name,
            checkInTime: person.checkInTime
          });
          callback();
        }
        else{
          unchecked.push({
            username: person.data.username,
            name: person.data.name
          });
          callback();
        }
      }, function(err){
        res.render('activity_checkin', {checked: checked, unchecked: unchecked, activity_title: enroll.activity.title});
      });
    }
  });
});

router.post('/:id/checkin/manual', function(req, res){
  console.log(req.body);
  var checkInTime = Date.now();
  Activity.findOne({_id: req.params.id}, function(err, activity){
    if(err) console.log(err);
    else{
      async.parallel({
      	getUser: function(callback){
          User.findOne({username: req.body.username}, function(err, user){
            if(err) console.log(err);
            else if(!user){
              res.json({error: true, message: 'Unknown User'});
              return;
            }
            else{
              user_.validPassword(req.body.password, user.password, function(err, isMatch){
                if(err) throw err;
                if(isMatch){
                  callback(null, user);
                } else {
                  res.json({error: true, message: 'Invalid Password'});
                  return;
                }
              });
            }
          });
      	},
      	checkIn: function(callback){
          Enroll.findOne({activity: req.params.id, 'enrollList.data.username': req.body.username}, function(err, doc){
            if(err) console.log(err);
            else if(!doc){
              callback(null, 'not enrolled');
            }
            else{
              Enroll.findOne({activity: req.params.id, enrollList:{$elemMatch:{'data.username': req.body.username, checkIn: false}}}, function(err, doc){
                if(err) console.log(err);
                else if(!doc) callback(null, 'already checked in');
                else{
                  Enroll.update({activity: req.params.id, 'enrollList.data.username': req.body.username},
                    {$set:{'enrollList.$.checkIn': true, 'enrollList.$.checkInTime': checkInTime}}, function(err){
                    if(err) console.log(err);
                    else callback(null, 'checked in successfully');
                  });
                }
              });
            }
          });
      	}
      }, function(err, results){
        socket_.updateEnrolled(req.params.id);
      	res.json({error: false, profile: results.getUser, checkin: results.checkIn, checkInTime: checkInTime});
      });
    }
  });
});

router.post('/:id/checkin', function(req, res){
  var checkInTime = Date.now();
  kairos.recognize(req.body.image, function(error, status, userID){
    if(error){
      res.json({error: true, message: status});
    }
    else if (status == 'failure'){
      var path = "./uploads/tmp/"+  Date.now() +'.jpg';
      Jimp.read(Buffer.from(req.body.image, 'base64'), function(err, image){
        image.exifRotate().write( path, function(err){
          if(err) console.log(err);
        });
      });
      CheckInTmp.create({activity: req.params.id, path: path, status: 'Unknown User'}, function(err, doc){
        if(err) console.log(err);
      });
      res.json({error: true, message: 'Unknown User'});
      return;
    }
    else if (status == 'success'){
      async.parallel({
      	getUser: function(callback){
          User.findOne({userID: userID, role: {'$in':['elder', 'relative', 'admin']}}, function(err, user){
            if(err) console.log(err);
            callback(null, user);
          });
      	},
      	checkIn: function(callback){
          Enroll.findOne({activity: req.params.id, 'enrollList.user_id': userID}, function(err, doc){
            if(err) console.log(err);
            else if(!doc){
              callback(null, 'not enrolled');
            }
            else{
              Enroll.findOne({activity: req.params.id, enrollList:{$elemMatch:{user_id: userID, checkIn: false}}}, function(err, doc){
                if(err) console.log(err);
                else if(!doc) callback(null, 'already checked in');
                else{
                  Enroll.update({activity: req.params.id, 'enrollList.user_id': userID},
                    {$set:{'enrollList.$.checkIn': true, 'enrollList.$.checkInTime': checkInTime}}, function(err){
                    if(err) console.log(err);
                    else callback(null, 'checked in successfully');
                  });
                }
              });
            }
          });
      	}
      }, function(err, results){
          if(results.getUser){
            socket_.updateEnrolled(req.params.id);
            res.json({error: false, profile: results.getUser, checkin: results.checkIn, checkInTime: checkInTime});
          }
          else {
            var path = "./uploads/tmp/"+  Date.now() +'.jpg';
            Jimp.read(Buffer.from(req.body.image, 'base64'), function(err, image){
              image.exifRotate().write( path, function(err){
                if(err) console.log(err);
              });
            });
            CheckInTmp.create({activity: req.params.id, path: path, status: 'Unknown User'}, function(err, doc){
              if(err) console.log(err);
            });
            res.json({error: true, message: 'Unknown User'});
          }
      });
    }
    else
      res.json({error: true});
  });
});

router.post('/:id/checkIn_nonRealTime', function(req, res){
  var path = "./uploads/tmp/"+  Date.now() +'.jpg';
  Jimp.read(Buffer.from(req.body.img, 'base64'), function(err, image){
    image.exifRotate().write( path, function(err){
      if(err) res.json({error: true});
      else res.json({error: false});
    });
  });
  CheckInTmp.create({activity: req.params.id, path: path}, function(err, doc){
    if(err) console.log(err);
    else startCheckIn(doc._id, req.params.id);
  });
});

module.exports = {
  createCheckInTmps: function createCheckInTmps(img, activity_id){
    var path = "./uploads/tmp/"+  Date.now() +'.jpg';
    Jimp.read(Buffer.from(img, 'base64'), function(err, image){
      image.exifRotate().write( path, function(err){
        if(err) res.json({error: true});
        else res.json({error: false});
      });
    });
    CheckInTmp.create({activity: activity_id, path: path}, function(err, doc){
      if(err) console.log(err);
      else startCheckIn(doc._id, activity_id);
    });
  }
};

function startCheckIn(tmp_id, activity_id){
  var checkInTime;
  CheckInTmp.findOne({_id: tmp_id}, function(err, doc){
    if(err) console.log(err);
    else{
      checkInTime = doc.checkInTime;
      Jimp.read(doc.path, function(err, image){
        image.getBase64(Jimp.AUTO, function(err, img64){
          kairos.recognize(img64.replace('data:image/jpeg;base64,', ''), function(error, status, userID){
            if(error) {
              doc.status = status;
              doc.save();
              return;
            }
            else if (status == 'failure'){
              doc.status = 'Unknown User';
              doc.save();
              return;
            }
            else if (status == 'success'){
              async.parallel({
              	getUser: function(callback){
                  User.findOne({userID: userID, role: {'$in':['elder', 'relative', 'admin']}}, function(err, user){
                    if(err) console.log(err);
                    callback(null, user);
                  });
              	},
              	checkIn: function(callback){
                  Enroll.findOne({activity: activity_id, 'enrollList.user_id': userID}, function(err, doc){
                    if(err) console.log(err);
                    else if(!doc){
                      User.findOne({userID: userID, role: {'$in':['elder', 'relative', 'admin']}}, function(err, user){
                        Enroll.findOne({activity: activity_id}, function(err, doc){
                          doc.enrollList.push({user_id: userID, data:{username: user.username, name: user.name, birth: user.birth,
                            gender: user.gender, email: user.email}, checkInTime: Date.now(), checkIn: true});
                          doc.save(function(err, doc){
                            callback(null, 'checked in successfully');
                          });
                        });
                      });
                    }
                    else{
                      Enroll.findOne({activity: activity_id, enrollList:{$elemMatch:{user_id: userID, checkIn: false}}}, function(err, doc){
                        if(err) console.log(err);
                        else if(!doc) callback(null, 'already checked in');
                        else{
                          Enroll.update({activity: activity_id, 'enrollList.user_id': userID},
                            {$set:{'enrollList.$.checkIn': true, 'enrollList.$.checkInTime': checkInTime}}, function(err){
                            if(err) console.log(err);
                            else callback(null, 'checked in successfully');
                          });
                        }
                      });
                    }
                  });
              	}
              }, function(err, results){
                console.log(results.checkIn);
                if(err) console.log(err);
                else {
                  if(results.checkIn == 'checked in successfully') socket_.updateEnrolled(activity_id);
                  CheckInTmp.findOneAndRemove({_id: tmp_id}, function(err, removed){
                    if(err) console.log(err);
                    else{
                      fs.unlink(removed.path, function(err){
                        if(err) return console.log(err);
                      });
                    }
                  });
                }
              });
            }
          });
        });
      });
    }
  });
}

router.get('/:id/enroll', function(req, res){
  if(!req.user){
    req.flash('error_msg','您還尚未登入！');
		res.redirect('/login');
  }
  else{
    Activity.findOne({_id: req.params.id}, function(err, doc){
      if(err) console.log(err);
      else res.render('enroll_form', {title: doc.title, id: req.params.id, user: req.user, errors: false, success_msg: false, error_msg: false, moment: moment});
    });
  }
});

router.post('/:id/enroll', function(req, res){
  Enroll.findOne({activity: req.params.id}, function(err, doc){
    doc.enrollList.push({user_id: req.user.userID, data:{username: req.user.username, name: req.user.name, birth: req.user.birth,
      gender: req.user.gender, email: req.body.email, tel: req.body.tel, idNum: req.body.idNum}});
    doc.save(function(err, doc){
      if(err){
        req.flash('errors_msg', '系統錯誤');
        res.redirect('back');
      }
      else{
        res.render('enroll_form', {success_msg: '報名成功'});
      }
    });
  });
});

router.get('/:id/photos', function(req, res){
  Activity.findOne({_id: req.params.id}, function(err, data){
    if(err) console.log(err);
    else res.render('photo_gallery', {activity: data});
  });
});

router.post('/recognize/checkinTmp', function(req, res){
  Jimp.read('./uploads'+req.body.path, function (err, image) {
    image.getBase64(Jimp.AUTO, function(err, img64){
      kairos.recognizeMultiple(img64, function(error, results){
        if (error)
          res.json({error: true, message: 'No face found'});
        else{
          if(results.length == 1 && results[0].transaction.status == 'failure') res.json({error: true, message: 'Unknown user'});
          else{
            var user_id = results[0].transaction.subject_id;
            var ids = [];
            async.waterfall([
              function getID(callback){
                async.each(results, function(result, callback){
                  if(result.transaction.status == 'success')
                    ids.push(result.transaction.subject_id);
                  callback();
                }, function(err){
                  if(err) console.log(err);
                  else callback(null, ids);
                });
              },
              function getUser(ids, callback){
                User.find({userID: {'$in': ids}}).select("-password -_v -latest_picture_id").lean().exec(function(err, users){
                  if(err) res.json({error: true, message: 'System error'});
                  else{
                    callback(null, users);
                  }
                });
              }
            ], function(err, output){
              if(err) res.json({error: true, message: 'System error'});
              else res.json({error: false, results: results, profile: output});
            });
          }
        }
      });
    });
  });

});

router.post('/createAlbum/:id', function(req, res){
  Album.create({activity: req.params.id, title: req.body.title}, function(err, album){
    if(err) console.log(err);
    else{
      Activity.findOneAndUpdate({_id: req.params.id}, {album: album._id}, function(err){
        if(err) console.log(err);
        else res.redirect('/photos/album/'+album._id);
      });
    }
  });
});

module.exports = router;
