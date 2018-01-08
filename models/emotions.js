var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var EmotionSchema = mongoose.Schema({
  user_id: String,
  emotions: Object,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

var EmotionTmpSchema = mongoose.Schema({
  image_id: String,
  faces: [{
    position: Object,
    emotions: Object
  }]
});


var Emotion = module.exports.Emotion = mongoose.model('Emotion', EmotionSchema);
var EmotionTmp = module.exports.EmotionTmp = mongoose.model('EmotionTmp', EmotionTmpSchema);
