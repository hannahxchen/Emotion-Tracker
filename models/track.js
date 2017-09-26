var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var autoIncrement = require('mongoose-auto-increment');
var track_prefix = 'track_';
var factor_prefix = 'factor_';

var TrackSchema = mongoose.Schema({
  trackStart: Date,
  trackFinish: Date,
  emotions: [{}],
  user_id: [String],
  raspberryPi_id: String,
  image_id: String
});

var EnvFactorSchema = mongoose.Schema({
  observation: Number,
  time: Date,
  sensor_id: String
});

autoIncrement.initialize(mongoose.connection);
TrackSchema.plugin(autoIncrement.plugin, { model: 'Track', prefix: track_prefix , field: 'trackID'});
EnvFactorSchema.plugin(autoIncrement.plugin, { model: 'EnvironmentalFactor', prefix: factor_prefix, field: 'envFactorID' });

var Track = module.exports.Track = mongoose.model('Track', TrackSchema);
var EnvironmentalFactor = module.exports.EnvFactor = mongoose.model('EnvironmentalFactor', EnvFactorSchema);
