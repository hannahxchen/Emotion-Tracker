var mongoose = require('mongoose');
var autoIncrement = require('mongoose-auto-increment');
var moment = require('moment');
var activity_prefix = 'act_';
var activityType_prefix = 'actType_';
var enroll_prefix = 'enroll_';
var Image = require('./image').Image;

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
  activityType_id: String,
  coverPhoto_path: String,
  videoPlaylist_id: String,
  album_id: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

var ActivityTypeSchema = mongoose.Schema({
  type: String
});

var EnrollSchema = mongoose.Schema({
  activity_id: String,
  enrollList: [{
    _id:false,
    user_id: String,
    enrollTime: Date,
    checkIn: Boolean,
    checkInTime: Date
  }]
});

autoIncrement.initialize(mongoose.connection);
ActivitySchema.plugin(autoIncrement.plugin, { model: 'Activity', prefix: activity_prefix, field: 'activityID' });
ActivityTypeSchema.plugin(autoIncrement.plugin, { model: 'ActivityType', prefix: activityType_prefix, field: 'activityTypeID' });
EnrollSchema.plugin(autoIncrement.plugin, {model: 'Enroll', prefix: enroll_prefix, field: 'enrollID'});

var Activity = module.exports.Activity = mongoose.model('Activity', ActivitySchema);
var ActivityType = module.exports.ActivityType = mongoose.model('ActivityType', ActivityTypeSchema);
var Enroll = module.exports.Enroll = mongoose.model('Enroll', EnrollSchema);

module.exports.createActivity = function createActivity(data, path, userID){
  var start = moment(data.startDate + ' ' + data.startTime, 'YYYY-MM-DD HH:mm');
  var end = moment(data.endDate + ' ' + data.endTime, 'YYYY-MM-DD HH:mm');
  var deadLine = moment(data.deadLineDate + ' ' + data.deadLineTime, 'YYYY-MM-DD HH:mm');
  var contact = {tel: data.tel, email: data.email};
  ActivityType.findOne({type: data.type}, function(err, type){
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
      activityType_id: type.activityTypeID,
      coverPhoto_path: path,
    });

    newActivity.save(function(err, doc){
      if(err) throw err;
      //console.log(doc);
    });
  });

};
