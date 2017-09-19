var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var autoIncrement = require('mongoose-auto-increment');
var prefix = 'calibration_';

var CalibrationSchema = mongoose.Schema({
  detectedEmotions_id: String,
  trueValue: Object,
  emotionDifference: Object,
  ageDifference: Number,
  user_id: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

autoIncrement.initialize(mongoose.connection);
CalibrationSchema.plugin(autoIncrement.plugin, { model: 'Calibration', prefix: prefix, field: 'calibrationID' });

var Calibration = module.exports = mongoose.model('Calibration', CalibrationSchema);
