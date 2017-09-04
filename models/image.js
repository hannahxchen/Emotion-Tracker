var mongoose = require('mongoose');

var ImageSchema = mongoose.Schema({
  path: {
    type: String,
    required: true,
    trim: true
  },
  originalname: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

var Image = module.exports = mongoose.model('Image', ImageSchema);
