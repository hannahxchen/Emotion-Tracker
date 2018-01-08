var mongoose = require('mongoose');
var autoIncrement = require('mongoose-auto-increment');
var fs = require('fs');
var Jimp = require('jimp');
var async = require('async');
var ExifImage = require('exif').ExifImage;
var kairos = require('../API/kairos');
var azure = require('../API/azure');
var Appearance = require('./appearance');
var Emotion = require('./emotions').Emotion;
var EmotionTmp = require('./emotions').EmotionTmp;
var user_ = require('./user');
var img_prefix = 'img_';
var avatar_prefix = 'avatar_';
var Jimp = require('jimp');
var ExifImage = require('exif').ExifImage;
var ObjectId = mongoose.Schema.ObjectId;

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
    emotions: {type: ObjectId, ref: 'Emotion', default: undefined}
  }],
  gps: Object,
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

var AlbumSchema = mongoose.Schema({
  title: String,
  activity: {type: ObjectId, ref: 'Activity'},
  image_id: [{}],
  lastModified: {
    type: Date,
    default: Date.now()
  },
  createdAt: {
    type: Date,
    default: Date.now()
  }
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

AlbumSchema.virtual('image_list', {
  ref: 'Image',
  localField: 'image_id',
  foreignField: 'imageID'
});

autoIncrement.initialize(mongoose.connection);
ImageSchema.plugin(autoIncrement.plugin, { model: 'Image', prefix: img_prefix, field: 'imageID' });
AvatarSchema.plugin(autoIncrement.plugin, { model: 'Avatar', prefix: avatar_prefix, field: 'avatarID' });

var Image = module.exports.Image = mongoose.model('Image', ImageSchema);
var Tmp = module.exports.Tmp = mongoose.model('Tmp', TmpSchema);
var Avatar = module.exports.Avatar = mongoose.model('Avatar', AvatarSchema);
var Album = module.exports.Album = mongoose.model('Album', AlbumSchema);

var saveAvatar = module.exports.saveAvatar = function (img, userID, newAppearnce, callback){
  var newImage = new Image({});
  newImage.save(function(err, doc){
    var imgID = doc.imageID;
    var path = "./uploads/avatar/"+ imgID +'.jpg';
    Jimp.read(Buffer.from(img, 'base64'), function(err, image){
      image.exifRotate().write( path, function(err){
        if(err) console.log(err);
        if(callback) callback(imgID);
      });
    });
    Image.update({imageID: imgID}, {path: path.replace("./uploads", "")}, function(err){
      if(err) console.log(err);
    });
    Avatar.create({image_id: imgID}, function(err){
      if(err) console.log(err);
    });
    if(newAppearnce){
      newAppearnce.media_id = imgID;
      newAppearnce.save(function(err){
        if(err) console.log(err);
      });
    }
  });
};

module.exports.enrollTmp = function(tmp_id){
  console.log('enroll:'+tmp_id);
  Tmp.find({'_id': {'$in': tmp_id}}, function(err, data){
    if(err) console.log(err);
    var counter = 0;
    async.whilst(
      function(){return counter < data.length;},
      function loopDoc(callback){
        var doc = data[counter];
        counter++;
        var counter2 = 0;

        async.whilst(
          function(){return counter2 < doc.avatar_path.length;},
          function loopFaces(callback){
            var face = doc.avatar_path[counter2];
            counter2++;

            Jimp.read(face.path, function (err, image) {

              image.getBase64(Jimp.AUTO, function(err, img64){
                kairos.recognize(img64.replace('data:image/jpeg;base64,', ''), function(err, status, id){
                  if(err) callback();
                  else if(status == 'success'){
                    Image.update({imageID: doc.image_id, people:{$elemMatch:{index: face.index}}}, {'people.$.user_id': id}, function(err){
                      if(err){
                        console.log(err);
                        callback();
                      }
                      else{
                        Image.update({imageID: face.img_id}, {'people.0.user_id': id}, function(err){
                          if(err){
                            console.log(err);
                            callback();
                          }
                          else setTimeout(function(){callback()}, 5000);
                        });
                      }
                    });
                  }
                  else{
                    user_.saveImgUnknown(img64.replace('data:image/jpeg;base64,', ''), face.img_id, function(error, userID){
                      if(!error){
                        Image.update({imageID: doc.image_id, people:{$elemMatch:{index: face.index}}}, {'people.$.user_id': userID}, function(err){
                          if(err){
                            console.log(err);
                            callback();
                          }
                          else{
                            Image.update({imageID: face.img_id}, {'people.0.user_id': userID}, function(err){
                              if(err){
                                console.log(err);
                                callback();
                              }
                              else setTimeout(function(){callback()}, 1000);
                            });
                          }
                        });
                      }
                      else callback();
                    });
                  }
                });
              });
            });
          },function(err){
            if(err){
              console.log(err);
              async.setImmediate(function(){callback()});
            }
            else{
              async.setImmediate(function(){callback()});
            }
        });
      },function(err){
        if(err) console.log(err);
      });
  });
};

module.exports.recognizeFaces = function (img_id, callback){
  var tmp_id = [];
  var offset = 25;

  Image.findOne({imageID: img_id}, function(err, img){
    var currentpath = './uploads'+img.path;
    Jimp.read(currentpath, function (err, image) {
      if(err) console.log(err);
      getGPS(currentpath).then(function(result){
        Image.findOneAndUpdate({imageID: img_id}, {gps: result}, {upsert: true}).exec();
      });
      image.exifRotate().getBase64(Jimp.AUTO, function(err, img64){

        kairos.recognizeMultiple(img64.replace('data:image/jpeg;base64,', ''), function(error, results){
          if(error){
            console.log('No faces found!');
            require("fs").writeFile('./uploads'+img.path, img64.replace('data:image/jpeg;base64,',''), 'base64', function(err) {
              if (err) console.log(err);
            });
            callback(err);
          }
          else{
            var people = [];
            var tmp_path = [];
            async.waterfall([
              function processFaces(callback){
                var counter = 0;
                async.whilst(
                  function(){return counter < results.length;},
                  function loopFaces(callback){
                    var face = results[counter].transaction;
                    counter++;
                    if(face.status == 'success'){
                      people.push({
                        index: counter-1,
                        user_id: face.subject_id,
                        position: {x: face.topLeftX, y: face.topLeftY},
                        faceScale: {width: face.width, height: face.height}
                      });
                      async.setImmediate(function(){callback()});
                    }
                    else{
                      Jimp.read(currentpath, function (err, image) {
                        image.exifRotate().crop(face.topLeftX-offset, face.topLeftY-offset, face.width+(2*offset), face.height+(2*offset)).getBase64(Jimp.AUTO, function(err, img64){
                          saveAvatar(img64.replace('data:image/jpeg;base64,', ''), 'unknown', undefined, function(imgID){
                            tmp_path.push({
                              index: counter-1,
                              img_id: imgID,
                              path: "./uploads/avatar/"+ imgID +'.jpg'
                            });

                            people.push({
                              index: counter-1,
                              user_id: 'unknown',
                              position: {x: face.topLeftX, y: face.topLeftY},
                              faceScale: {width: face.width, height: face.height}
                            });
                            async.setImmediate(function(){callback()});
                          });
                        });
                      });
                    }
                  },function(err){
                    if(err){
                      console.log(err);
                      callback();
                    }
                    else callback(null, people);
                  });
              },
              function updateImage(people, callback){
                Image.findOneAndUpdate({_id: img._id}, {people: people}, {upsert: true}, function(err){
                  if(err) console.log(err);
                });

                Tmp.create({image_id: img.imageID, avatar_path: tmp_path}, function(err, doc){
                  if(err) console.log(err);
                });

                callback(null);
              }
            ],  function(err){
              if(err){
                console.log(err);
              }
              else{
                require("fs").writeFile('./uploads'+img.path, img64.replace('data:image/jpeg;base64,',''), 'base64', function(err) {
                  if (err) console.log(err);
                  console.log('saved');
                });
              }
              callback(err);
            });
          }
        });
      });
    });

  });
}

module.exports.detectEmotions = function (img_id, callback){
  Image.findOne({imageID: img_id}, function(err, img){
    if(err) console.log(err);
    else{
      azure.recognize('./uploads'+img.path, function(err, faces){
        if(err) faces = undefined;
        EmotionTmp.create({image_id: img.imageID, faces: faces}, function(err, tmp){
          if(err) console.log(err);
          callback(err);
        });
      });
    }
  });
}

//match faces with emotions from EmotionTmp
module.exports.updateEmotions = function(img_id){
  var offset = 25;
  console.log('update emotions: '+img_id);
  EmotionTmp.findOne({image_id: img_id}, function(err, tmp){
    if(err) console.log(err);
    else{
      if(tmp){
        Image.findOne({imageID: img_id}, function(err, img){
          if(err) console.log(err);
          else {
            if(img.people.length > 0){
              async.each(tmp.faces, function(face, callback){
                var center_x = face.position.left + (face.position.width*0.5);
                var center_y = face.position.top + (face.position.height*0.5);

                Jimp.read('./uploads'+img.path, function(err, image){
                  image.crop(face.position.left-offset, face.position.top-offset, face.position.width+(2*offset), face.position.height+(2*offset), function(err, crop){
                    //crop.write('./uploads/tmp/'+Date.now()+'.jpg');
                  });
                });

                for(var i = 0; i < img.people.length ; i++){
                  var person = img.people[i];

                  if(!person.position) break;

                  var x_bar = person.position.x + (person.faceScale.width*0.5);
                  var y_bar = person.position.y + (person.faceScale.height*0.5);

                  console.log(person.position.x +'<='+ center_x + '<=' + (person.position.x + person.faceScale.width));
                  console.log(person.position.y + '<=' + center_y + '<=' +(person.position.y + person.faceScale.height));
                  console.log(face.position.left + '<=' + x_bar + '<=' + (face.position.left + face.position.width));
                  console.log(face.position.top + '<=' + y_bar + '<=' + (face.position.top + face.position.height));

                  if(person.position.x <= center_x && center_x <= (person.position.x + person.faceScale.width) &&
                    person.position.y <= center_y && center_y <= (person.position.y + person.faceScale.height) &&
                    face.position.left <= x_bar && x_bar <= (face.position.left + face.position.width) &&
                    face.position.top <= y_bar && y_bar <= (face.position.top + face.position.height)){
                      console.log('true');
                      Emotion.create({user_id: person.user_id, emotions: face.emotions}, function(err, emotionData){
                        if(err) console.log(err);
                        else {
                          let match = img.people[i];
                          match.emotions = emotionData._id;
                          img.save(function(err){
                            if(err) console.log(err);
                          });
                        }
                      });
                      break;
                    }
                }
                callback();
              }, function(err){
                if(err) console.log('Update emotions for uploaded images error: ', err);
              });
            }
            else{
              var people = [];
              async.each(tmp.faces, function(face, callback){
                Emotion.create({user_id: 'unknown', emotions: face.emotions}, function(err, emotionData){
                  if(err) console.log(err);
                  else {
                    people.push({
                      user_id: 'unknown',
                      index: 0,
                      position: {x: face.position.left, y: face.position.top},
                      faceScale: {width: face.position.width, height: face.position.height},
                      emotions: emotionData._id
                    });
                    callback();
                  }
                });
              }, function(err){
                if(err) console.log(err);
                else Image.update({imageID: img_id}, {$set: {people: people}}, {upsert: true}).exec();
              });
            }
          }
        });
      }
    }
    EmotionTmp.findOneAndRemove({image_id: img_id}, function(err){
      if(err) console.log(err);
    });
  });
}

module.exports.deleteImage = function(album_id, img_ids, callback){
  async.parallel({
    updateAlbum: function(callback){
      Album.findOneAndUpdate({_id: album_id}, {$pull: {image_id: { "$in": img_ids }}, lastModified: Date.now()}, function(err){
        if(err) callback(true);
        else callback(null);
      });
    },
    removePhotos: function(callback){
      Image.find({imageID: {'$in': img_ids}}).lean().exec(function(err, images){
        async.each(images, function(img, callback){
          Image.remove({imageID: img.imageID}).exec();
          if(img.people.length > 0){
            async.each(img.people, function(person, callback){
              if(person.emotions)
                Emotion.remove({_id: person.emotions}).exec();
            }, function(err){});
          }
          fs.unlink('./uploads'+img.path, function(err){
            if(err) callback(true);
            else callback();
          });
        }, function(err){
          if(err) {
            callback(true);
            console.log('removing images from server failed.');
          }
          else {
            callback(null);
          }
        });
      });
    },
    removeTmps: function(callback){
      Tmp.find({image_id: {'$in': img_ids}}).lean().exec(function(err, tmps){
        if(tmps.length > 0){
          async.each(tmps, function(tmp, callback){
            Tmp.remove({image_id: tmp.image_id}).exec();
            async.each(tmp.avatar_path, function(avatar, callback){
              Image.remove({imageID: avatar.img_id}).exec();
              Avatar.remove({image_id: avatar.img_id}).exec();
              fs.unlink(avatar.path, function(err){
                if(err) callback(true);
                else callback();
              });
            }, function(err){
              if(err) callback(true);
              else callback();
            });
          }, function(err){
            if(err) {
              callback(true);
              console.log('Deleting avatars failed.');
            }
            else callback(null);
          });
        }
        else callback(null);

      });
    },
    removeEmotionTmp: function(callback){
      EmotionTmp.remove({image_id: {'$in': img_ids}}, function(err){
        if(err) callback(true);
        else callback(null);
      });
    }
  }, function(err){
    if(err) console.log('Delete the images failed: '+img_ids);
    else console.log('Delete the images successfully: '+img_ids);
    callback(err);
  });
}

function getGPS(path){
  return new Promise(function (resolve, reject) {
    new ExifImage({image: path}, function(error, data){
      if(error) return;
      if(data.gps.GPSLatitude && data.gps.GPSLongitude){
        //console.log(data.gps);
        var lat = data.gps.GPSLatitude;
        var long = data.gps.GPSLongitude;
        var latRef = data.gps.GPSLatitudeRef || "N";
        var longRef = data.gps.GPSLongitudeRef || "W";
        latDD = ConvertDMSToDD(lat[0], lat[1], lat[2], latRef);
        longDD = ConvertDMSToDD(long[0], long[1], long[2], longRef);

        function ConvertDMSToDD(degrees, minutes, seconds, direction){
          var dd = degrees + minutes/60 + seconds/(60*60);
          if(direction == "S" || direction == "W") dd = dd*(-1);
          return dd;
        }

        var gps = {lat: latDD, long: longDD};
        console.log(gps);
        resolve(gps);
      }
    });
  });

}
