var mongoose = require('mongoose');
var autoIncrement = require('mongoose-auto-increment');
var fs = require('fs');
var Appearance = require('./appearance');
var img_prefix = 'img_';
var avatar_prefix = 'avatar_';

var ImageSchema = mongoose.Schema({
  path: {
    type: String,
    trim: true
  },
  people_id: [String],
  owner_id: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
},
{
  toObject: {virtuals:true},
	toJSON: {virtuals:true}
});

ImageSchema.virtual('owner', {
	ref: 'User',
	localField: 'owner_id',
	foreignField: 'userID',
	justOne: true
});

var AvatarSchema = mongoose.Schema({
  image_id: String,
},{
  toObject: {virtuals:true},
	toJSON: {virtuals:true}
});

AvatarSchema.virtual('image', {
	ref: 'Image',
	localField: 'image_id',
	foreignField: 'imageID',
	justOne: true
});

autoIncrement.initialize(mongoose.connection);
ImageSchema.plugin(autoIncrement.plugin, { model: 'Image', prefix: img_prefix, field: 'imageID' });
AvatarSchema.plugin(autoIncrement.plugin, { model: 'Avatar', prefix: avatar_prefix, field: 'avatarID' });

var Image = module.exports.Image = mongoose.model('Image', ImageSchema);
var Avatar = module.exports.Avatar = mongoose.model('Avatar', AvatarSchema);

module.exports.saveFirstAvatar = function(userID, img, newAppearnce, callback){
  Image.nextCount(function(err, count){
    var imgID = count;
    var path = "./uploads/avatar/"+ imgID +'.jpg';
    fs.writeFile(path, img, 'base64', function(err){
      if(err) throw err;
    });
    var newImage = new Image({path: path, people_id: [userID]});
    newImage.save( function(err){
      if(err) throw err;
    });
    Avatar.create({image_id: imgID}, function(err){
      if(err) throw err;
    });
    newAppearnce.media_id = imgID;
    newAppearnce.save(function(err){
      if(err) throw err;
    })
    if(callback) callback(imgID);
  });
};

module.exports.saveAvatar = function(img, userID, newAppearnce, callback){
  Image.nextCount(function(err, count){
    var imgID = count;
    var path = "./uploads/avatar/"+ imgID +'.jpg';
    fs.writeFile(path, img, 'base64', function(err){
      if(err) throw err;
    });
    Image.create({path: path, people_id: [userID]}, function(err){
      if(err) throw err;
    });
    Avatar.create({image_id: imgID}, function(err){
      if(err) throw err;
    });
    newAppearnce.media_id = imgID;
    newAppearnce.save(function(err){
      if(err) throw err;
    })
    if(callback) callback(imgID);
  });
};
