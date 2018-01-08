var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.ObjectId;

var VideoSchema = mongoose.Schema({
  title: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

var VideoPlaylistSchema = mongoose.Schema({
  title: String,
  video_list: [{
    video_id: {type: ObjectId, ref: 'Video'},
    order: Number
  }]
  createdAt: {
    type: Date,
    default: Date.now()
  }
});

var Video = module.exports.Video = mongoose.model('Video', VideoSchema);
var VideoPlaylist = module.exports.VideoPlaylist = mongoose.model('Video', VideoPlaylistSchema);
