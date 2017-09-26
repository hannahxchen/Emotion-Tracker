var mongoose = require('mongoose');
var autoIncrement = require('mongoose-auto-increment');
var video_prefix = 'vid_';

var VideoSchema = mongoose.Schema({
  createdAt: {
    type: Date,
    default: Date.now
  }
});

autoIncrement.initialize(mongoose.connection);
VideoSchema.plugin(autoIncrement.plugin, { model: 'Video', prefix: video_prefix, field: 'videoID' });

var Video = module.exports.Video = mongoose.model('Video', VideoSchema);
