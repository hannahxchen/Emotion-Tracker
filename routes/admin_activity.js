var express = require('express');
var router = express.Router();
var Activity = require('../models/activity').Activity;
var ActivityType = require('../models/activity').ActivityType;
var CheckInTmp = require('../models/activity').CheckInTmp;
var User = require('../models/user').User;
var Enroll = require('../models/activity').Enroll;
var kairos = require('../API/kairos');
var async = require('async');
var fs = require('fs');

router.get('/', function(req, res){
  async.parallel({
    getTypes: function(callback){
      ActivityType.find({}, function(err, docs){
        if(err) callback(true);
        else{
          var types = [];
          async.each(docs, function(element, callback){
            types.push(element.type);
            callback();
          }, function(err){
            if(err) callback(true);
            else callback(null, types);
          });
        }
      });
    },
    getActivity: function(callback){
      Activity.find({}).populate('activity_type').lean().exec(function(err, docs){
        if(err) callback(true);
        else callback(null, docs);
      });
    }
  }, function(err, results){
    if(err) console.log(err);
    else res.render('admin_activity', {activities: results.getActivity, types: results.getTypes});
  });
});

router.get('/:id', function(req, res){
  async.parallel({
    getTypes: function(callback){
      ActivityType.find({}).lean().exec(function(err, types){
        if(err) callback(true);
        else callback(null, types);
      });
    },
    getActivity: function(callback){
      var unchecked = [];
      var checked = [];
      var checkIn_ratio, enroll_ratio;
      Activity.findById(req.params.id).populate('activity_type').populate('enroll').exec(function(err, doc){
        if(err) callback(true);
        else{
          doc.enroll.enrollList.forEach(function(element){
            if(element.checkIn == false) unchecked.push(element);
            else checked.push(element);
          });
          if(checked.length == 0) checkIn_ratio = 0;
          else checkIn_ratio = checked.length/(doc.enroll.enrollList.length)*100;
          if(doc.enroll.enrollList.length == 0) enroll_ratio = 0;
          else enroll_ratio = doc.enroll.enrollList.length/doc.quota*100;
          callback(null, {activity: doc, unchecked: unchecked, checked: checked, checkIn_ratio: checkIn_ratio, enroll_ratio: enroll_ratio});
        }
      });
    },
    getCheckinTmp: function(callback){
      CheckInTmp.find({activity: req.params.id}).lean().exec(function(err, tmps){
        if(err) callback(true);
        else callback(null, tmps);
      });
    }
  }, function(err, results){
      if(err) console.log(err);
      else{
        res.render('admin_activity_info', {
          activity_type: results.getTypes,
          activity: results.getActivity.activity,
          list: {unchecked: results.getActivity.unchecked, checked: results.getActivity.checked},
          checkIn_ratio: results.getActivity.checkIn_ratio,
          enroll_ratio: results.getActivity.enroll_ratio,
          checkintmps: results.getCheckinTmp
        });
      }
  });
});

router.post('/updateTmp/:id', function(req, res){
  Enroll.findOne({activity: req.params.id, 'enrollList.user_id': req.body.user_id}, function(err, doc){
    if(!doc){
      async.parallel({
        getTmp: function(callback){
          CheckInTmp.findOne({_id: req.body.tmp_id}, function(err, tmp){
            if(err) callback(true);
            else callback(null, tmp);
          });
        },
        getUser: function(callback){
          User.findOne({userID: req.body.user_id}, function(err, user){
            console.log(user);
            if(err) callback(true);
            else callback(null, user);
          });
        }
      }, function(err, results){
        if(err) res.json({error: true});
        else{
          var data = {user_id: req.body.user_id, data:{username: results.getUser.username, name: results.getUser.name, birth: results.getUser.birth,
            gender: results.getUser.gender, email: results.getUser.email}, enrollTime: results.getTmp.checkInTime, checkInTime: results.getTmp.checkInTime, checkIn: true};
          Enroll.findOneAndUpdate({activity: req.params.id}, {$push: {enrollList: data}}, function(err){
            res.json({error: false, data: results.getUser, time: results.getTmp.checkInTime});
          });
        }
        CheckInTmp.remove({_id: req.body.tmp_id}).exec();
        fs.unlink(results.getTmp.path, function(err){
          if(err) console.log(err);
        });
      });
    }
    else{
      Enroll.findOne({activity: req.params.id, 'enrollList': {$elemMatch: {user_id: req.body.user_id, checkIn: false}}}, function(err, doc){
        if(doc) {
          Enroll.findOneAndUpdate({activity: req.params.id, 'enrollList.user_id': req.body.user_id}, {'$set': {'enrollList.$.checkin': true}}, {new: true}, function(err){
            CheckInTmp.findOneAndRemove({_id: req.body.tmp_id}, function(err, removed){
              fs.unlink(removed.path, function(err){
                if(err) console.log(err);
              });
            });
            res.json({error: false});
          });
        }
        else{
          CheckInTmp.findOne({_id: req.body.tmp_id}, function(err, tmp){
            async.parallel({
              updateCheck: function(callback){
                Enroll.findOneAndUpdate({activity: req.params.id, 'enrollList.user_id': req.body.user_id}, {'$set': {'enrollList.$.checkin': true}}, function(err){
                  callback(null);
                });
              },
              updateTime: function(callback){
                Enroll.findOneAndUpdate({activity: req.params.id, 'enrollList.user_id': req.body.user_id},
                {'$set': {'enrollList.$.checkInTime': tmp.checkInTime}}, {upsert: true}, function(err, enroll){
                  console.log(enroll);
                  callback(null);
                });
              }
            }, function(err){
              User.findOne({userID: req.body.user_id}, function(err, user){
                res.json({error: false, data: user, time: tmp.checkInTime});
                CheckInTmp.remove({_id: req.body.tmp_id}).exec();
                fs.unlink(tmp.path, function(err){
                  if(err) console.log(err);
                });
              });

            })
          });
        }
      });

    }
  });

});

router.post('/deleteEnroll/:id', function(req, res){
  Enroll.findOneAndUpdate({activity_id: req.params.id}, {$pull: {'enrollList': {'user_id': {"$in": req.body.selected}}}}, { safe: true, multi:true }, function(err, enroll){
    if(err) res.json({error: true});
    else{
      console.log(enroll);
      res.json({error: false});
    }
  });
});

router.post('/deleteTmp', function(req, res){
  CheckInTmp.remove({_id: { "$in": req.body.selected}}, function(err){
    if(err) res.json({error: true});
    else res.json({error: false});
  });
});

router.post('/register_checkin', function(req, res){

});

module.exports = router;
