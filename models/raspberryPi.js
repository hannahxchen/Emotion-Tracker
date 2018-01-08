var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = mongoose.Schema.ObjectId;

var RaspberryPiSchema = mongoose.Schema({
  location: String
});

var SensorDataSchema = mongoose.Schema({
  raspberryPi: {type: ObjectId, ref: 'RaspberryPi'},
  temperature: Number,
  humidity: Number,
  pm25: Number,
  co2: Number,
  detected_time: Date
});

var RaspiLogSchema = mongoose.Schema({
  user_id: String,
  raspberryPi: {type: ObjectId, ref: 'RaspberryPi'},
  emotion_id: [{type: ObjectId, ref: 'Emotion'}],
  appear_time: Date,
  disappear_time: Date
});

var LogImgTmpSchema = mongoose.Schema({
  log: {type: ObjectId, ref: 'RaspiLog'},
  image_folder: String
});


var RaspberryPi = module.exports.RaspberryPi = mongoose.model('RaspberryPi', RaspberryPiSchema);
var SensorData = module.exports.SensorData = mongoose.model('SensorData', SensorDataSchema);
var RaspiLog = module.exports.RaspiLog = mongoose.model ('RaspiLog', RaspiLogSchema);
var LogImgTmp = module.exports.LogImgTmp = mongoose.model ('LogImgTmp', LogImgTmpSchema);
