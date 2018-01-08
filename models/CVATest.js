var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var fs = require('fs');
var Landmark = ('./landmarks');
var Image = ('./image').Image;
var ObjectId = mongoose.Schema.ObjectId;

var CVATestSchema = mongoose.Schema({
  user_id: String,
  angle: Number,
  speechAccuracy: Number,
  landmarks: {type: ObjectId, ref: 'Landmark'},
  image_id: String,
  audio: {type: ObjectId, ref: 'CVAAudio'},
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
  sampleText: {type: ObjectId, ref: 'SampleText'},
});

var SampleTextSchema = mongoose.Schema({
  text: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

var CVATest = module.exports.CVATest = mongoose.model('CVATest', CVATestSchema);
var CVAAudio = module.exports.CVAAudio = mongoose.model('CVAAudio', CVAAudioSchema);
var SampleText = module.exports.SampleText = mongoose.model('SampleText', SampleTextSchema);

module.exports.createSampleText = function updateSampleText(text){
  SampleText.create({text: text}, function(err){
    if(err) console.log(err);
  })
};

module.exports.saveResults = function saveResults(userID, angle, speechAccuracy, imgID, audioID, landmarkID){
  var newCVATest = new CVATest({user_id: userID, angle: angle, speechAccuracy: speechAccuracy, image_id: imgID, audio: audioID, landmark: landmarkID});
  newCVATest.save(function(err){
    if(err) throw err;
  });
};
