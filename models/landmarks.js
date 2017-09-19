var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var autoIncrement = require('mongoose-auto-increment');
var prefix = 'landmarks_';

var LandmarkSchema = mongoose.Schema({
  user_id: String,
  media: String,
  landmarks: Object,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

autoIncrement.initialize(mongoose.connection);
LandmarkSchema.plugin(autoIncrement.plugin, { model: 'Landmark', prefix: prefix, field: 'landmarkID' });

var Landmark = module.exports = mongoose.model('Landmark', LandmarkSchema);
