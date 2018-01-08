var mongoose = require('mongoose');
var moment = require('moment');
var Image = require('./image').Image;
var ObjectId = mongoose.Schema.ObjectId;
var async = require('async');

var ActivitySchema = mongoose.Schema({
  title: String,
  applicant_id: String,
  startTime: Date,
  endTime: Date,
  venue: String,
  content: String,
  registrationDeadline: Date,
  quota: Number,
  contactPerson: String,
  contactInfo: Object,
  speaker: String,
  host: String,
  coHost: String,
  activity_type: {type: ObjectId, ref: 'ActivityType'},
  coverPhoto_path: String,
  videoPlaylist: {type: ObjectId, ref: 'VideoPlaylist'},
  album: {type: ObjectId, ref: 'Album'},
  clickCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  enroll : {type: ObjectId, ref: 'Enroll'}
},
{
	toObject: {virtuals:true},
	toJSON: {virtuals:true}
});

var ActivityTypeSchema = mongoose.Schema({
  type: String
});

var EnrollSchema = mongoose.Schema({
  activity: {type: ObjectId, ref: 'Activity'},
  enrollList: [{
    _id:false,
    user_id: String,
    enrollTime: {type: Date, default: Date.now},
    checkIn: {type: Boolean, default: false},
    checkInTime: Date,
    data: Object
  }]
});

var CheckInTmpSchema = mongoose.Schema({
  activity: {type: ObjectId, ref: 'Activity'},
  path: String,
  checkInTime: {type: Date, default: Date.now()},
  status: String
});



var Activity = module.exports.Activity = mongoose.model('Activity', ActivitySchema);
var ActivityType = module.exports.ActivityType = mongoose.model('ActivityType', ActivityTypeSchema);
var Enroll = module.exports.Enroll = mongoose.model('Enroll', EnrollSchema);
var CheckInTmp = module.exports.CheckInTmp = mongoose.model('CheckInTmp', CheckInTmpSchema);

module.exports.createActivity = function createActivity(data, path, userID, callback){
  if(data.startDate && data.startTime) var start = moment(data.startDate + ' ' + data.startTime);
  else var start = undefined;
  if(data.endDate && data.endTime) var end = moment(data.endDate + ' ' + data.endTime);
  else var end = undefined;
  if(data.deadLineDate && data.deadLineTime) var deadLine = moment(data.deadLineDate + ' ' + data.deadLineTime);
  else var deadLine = undefined;
  var contact = {tel: data.tel, email: data.email};
  if(path)
    var img_path = path.replace("./uploads", "");
  else img_path = undefined;

  ActivityType.findOne({type: data.type}, function(err, type){
    if(err) console.log(err);
    else{
      Enroll.create({}, function(err, doc){
        if(err) console.log(err);
        else{
          var newActivity = new Activity({
            title: data.title,
            applicant_id: userID,
            startTime: start,
            endTime: end,
            venue: data.venue,
            content: data.content,
            registrationDeadline: deadLine,
            quota: data.quota,
            contactPerson: data.contactPerson,
            contactInfo: contact,
            speaker: data.speaker,
            host: data.host,
            coHost: data.coHost,
            activity_type: type._id,
            coverPhoto_path: img_path,
            enroll: doc._id
          });

          newActivity.save(function(err, doc){
            if(err) console.log(err);
            else{
              Enroll.findOneAndUpdate({_id: doc.enroll}, {activity: doc._id}).exec();
            }
            doc.type = data.type;
            callback(err, doc);
          });
        }
      });
    }
  });
};
