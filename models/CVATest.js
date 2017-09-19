var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var autoIncrement = require('mongoose-auto-increment');
var test_prefix = 'cva_';
var audio_prefix = 'audio_';
var sample_prefix = 'sample_';

var CVATestSchema = mongoose.Schema({
  user_id: String,
  slop: Number,
  speechAccuracy: Number,
  landmarks_id: String,
  image_id: String,
  audio_id: String
  testTime: {
    type: Date,
    default: Date.now
  }
});

var CVAAudioSchema = mongoose.Schema({
  audioPath: String,
  text: String,
  sampleText_id: String
});

var SampleText = mongoose.Schema({
  text: String
});

autoIncrement.initialize(mongoose.connection);
CVATestSchema.plugin(autoIncrement.plugin, { model: 'CVATest', prefix: test_prefix, field: 'CVATestID' });
CVAAudioSchema.plugin(autoIncrement.plugin, { model: 'CVAAudio', prefix: audio_prefix, field: 'CVAAudioID' });
SampleTextSchema.plugin(autoIncrement.plugin, { model: 'SampleText', prefix: sample_prefix, field: 'SampleTextID' });

var CVATest = module.exports = mongoose.model('CVATest', CVATestSchema);
var CVAAudio = module.exports = mongoose.model('CVAAudio', CVAAudioSchema);
var SampleText = module.exports = mongoose.model('SampleText', SampleTextSchema);
