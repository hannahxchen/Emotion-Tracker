var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var autoIncrement = require('mongoose-auto-increment');
var prefix = 'emo_';

var EmotionSchema = mongoose.Schema({
  user_id: String,
  media: String,
  emotions: Object,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

autoIncrement.initialize(mongoose.connection);
EmotionSchema.plugin(autoIncrement.plugin, { model: 'Emotion', prefix: prefix, field: 'emotionID' });

var Emotion = module.exports = mongoose.model('Emotion', EmotionSchema);
