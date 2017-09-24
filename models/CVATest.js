var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var autoIncrement = require('mongoose-auto-increment');
var fs = require('fs');
var test_prefix = 'cva_';
var audio_prefix = 'audio_';
var sample_prefix = 'sample_';
var Landmark = ('./landmarks');
var Image = ('./image').Image;

var CVATestSchema = mongoose.Schema({
  user_id: String,
  angle: Number,
  speechAccuracy: Number,
  landmark_id: String,
  image_id: String,
  audio_id: String,
  testTime: {
    type: Date,
    default: Date.now
  }
});

var CVAAudioSchema = mongoose.Schema({
  path: {
    type: String,
    trim: true
  },
  duration: Number,
  text: String,
  sampleText_id: String
});

var SampleTextSchema = mongoose.Schema({
  text: String
});

autoIncrement.initialize(mongoose.connection);
CVATestSchema.plugin(autoIncrement.plugin, { model: 'CVATest', prefix: test_prefix, field: 'CVATestID' });
CVAAudioSchema.plugin(autoIncrement.plugin, { model: 'CVAAudio', prefix: audio_prefix, field: 'CVAAudioID' });
SampleTextSchema.plugin(autoIncrement.plugin, { model: 'SampleText', prefix: sample_prefix, field: 'SampleTextID' });

var CVATest = module.exports.CVATest = mongoose.model('CVATest', CVATestSchema);
var CVAAudio = module.exports.CVAAudio = mongoose.model('CVAAudio', CVAAudioSchema);
var SampleText = module.exports.SampleText = mongoose.model('SampleText', SampleTextSchema);

module.exports.createSampleText = function updateSampleText(text){
  SampleText.nextCount(function(err, count){
    var newSampleText = new SampleText({sampleTextID: count, text: text});
    newSampleText.save(function(err){
      if(err) throw err;
    });
  });
};

module.exports.saveResults = function saveResults(userID, angle, speechAccuracy, imgID, audioID, landmarkID){
  var newCVATest = new CVATest({user_id: userID, angle: angle, speechAccuracy: speechAccuracy, image_id: imgID, audio_id: audioID, landmark_id: landmarkID});
  newCVATest.save(function(err){
    if(err) throw err;
  });
};
