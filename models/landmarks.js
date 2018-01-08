var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var LandmarkSchema = mongoose.Schema({
  user_id: String,
  image_id: String,
  landmarks: [{
    _id:false,
    x: Number,
    y: Number
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

var Landmark = module.exports.Landmark = mongoose.model('Landmark', LandmarkSchema);
