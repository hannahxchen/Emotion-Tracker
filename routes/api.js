var express = require('express');
var router = express.Router();
var bcrypt = require('bcryptjs');
var Token = require('../models/token');
var User = require('../models/user').User;
var user_ = require('../models/user');
var Relation = require('../models/user').Relation;
var Appearance = require('../models/appearance');
var Avatar = require('../models/image').Avatar;
var Image = require('../models/image').Image;
var Album = require('../models/image').Album;
var image_= require('../models/image');
var Emotion = require('../models/emotions').Emotion;
var ProfilePic = require('../models/image').ProfilePic;
var ActivityType = require('../models/activity').ActivityType;
var Activity = require('../models/activity').Activity;
var Enroll = require('../models/activity').Enroll;
var RaspiLog = require('../models/raspberryPi').RaspiLog;
var SensorData = require('../models/raspberryPi').SensorData;
var CVATest = require('../models/CVATest').CVATest;
var Task = require('../models/task').Task;
var kairos = require('../API/kairos');
var azure = require('../API/azure');
var activity_ = require('./activity');
var json2csv = require('json2csv');
var moment = require('moment');
var multer = require('multer');
var fs = require('fs');
var Jimp = require('jimp');
var async = require('async');

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

router.get('/allUsers', function(req, res){
  var fields = [{label: 'UserID', value: 'userID'},
  {label: 'Name', value: 'name'},
  {label: 'Username', value: 'username'},
  {label: 'Profile Picture', value: function(row){
    return 'http://120.126.15.20/avatar/'+row.profile_picture_id+'.jpg';
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

router.put('/user/:username', function(req, res){
  Token.findToken(req.headers.key, function(err, key){
    if(err) throw err;
    if(!key) res.json({success: false, message: 'Authentication failed. Token key not found.'});
    else{
      if(!req.params.username) res.json({success: false, message: 'Missing username parameter.'});
      var option = {};
      if(req.body.email) option.email = req.body.email;
      if(req.body.password){
        if(req.body.password != req.body.confirmPwd)  res.json({success: false, message: 'Confirm password does not match the password'});
        else option.password = req.body.password;
      }
      if(req.body.role) option.role = req.body.role;

      bcrypt.genSalt(10, function(err, salt) {
  			bcrypt.hash(option.password, salt, function(err, hash) {
  				option.password = hash;
          User.findOneAndUpdate({username: req.params.username}, option, {new: true}).lean().exec(function(err, user){
            if(err) res.json({success: false, message: 'User not found.'});
            else res.json({success: true, data: user, message: 'Updated successfully.'});
          });
  			});
  		});
    }
  });
});

router.delete('/user/:username', function(req, res){
  Token.findToken(req.headers.key, function(err, key){
    if(err) throw err;
    if(!key) res.json({success: false, message: 'Authentication failed. Token key not found.'});
    else{
      User.findOne({userID: req.params.username}).remove(function(err){
        if(err) res.json({success: false, message: 'Error deleting the user.'});
        else res.json({success: true, message: 'Delete the user successfully.'});
      });
    }
  });
});

router.post('/userAuthenticate', function(req, res){
  Token.findToken(req.headers.key, function(err, key){
    if(err) throw err;
    if(!key) res.json({success: false, message: 'Authentication failed. Token key not found.'});
    if(!req.body.username || !req.body.password){
      res.json({success:false, message: 'Authentication failed. Missing parameters!'});
    }
    User.findOne({username: req.body.username}, function(err, user){
      if(err) throw err;
      if(!user){
        res.json({success:false, message: 'Authentication failed. User not found!'});
      }
      else{
        user_.validPassword(req.body.password, user.password, function(err, isMatch){
          if(err) throw err;
          if(isMatch){
            res.json({success: true, message: 'User is authenticated!'})
          } else {
            res.json({success: false, message: 'Authentication failed. Invalid password!'});
          }
        });
      }
    });
  });
});

router.post('/createUser', function(req, res){
  Token.findToken(req.headers.key, function(err, key){
    if(err) throw err;
    if(!key) res.json({success: false, message: 'Authentication failed. Token key not found.'});
    else{
      var name = req.body.name;
    	var gender = req.body.gender;
    	var role = req.body.role;
    	var email = req.body.email;
    	var birthday = req.body.birthday;
    	var username = req.body.username;
    	var password = req.body.password;
    	var confirmPwd = req.body.confirmPwd;
    	var img = req.body.img;
      if(name && gender && role && email && birthday && username && password && img){
        if(password != confirmPwd) res.json({success: false, message: 'Confirm password does not match the password.'});
        else {
          kairos.recognize(req.body.img, function(error, status, id){
            if(error) res.json({success: false, message: 'No face found.'});
            else if(status == 'success'){
              User.findOne({userID: id}, function(err, doc){
                if(doc.role == 'unknown'){
                  var newUser = new User({
          					name: req.body.name,
          					email: req.body.email,
          					username: req.body.username,
          					password: req.body.password,
          					role: req.body.role,
          					birth: req.body.birthday,
          					gender: req.body.gender
          				});
          				user_.createExistedUser(id, newUser, req.bod.img, function(err){
          					if(err){
          						res.json({success: false, message: 'No face found.'});
          					}
          					else{
          						res.json({success: true, message:'註冊完成，您現在可以進行登入！'});
          					}
          				});
                }
                else  res.json({success: false, message: 'You have already registered.'});
              });
            }
            else{
              var newUser = new User({
      					name: req.body.name,
      					email: req.body.email,
      					username: req.body.username,
      					password: req.body.password,
      					role: req.body.role,
      					birth: req.body.birthday,
      					gender: req.body.gender
      				});
      				user_.createUser(newUser, req.body.img, function(err){
      					if(err) res.json({success: false, message: 'No face found.'});
      					else{
      						res.json({success: true, message:'註冊完成，您現在可以進行登入！'});
      					}
      				});
            }
          });
          res.json({success: true, message: 'Create the user successfully.'});
        }
      }
      else{
        res.json({success: false, message: 'Missing parameters.'});
      }
    }
  });
});

router.post('/user/forgotPwd', function(req, res){
  Token.findToken(req.headers.key, function(err, key){
    if(err) throw err;
    if(!key) res.json({success: false, message: 'Authentication failed. Token key not found.'});
    else{
      async.waterfall([
        function(done) {
          crypto.randomBytes(20, function(err, buf) {
            var token = buf.toString('hex');
            done(err, token);
          });
        },
        function(token, done) {
          User.findOne({ email: req.body.email }, function(err, user) {
            if (!user) {
              return res.json({success: false, message: 'User not found.'});
            }

            user.resetPwdToken = token;
            user.resetPwdExpires = Date.now() + 3600000; // 1 hour

            user.save(function(err) {
              done(err, token, user);
            });
          });
        },
        function(token, user, done) {
          var smtpTransport = nodemailer.createTransport({
            service: 'gmail',
            auth: {
    					type: 'OAuth2',
    					user: serviceMail.mailUser,
    					clientId: serviceMail.clientId,
              clientSecret: serviceMail.clientSecret,
              refreshToken: serviceMail.refreshToken
            }
          });
          var mailOptions = {
            to: user.email,
            from: serviceMail.mailUser,
            subject: 'Emotion Tracker 重設密碼',
            text: '您收到此封信是因為您或者有他人要求更改密碼，\n\n' +
              '請點擊以下連結或是複製連結至瀏覽器開啟:\n\n' +
              'http://' + req.headers.host + '/reset/' + token + '\n\n' +
              '若您沒有要重新設置密碼，請忽略此訊息。\n'
          };
          smtpTransport.sendMail(mailOptions, function(err) {
    				if(err){
    					console.log(err);
    					return res.json({success: false, message: 'Mail sending error.'})
    				}
            console.log('info', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
    				res.json({success: true, message: 'The mail has been sent out successfully.'});
            done(err, 'done');
          });
        }
      ], function(err) {
        if (err) return next(err);
      });
    }
  });
});

router.get('/activity/:id', function(req, res){
  Token.findToken(req.headers.key, function(err, key){
    if(err) throw err;
    if(!key) res.json({success: false, message: 'Authentication failed. Token key not found.'});
    else{
      Activity.findOne({activityID: req.params.id}).lean().exec(function(err, doc){
        res.json({success: true, data: doc});
      });
    }
  });
});

router.post('/newActivity', function(req, res){
  Token.findToken(req.headers.key, function(err, key){
    if(err) throw err;
    if(!key) res.json({success: false, message: 'Authentication failed. Token key not found.'});
    else{
      async.waterfall([
        function(callback) {
          if(req.body.coverPhoto){
            Image.create({}, function(err, doc){
              var path = "./uploads/activityCover/"+ doc.imageID +'.jpg';
              fs.writeFile(path, req.body.coverPhoto, 'base64', function(err){
                if(err) throw err;
              });
              doc.path = path;
              doc.save(function(err, img){
                if(err) console.log(err);
                else callback(null, img.path.replace('./uploads,', ''));
              });
            });
          }
          else callback(null, undefined);
        },
        function(img_path, callback) {
          ActivityType.findOne({type: req.body.activityType}, function(err, doc){
            var newActivity = new Activity({
              title: req.body.title,
              applicant_id: req.body.applicantID,
              startTime: req.body.startTime,
              endTime: req.body.endTime,
              venue: req.body.venue,
              content: req.body.content,
              registrationDeadline: req.body.registrationDeadline,
              quota: req.body.quota,
              contactPerson: req.body.contactPerson,
              contactInfo: {email: req.body.contactEmail, tel: req.body.contactTel},
              speaker: req.body.speaker,
              host: req.body.host,
              coHost: req.body.coHost,
              activityType_id: doc.activityTypeID,
              coverPhoto_path: img_path
            });

            newActivity.save(function(err, doc){
              if(err) res.json({success: false, message: 'Error creating new activity'});
              else callback(null, doc);
            });
          });
        }
      ], function (err, result) {
        if(err){
          console.log(err);
          res.json({success: false, message: 'Error creating new activity.'});
        }
        else res.json({success: true, data: result, message: 'Create the activity successfully.'});
      });
    }
  });
});

router.post('/activity/popular', function(req, res){
  Token.findToken(req.headers.key, function(err, key){
    if(err) throw err;
    if(!key) res.json({success: false, message: 'Authentication failed. Token key not found.'});
    else{
      var query;
      var perPage = 10;
      var page = Math.max(0, req.params.page);
      if(req.params.page != 0){
        if(!req.body.lastClickCount) res.json({success: false, message: 'Missing lastClickCount parameter.'});
        query = {clickCount: {"$lte": req.body.lastClickCount}};
      }
      Activity.find(query).sort('-clickCount').skip(perPage*page).limit(10).lean().exec(function(err, docs){
        if(err) res.json({success: false, message: 'Error fetching activities.'});
        else res.json({success: true, data: docs});
      });
    }
  });
});

router.post('/activity/recent/:page', function(req, res){
  Token.findToken(req.headers.key, function(err, key){
    if(err) throw err;
    if(!key) res.json({success: false, message: 'Authentication failed. Token key not found.'});
    else{
      var query;
      var perPage = 10;
      var page = Math.max(0, req.params.page);
      if(req.params.page != 0){
        if(!req.body.lastStartTime) res.json({success: false, message: 'Missing lastStartTime parameter.'});
        query = {startTime: {"$gte": req.body.lastStartTime}};
      }
      Activity.find(query).sort('startTime').skip(perPage*page).limit(10).lean().exec(function(err, docs) {
        if(err) res.json({success: false, message: 'Error fetching activities.'});
        else res.json({success: true, data: docs});
      });
    }
  });
});

router.post('/activity/past/:page', function(req, res){
  Token.findToken(req.headers.key, function(err, key){
    if(err) throw err;
    if(!key) res.json({success: false, message: 'Authentication failed. Token key not found.'});
    else{
      var query;
      var perPage = 10;
      var page = Math.max(0, req.params.page);
      if(req.params.page != 0){
        if(!req.body.firstQueryTime) res.json({success: false, message: 'Missing startTime parameter.'});
        query = {endTime: {"$lte": req.body.firstQueryTime}};
      }
      else{
        query = {endTime: {"$lte": Date.now}};
      }
      Activity.find(query).sort('-endTime').skip(perPage*page).limit(10).lean().exec(function(err, docs){
        if(err) res.json({success: false, message: 'Error fetching activities.'});
        else res.json({success: true, data: docs});
      });
    }
  });
});

router.post('/activity/:page', function(req, res){
  Token.findToken(req.headers.key, function(err, key){
    if(err) throw err;
    if(!key) res.json({success: false, message: 'Authentication failed. Token key not found.'});
    else{
      var query = {};
      var keyword_search;
      var sortby = 'clickCount';
      var ascend = '-';
      var perPage = 10;
      var page = Math.max(0, req.params.page);

      if(req.body.keyword){
        var keyword = req.body.keyword;
        keyword_search = [{title: {"$regex": keyword}},
                          {speaker: {"$regex": keyword}},
                          {content: {"$regex": keyword}},
                          {host: {"$regex": keyword}},
                          {coHost: {"$regex": keyword}}];
        query['$or'] = keyword_search;
      }
      if(req.body.ascend) ascend = '';
      if(req.body.sortby == 'time') sortyby = 'startTime';
      if(req.body.showPast == 'false') query['endTime'] = {'$gte': Date.now};
      else if(req.body.startDate) query['startTime'] = {'$gte': req.body.startDate};
      else if(req.body.endDate) query['endTime'] = {'$lte': req.body.endDate};

      Activity.find(query).sort(ascend + sortby).skip(perPage*page).limit(10).lean().exec(function(err, docs){
        if(err) res.json({success: false, message: 'Error fetching activities.'});
        else res.json({success: true, data: docs});
      });
    }
  });
});

router.put('/activity/:id', function(req, res){
  Token.findToken(req.headers.key, function(err, key){
    if(err) throw err;
    if(!key) res.json({success: false, message: 'Authentication failed. Token key not found.'});
    else{
      var options = {};
      if(req.body.title) options.title = req.body.title;
      if(req.body.startTime) options.startTime = req.body.startTime;
      if(req.body.endTime) options.endTime = req.body.endTime;
      if(req.body.venue) options.venue = req.body.venue;
      if(req.body.content) options.content = req.body.content;
      if(req.body.registrationDeadline) options.registrationDeadline = req.body.registrationDeadline;
      if(req.body.quota) options.quota = req.body.quota;
      if(req.body.contactPerson) options.contactPerson = req.body.contactPerson;
      if(req.body.contactEmail) options['$set'] = {'contactInfo.email': req.body.contactEmail};
      if(req.body.contactTel) options['$set'] = {'contactInfo.tel': req.body.contactTel};
      if(req.body.speaker) options.speaker = req.body.speaker;
      if(req.body.host) options.host = req.body.host;
      if(req.body.coHost) options.coHost = req.body.coHost;
      if(req.body.activityType){
        ActivityType.findOne({type: req.body.activityType}, function(err, doc){
          if(err) throw err;
          options.activityType_id = doc.activityTypeID;
        });
      }
      if(req.body.coverPhoto){

      }

      Activity.findOneAndUpdate({activityID: req.params.id}, options, {new: true}).lean().exec(function(err, docs){
        if(err) res.json({success: false, message: 'Error updating activities.'});
        else res.json({success: true, data: docs, message: 'Updated successfully.'});
      });
    }
  });
});

router.post('/enroll', function(req, res){
  var data = User.saveUnknwon(req.body.image);
  if(data.error)
    res.json({error: true});
  else
    res.json({userID: data.userID, age: data.age});
});;

router.post('/detect', function(req, res){
  kairos.detect(req.body.image, function(error, status, age, glasses){
    if(status == 'failure'){
      if(error == 'no face found') res.json({error: error});
      else res.json({error: error});
    }
    else if (status == 'success'){
      res.json({age: age, glasses: glasses});
    }
  });
});

router.get('/activityTypes', function(req, res){
  Token.findToken(req.headers.key, function(err, key){
    if(err) throw err;
    if(!key) res.json({success: false, message: 'Authentication failed. Token key not found.'});
    else{
      ActivityType.find({}, function(err, docs){
        if(err) throw err;
        var types = [];
        docs.forEach(function(element){
          types.push(element.type);
        });
        res.json({types: types});
    	});
    }
  });
});

router.post('/recognizeUser', function(req, res){
  Token.findToken(req.headers.key, function(err, key){
    if(err) throw err;
    if(!key) res.json({success: false, message: 'Authentication failed. Token key not found.'});
    else{
      if(req.body.img){
        var path = "./uploads/avatar/tmp.jpg";
        fs.writeFile(path, req.body.img, 'base64', function(err){
          if(err) console.log(err);
        });
        kairos.recognizeMultiple(req.body.img, function(error, results){
          if (error)
            res.json({success: false, message: 'No face found.'});
          else if (results.length > 1)
            res.json({success: false, message: 'Too many faces.'});
          else{
            if(results[0].transaction.status == 'failure') res.json({success: false, message: 'Unknown user.'});
            else{
              var user_id = results[0].transaction.subject_id;
              async.parallel({
                getUser: function(callback){
                  User.findOne({userID: user_id}, function(err, user){
                    if(err) res.json({success: false, message: 'System error.'});
                    else{
                      callback(null, {profile: user, avatar: '/avatar/'+ user.profile_picture_id + '.jpg'});
                    }
                  }).select("-password -_v -latest_picture_id");
                },
                getTasks: function(callback){
                  Task.find({object_id: user_id, done: false}).populate('task_type').lean().exec(function(err, tasks){
                    console.log(tasks);
                    if(err) console.log(err);
                    else callback(null, tasks);
                  });
                }
              }, function(err, results){
                if(err) console.log(err);
                else res.json({success: true, profile: results.getUser.profile, avatar: results.getUser.avatar, tasks: results.getTasks});
              });
            }
          }
        });
      }
      else res.json({success: false, message: 'No image uploaded.'});
    }
  });

});

function base64_encode(path) {
    // read binary data
    var bitmap = fs.readFileSync(path);
    // convert binary data to base64 encoded string
    return new Buffer(bitmap).toString('base64');
}

router.post('/detectEmotion', function(req, res){
  Token.findToken(req.headers.key, function(err, key){
    if(err) throw err;
    if(!key) res.json({success: false, message: 'Authentication failed. Token key not found.'});
    else{
      if(!req.body.img) res.json({success: false, message: 'Image required.'});
      else if(!req.body.userID) res.json({success: false, message: 'userID required.'});
      else{
        Jimp.read(Buffer.from(req.body.img, 'base64'), function(err, image){
          image.exifRotate().getBase64(Jimp.AUTO, function(err, img64){
            image_.saveAvatar(img64.replace('data:image/jpeg;base64,', ''), req.body.userID, undefined, function(imgID){
              azure.recognize('.uploads/avatar/'+imgID+'.jpg', function(err, faces){
                if(err){
                  Image.remove({imageID: imgID}).exec();
                  Avatar.remove({image_id: imgID}).exec();
                  fs.unlinkSync('./uploads/avatar/'+imgID+'.jpg');
                  res.json({success: false, message: err});
                  console.log('API detect emotions error!');
                }
                else{
                  if(faces.length > 1) res.json({success: false, message: 'too many faces'});
                  else {
                    Emotion.create({user_id: req.body.userID, media_id: imgID, emotions: faces[0].emotions}, function(err){
                      if(err) console.log(err);
                    });
                    console.log('API detect emotions success!');
                    console.log(req.body.userID + ' emotions: ');
                    faces[0].emotions.forEach(function(emotion){
                      console.log(emotion);
                    });
                    res.json({success: true, emotions: faces[0].emotions});
                  }
                }
              });
            });
          });
        });
      }
    }
  });
});

router.post('/getEmotions', function(req, res){
  Token.findToken(req.headers.key, function(err, key){
    if(err) throw err;
    if(!key) res.json({success: false, message: 'Authentication failed. Token key not found.'});
    else{
      var oneday = 24 * 60 * 60;
      var now = Date.now()/1000;
      var days = req.body.days;
      var day_query;

      if(req.body.days) day_query = now - days*oneday;
      else day_query = now - 14*oneday;

      Emotion.find({user_id: req.body.userID, createdAt: {'$gt': day_query}}).sort('-createdAt').lean().exec(function(err, emotions){
        if(err) res.json({success: false, message: 'System error'});
        else res.json({success: true, emotions: emotions});
      });
    }
  });
});

router.post('/getLogs', function(req, res){
  Token.findToken(req.headers.key, function(err, key){
    if(err) throw err;
    if(!key) res.json({success: false, message: 'Authentication failed. Token key not found.'});
    else{
      var oneday = 24 * 60 * 60;
      var now = Date.now()/1000;
      var days = req.body.days;
      var day_query;

      if(req.body.days) day_query = now - days*oneday;
      else day_query = now - 14*oneday;

      RaspiLog.find({user_id: req.body.userID, disappear_time: {'$gt': day_query}}).sort('-createdAt').populate('raspberryPi').lean().exec(function(err, logs){
        if(err) res.json({success: false, message: 'System error'});
        else res.json({success: true, logs: logs});
      });
    }
  });
});

router.post('/getCVA', function(req, res){
  Token.findToken(req.headers.key, function(err, key){
    if(err) throw err;
    if(!key) res.json({success: false, message: 'Authentication failed. Token key not found.'});
    else{
      var oneday = 24 * 60 * 60;
      var now = Date.now()/1000;
      var days = req.body.days;
      var day_query;

      if(req.body.days) day_query = now - days*oneday;
      else day_query = now - 14*oneday;

      CVATest.find({user_id: req.body.userID, createdAt: {'$gt': day_query}}).lean().select("-landmarks -audio").exec(function(err, tests){
        if(err) res.json({success: false, message: 'System error'});
        else res.json({success: true, CVAtests: tests});
      });
    }
  });
});

router.post('/getRelations', function(req, res){
  Token.findToken(req.headers.key, function(err, key){
    if(err) throw err;
    if(!key) res.json({success: false, message: 'Authentication failed. Token key not found.'});
    else{
      Relation.find({elder_id: req.body.userID}).populate('relation_type').lean().exec(function(err, relations){
        if(err) res.json({success: false, message: 'System error'});
        else res.json({success: true, relations: relations});
      });
    }
  });
});

router.get('/getActivities/:id', function(req, res){
  console.log('test');
  var d = new Date();
  d.setDate(d.getDate()-30);

  Activity.aggregate([
    {
      $lookup: {
        from: "activitytypes",
        localField: "activity_type",
        foreignField: "_id",
        as: "activity_type"
      }
    },
    {
      $unwind: '$activity_type'
    },
    {
      $lookup: {
        from: "enrolls",
        localField: "enroll",
        foreignField: "_id",
        as: "enroll"
      }
    },
    {
      $unwind: '$enroll'
    },
    {
      $unwind: '$enroll.enrollList'
    },
    {
      $match: {
        "enroll.enrollList.user_id": req.params.id
      }
    },
    {
      $project: {
        _id: 0,
        id: '$_id',
        title: '$title',
        //activity_type: '$activity_type.type',
        start: '$startTime',
        end: '$endTime',
        //checkIn: '$enroll.enrollList.checkIn'
      }
    },
    {
      $sort: {"startTime": -1}
    }
  ], function(err, activities){
    res.json(activities);
  });
});

router.post('/checkin/:id', function(req, res){
  Token.findToken(req.headers.key, function(err, key){
    if(err) throw err;
    if(!key) res.json({success: false, message: 'Authentication failed. Token key not found.'});
    else{
      if(req.body.img){
        res.json({success: true});
        activity_.createCheckInTmps(req.body.img, req.params.id);
      }
      else res.json({success: false, message: 'No image uploaded.'});
    }
  });
});

router.get('/getEnrollList/:id', function(req, res){
  Token.findToken(req.headers.key, function(err, key){
    if(err) throw err;
    if(!key) res.json({success: false, message: 'Authentication failed. Token key not found.'});
    else{
      Enroll.findOne({activity: req.params.id}, function(err, list){
        if(err) res.json({success: false, message: 'System error'});
        else res.json({success: true, list: list.enrollList});
      });
    }
  });
});

router.get('/activity/today', function(req, res){
  Token.findToken(req.headers.key, function(err, key){
    if(err) throw err;
    if(!key) res.json({success: false, message: 'Authentication failed. Token key not found.'});
    else{
      var start = moment().startOf('day'); // set to 12:00 am today
      var end = moment().endOf('day'); // set to 23:59 pm today

      Activity.find({startTime: {$gte: start, $lt: end}}).sort('startTime').populate('activity_type').lean().exec(function(err, activities) {
        if(err) res.json({success: false, message: 'Error fetching activities.'});
        else res.json({success: true, activities: activities});
      });
    }
  });
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
      return ('http://120.126.15.20'+row.coverPhoto_path);
    }},
    {label: 'AlbumID', value: 'album'},
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

router.get('/activities_enroll', function(req, res){
  var fields = [
    {label: 'ActivityID', value: 'activity'},
    {label: 'UserID', value: 'enrollList.user_id'},
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

  var filename = 'enrollLists' + moment().format('YYYYMMDD');

  Enroll.find().lean().exec(function(err, lists){
    if(err) console.log(err);
    else{
      json2csv({data: lists, fields: fields, unwindPath: ['enrollList']}, function(err, csv){
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

router.get('/raspiLogs', function(req, res){
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
      if(row.emotion_id)
        return row.emotion_id;
    }}];

  var filename = 'raspiLogs_' + moment().format('YYYYMMDD');
  RaspiLog.find().populate('raspberryPi').lean().exec(function(err, logs){
    if(err) console.log(err);
    else{
      json2csv({data: logs, fields: fields, unwindPath: ['emotion_id']}, function(err, csv){
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
    return 'http://120.126.15.20'+row.path;
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

router.get('/tasks', function(req, res){
  var fields = [{label: 'TaskID', value: '_id'},
  {label: 'Type', value: 'task_type.type'},
  {label: 'ApplicantID', value: 'applicant_id'},
  {label: 'UserID', value: 'object_id'},
  {label: 'Content', value: 'content'},
  {label: 'Urgency', value: 'urgency'},
  {label: 'Done', value: 'done'},
  {label: 'Created Time', value: function(row){
    return moment.utc(row.createdAt).local().format('YYYY/MM/DD HH:mm:ss');
  }}];

  var filename = 'tasks_' + moment().format('YYYYMMDD');

  Task.find().populate('task_type').lean().exec(function(err, tasks){
    if(err) console.log(err);
    else{
      json2csv({data: tasks, fields: fields}, function(err, csv){
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

router.get('/emotions', function(req, res){
  var fields = [{label: 'EmotionID', value: '_id'},
  {label: 'UserID', value: 'user_id'},
  {label: 'Anger', value: 'emotions.anger'},
  {label: 'Contempt', value: 'emotions.contempt'},
  {label: 'Disgust', value: 'emotions.disgust'},
  {label: 'Fear', value: 'emotions.fear'},
  {label: 'Happiness', value: 'emotions.happiness'},
  {label: 'Neutral', value: 'emotions.neutral'},
  {label: 'Sadness', value: 'emotions.sadness'},
  {label: 'Surprise', value: 'emotions.surprise'},
  {label: 'Created Time', value: function(row){
    return moment.utc(row.createdAt).local().format('YYYY/MM/DD HH:mm:ss');
  }}];

  var filename = 'emotions_unwind_' + moment().format('YYYYMMDD');

  Emotion.find().lean().exec(function(err, emotions){
    if(err) console.log(err);
    else{
      json2csv({data: emotions, fields: fields, unwindPath: ['emotions']}, function(err, csv){
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

router.get('/emotions_v2', function(req, res){
  var fields = [{label: 'EmotionID', value: '_id'},
  {label: 'UserID', value: 'user_id'},
  {label: 'Type', value: 'type'},
  {label: 'Value', value: 'value'},
  {label: 'Created Time', value: function(row){
    return moment.utc(row.createdAt).local().format('YYYY/MM/DD HH:mm:ss');
  }}];

  var filename = 'emotions_' + moment().format('YYYYMMDD');

  var results = [];

  Emotion.find().lean().exec(function(err, emotions){
    async.each(emotions, function(emotion, callback){
      async.forEach(Object.keys(emotion.emotions), function(type, callback){
        results.push({
          _id: emotion._id,
          user_id: emotion.user_id,
          type: type,
          value: emotion.emotions[type],
          createdAt: emotion.createdAt
        });
        callback();
      }, function(err){
        callback();
      });
    }, function(err){
      json2csv({data: results, fields: fields}, function(err, csv){
        if(err) console.log(err);
        else{
          res.set("Content-Disposition", "attachment;filename="+filename+".csv");
          res.set("Content-Type", "application/octet-stream");
          res.send(csv);
        }
      });
    });
  });

  res.status(200);
});

router.get('/relations', function(req, res){
  var fields = [{label: 'RelationID', value: '_id'},
  {label: 'ElderID', value: 'elder_id'},
  {label: 'RelativeID', value: 'relatives.relative_id'},
  {label: 'Relation Type', value: 'relatives.relation_type.type'}];

  var filename = 'relations_' + moment().format('YYYYMMDD');

  Relation.find().populate('relatives.relation_type').lean().exec(function(err, relations){
    if(err) console.log(err);
    else{
      json2csv({data: relations, fields: fields}, function(err, csv){
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

router.get('/albums', function(req, res){
  var fields = [{label: 'AlbumID', value: '_id'},
  {label: 'Title', value: 'title'},
  {label: 'ImageID', value: 'image_id'},
  {label: 'Created Time', value: function(row){
    return moment.utc(row.createdAt).local().format('YYYY/MM/DD HH:mm:ss');
  }},
  {label: 'Last Modified Time', value: function(row){
    return moment.utc(row.lastModified).local().format('YYYY/MM/DD HH:mm:ss');
  }}
];

  var filename = 'albums_' + moment().format('YYYYMMDD');

  Album.find().lean().exec(function(err, albums){
    if(err) console.log(err);
    else{
      json2csv({data: albums, fields: fields, unwindPath: ['image_id']}, function(err, csv){
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

router.get('/appearances', function(req, res){
  var fields = [{label: 'AppearnceID', value: 'appearanceID'},
  {label: 'MediaID', value: function(row){
    if(row.media)
      return row.media_id;
    else
      return null;
  }},
  {label: 'UserID', value: 'user_id'},
  {label: 'Glasses', value: 'glasses'},
  {label: 'Age', value: 'age'},
  {label: 'Avatar URL', value: function(row){
    if(row.media)
      return 'http://120.126.15.20/avatar/'+row.media_id+'.jpg';
    else
      return null;
  }},
  {label: 'Detected Time', value: function(row){
    return moment.utc(row.createdAt).local().format('YYYY/MM/DD HH:mm:ss');
  }}
];

  var filename = 'appearnces_' + moment().format('YYYYMMDD');

  Appearance.find().populate('media').lean().exec(function(err, appearances){
    if(err) console.log(err);
    else{
      json2csv({data: appearances, fields: fields}, function(err, csv){
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

router.get('/cvatests', function(req, res){
  var fields = [{label: 'TestID', value: '_id'},
  {label: 'UserID', value: 'user_id'},
  {label: 'Mouth Angle', value: 'angle'},
  {label: 'Speech Accuracy', value: 'speechAccuracy'},
  {label: 'Speech Text', value: 'audio.text'},
  {label: 'Sample Text', value: 'audio.sampleText.text'},
  {label: 'Image URL', value: function(row){
    return 'http://120.126.15.20/CVA_img/'+row.image_id+'.jpg';
  }},
  {label: 'Audio URL', value: function(row){
    return 'http://120.126.15.20'+row.audio.path;
  }},
  {label: 'Test Time', value: function(row){
    return moment.utc(row.testTime).local().format('YYYY/MM/DD HH:mm:ss');
  }}
];

  var filename = 'cvatests_' + moment().format('YYYYMMDD');

CVATest.find().populate('audio').populate({path: 'audio', populate: {path: 'sampleText'}}).lean().exec(function(err, tests){
    if(err) console.log(err);
    else{
      json2csv({data: tests, fields: fields}, function(err, csv){
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

router.get('/SNA_users', function(req, res){
  var fields = [{label: 'ID', value: function(row){
    return row._id.replace('user', '');
  }},
  {label: 'Name', value: 'name'},
  {label: 'Group', value: 'group'},
  {label: 'Nodevalue', value: 'count'},
  {label: 'From', value: function(row){
    //if(row.from == 0) return '-';
    //else return row.from;
    return row.from;
  }},
  {label: 'To', value: function(row){
    //if(row.to == 0) return '-';
    //else return row.to;
    return row.to;
  }},
];

  var filename = 'SNAUser_' + moment().format('YYYYMMDD');

  getSNA_data(true, function(combinations, userCount){
    json2csv({data: userCount, fields: fields}, function(err, csv){
      if(err) console.log(err);
      else{
        res.set("Content-Disposition", "attachment;filename="+filename+".csv");
        res.set("Content-Type", "application/octet-stream");
        res.send(csv);
      }
    });
  });
});

router.get('/SNA_combos', function(req, res){

  var fields = [{label: 'ID', value: function(row){
    return row.from.replace('user', '');
  }},
  {label: 'ParentID', value: function(row){
    return row.to.replace('user', '');
  }},
  {label: 'Edgevalue', value: 'count'}
];

  var filename = 'SNACombos_' + moment().format('YYYYMMDD');

  getSNA_data(false, function(combinations){
    json2csv({data: combinations, fields: fields}, function(err, csv){
      if(err) console.log(err);
      else{
        res.set("Content-Disposition", "attachment;filename="+filename+".csv");
        res.set("Content-Type", "application/octet-stream");
        res.send(csv);
      }
    });
  });
});

function getSNA_data(option, callback){
  var combinations = [];
  async.parallel({
    getUsers: function(callback){
      User.find().lean().exec(function(err, users){
        if(err) callback(true);
        else callback(null, users);
      });
    },
    getImages: function(callback){
      Image.aggregate([
        {'$unwind': '$people'},
        { "$match": { "people.user_id": { "$ne": "unknown" } } },
        {'$group':{
          _id: '$imageID',
          people: {
            '$addToSet': '$people.user_id'
          }
        }}
      ], function(err, result){
        if(err) callback(true);
        else callback(null, result);
      });
    }
  }, function(err, results){
    async.each(results.getUsers, function(user, callback){
      async.each( results.getImages, function(img, callback){
        if(isInArray(user.userID, img.people)){
          //loop through people in the img
          async.each(img.people, function(person, callback){
            if(isBigger(user, person) && user.userID != person){
              checkCombo(user, person, combinations, function(){
                callback();
              });
            }
            else callback();
          }, function(err){
            callback();
          });
        }
        else callback();
      }, function(err){
        callback();
      });
    }, function(err){
      if(option){
        countForEachUser(combinations, function(result){
          callback(combinations, result);
        });
      }
      else callback(combinations);
    });
  });
};


//check if the user is in the img
function isInArray(value, array) {
  return array.indexOf(value) > -1;
}

//check bigger userIDl
function isBigger(x, y){
  return parseInt(x.userID.replace('user', '')) > parseInt(y.replace('user', ''));
}

//update combinations
function checkCombo(user1, user2, obj, callback){
  var res = false;

    async.waterfall([
      function runLoop(callback){
        var n = 0;
        if(obj.length == 0) callback(null, res);
        else{
          for(var k in obj){
            n++;
            if (obj[k].from == user1.userID && obj[k].to == user2) {
              res = true;
              obj[k].count+=1;
              callback(null, res);
              break;
            }
            else if(n >= obj.length) {
              callback(null, res);
            }
          }
        }

      },
      function update(res, callback){
        if(!res) obj.push({from: user1.userID, to: user2, count: 1});
        callback(null);
      }
    ], function(err){
      callback();
    });

  /*async.each(obj, function(k, callback){
    if (k.from == user1.userID && k.to == user2) {
      res = true;
      k.count+=1;
    }
    else {
      res = false;
    }
    callback();
  }, function(err){
    if(!res) obj.push({from: user1.userID, to: user2, count: 1});
    callback();
  });*/
}

function countForEachUser(combinations, callback){
  Image.aggregate([
    {'$unwind': '$people'},
    {'$group': {
      _id: '$people.user_id',
      count: {$sum: 1}
    }},
    {'$match': {'_id': {'$ne': 'unknown'}}}
  ], function(err, result){
    if(err) console.log(err);
    else {
      async.each(result, function(person, callback){
        async.parallel({
          getGroup: function(callback){
            User.findOne({userID: person._id}, function(err, user){
              if(err) callback(true);
              else {
                if(user.role == 'elder' || user.role == 'admin')
                  person.group = 1;
                else if(user.role == 'relative')
                  person.group = 2;

                person.name = user.name;
                callback(null);
              }
            });
          },
          countKeys: function(callback){
            countKeys(person._id, combinations, function(from, to){
              person.from = from;
              person.to = to;
              callback(null);
            });
          }
        }, function(err){
          callback();
        })
      }, function(err){
        callback(result);
      });
    }
  });
}

function countKeys(user, obj, callback){
  var from = 0;
  var to = 0;
  async.each(obj, function(k, callback){
    if (k.from == user) from+=1;
    if(k.to == user) to+=1
    callback();
  }, function(err){
    callback(from, to);
  });
}

module.exports = router;
