var mongoose = require('mongoose');
var autoIncrement = require('mongoose-auto-increment');
var bcrypt = require('bcryptjs');
var fs = require('fs');
var kairos = require('../API/kairos');
var Image = require('./image').Image;
var img_function = require('./image');
var Appearance = require('./appearance');
var prefix = "user";

// User Schema
var UserSchema = mongoose.Schema({
	username: String,
	password: String,
	email: String,
	name: String,
	gender: String,
	birth: Date,
	role: String,
	profile_picture_id: String,
	latest_picture_id: String,
	createdAt: {
    type: Date,
    default: Date.now
  },
},
{
	toObject: {virtuals:true},
	toJSON: {virtuals:true}
});

UserSchema.virtual('profile_picture', {
	ref: 'Avatar',
	localField: 'profile_picture_id',
	foreignField: 'avatarID',
	justOne: true
});

UserSchema.virtual('latest_picture', {
	ref: 'Avatar',
	localField: 'latest_picture_id',
	foreignField: 'avatarID',
	justOne: true
});

/*UserSchema.virtual('activities', {
	ref: 'Enroll',
	localField
})*/


autoIncrement.initialize(mongoose.connection);
UserSchema.plugin(autoIncrement.plugin, { model: 'User', prefix: prefix, field: 'userID'});

var User = module.exports = mongoose.model('User', UserSchema);

module.exports.createUser = function(newUser, img, callback){
	var res = {};
  User.nextCount(function(err, count){
		var userID = count;
		kairos.enroll(img, userID, function(status, appearance){
			var newAppearnce = new Appearance({user_id: userID});
      if (status == 'success'){
				newAppearnce.age = appearance.age;
				if(appearance.glasses == 'None')
					newAppearnce.glasses = false;
				else
					newAppearnce.glasses = true;
				img_function.saveFirstAvatar(userID, img, newAppearnce, function(imgID){
					newUser.profile_picture_id = imgID;
					newUser.latest_picture_id = imgID;
					bcrypt.genSalt(10, function(err, salt) {
					    bcrypt.hash(newUser.password, salt, function(err, hash) {
					        newUser.password = hash;
					        newUser.save(callback);
					    });
					});
				});
				res.error = false;
			}
      else
        res.error = true;
    });
  });
	return res;
};

module.exports.saveUnknown = function saveUnknown(img, callback){
  User.nextCount(function(err, count){
		var userID = count;
		var newUser = new User({userID: userID, role: 'unknown'});
		var newAppearnce = new Appearance({user_id: userID});
		kairos.enroll(img, userID, function(status, appearance){
      if (status == 'success'){
				newUser.gender = appearance.gender.type;
				newAppearnce.age = appearance.age;
				if(appearance.glasses == 'None')
					newAppearnce.glasses = false;
				else
					newAppearnce.glasses = true;
				img_function.saveAvatar(img, userID, newAppearnce, function(imgID){
					newUser.profile_picture_id = imgID;
					newUser.latest_picture_id = imgID;
			    newUser.save(function(err){
			      if(err) throw err;
			    });
				});
				var error = false;
				if(callback) callback(error, userID, appearance.age);
			}
      else{
				var error = true;
				if(callback) callback(res.error);
			}
    });
  });
};

module.exports.validPassword = function(candidatePassword, hash, callback){
	bcrypt.compare(candidatePassword, hash, function(err, isMatch) {
    	if(err) throw err;
    	callback(null, isMatch);
	});
};

module.exports.updateUser = function(query, update){
	var options = { new: true };
	User.findOneAndUpdate(query, update, options, function(err, doc){
		if(err) throw err;
	});
};
