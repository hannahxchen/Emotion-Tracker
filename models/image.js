var mongoose = require('mongoose');
var autoIncrement = require('mongoose-auto-increment');
var fs = require('fs');
var Jimp = require('jimp');
var async = require('async');
var kairos = require('../API/kairos');
var Appearance = require('./appearance');
var user_ = require('./user');
var img_prefix = 'img_';
var avatar_prefix = 'avatar_';

var ImageSchema = mongoose.Schema({
  path: {
    type: String,
    trim: true
  },
  people: [{
    _id:false,
    index: Number,
    user_id: String,
    position: Object,
    faceScale: Object,
    emotion_id: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});


var TmpSchema = mongoose.Schema({
  image_id: String,
  avatar_path: [{
    _id:false,
    img_id: String,
    index: Number,
    path: String,
  }]
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
var Tmp = module.exports.Tmp = mongoose.model('Tmp', TmpSchema);
var Avatar = module.exports.Avatar = mongoose.model('Avatar', AvatarSchema);

module.exports.saveAvatar = function(img, userID, newAppearnce, callback){
  Image.nextCount(function(err, count){
    var imgID = count;
    var path = "./uploads/avatar/"+ imgID +'.jpg';
    fs.writeFile(path, img, 'base64', function(err){
      if(err) throw err;
    });
    Image.create({path: path.replace("./uploads", ""), people: [{user_id: userID}]}, function(err){
      if(err) throw err;
    });
    Avatar.create({image_id: imgID}, function(err){
      if(err) throw err;
    });
    if(newAppearnce){
      newAppearnce.media_id = imgID;
      newAppearnce.save(function(err){
        if(err) throw err;
      });
    }
    if(callback) callback(imgID);
  });
};

module.exports.saveImage = function(people, path, callback){
  var newImage = new Image({path: path, people: people});
  newImage.save(function(err, doc){
    if(err) throw err;
    else{
      if(callback) callback(doc.imageID);
    }
  });
};

module.exports.saveTmp = function(imgID, path){
  Tmp.create({image_id: imgID, avatar_path: path}, function(err){
    if(err) throw err;
  });
};

module.exports.enrollTmp = function(){
  Tmp.find({}, function(err, data){
    if(err) throw err;
    var counter = 0;
    async.whilst(
      function(){return counter < data.length;},
      function loopDoc(callback){
        var doc = data[counter];
        var counter2 = 0;
        async.whilst(
          function(){return counter2 < doc.avatar_path.length;},
          function loopFaces(callback){
            var face = doc.avatar_path[counter2];

            Jimp.read(face.path, function (err, image) {
              image.getBase64(Jimp.AUTO, function(err, img64){
                user_.saveImgUnknown(img64.replace('data:image/jpeg;base64,', ''), face.img_id, function(error, userID){
                  if(!error){
                    Image.update({imageID: doc.image_id, people:{$elemMatch:{index: face.index}}}, {'people.$.user_id': userID}, function(err){
                      if(err) throw err;
                    });
                    Image.update({imageID: face.img_id}, {'people.0.user_id': userID}, function(err){
                      if(err) throw err;
                    });
                    callback();
                  }
                });
              });
            });
            counter2++;
          },function(err){
            if(err) console.log(err);
            else callback();
        });
        counter++;
      },function(err){
        if(err) console.log(err);
        else{
          async.each(data, function(dataItem, callback){
            dataItem.remove(function(err){
              if(err) throw err;
              callback();
            });
          });
        }
      });
  });
};
