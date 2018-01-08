var mongoose = require('mongoose');
var autoIncrement = require('mongoose-auto-increment');
var bcrypt = require('bcryptjs');
var fs = require('fs');
var kairos = require('../API/kairos');
var Image = require('./image').Image;
var img_ = require('./image');
var Appearance = require('./appearance');
var prefix = "user";
var ObjectId = mongoose.Schema.ObjectId;

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
	resetPwdToken: String,
	resetPwdExpires: Date,
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
	ref: 'Image',
	localField: 'profile_picture_id',
	foreignField: 'imageID',
	justOne: true
});

var RelativeSchema = mongoose.Schema({
	relative_id: String,
	relation_type: {type: ObjectId, ref: 'RelationType'}
});

var RelationSchema = mongoose.Schema({
	elder_id: String,
	relatives: [RelativeSchema]
},
{
	toObject: {virtuals:true},
	toJSON: {virtuals:true}
});

var RelationTypeSchema = mongoose.Schema({
	type: String
});

RelativeSchema.virtual('relative_profile', {
	ref: 'User',
	localField: 'relative_id',
	foreignField: 'userID',
	justOne: true
});

autoIncrement.initialize(mongoose.connection);
UserSchema.plugin(autoIncrement.plugin, { model: 'User', prefix: prefix, field: 'userID'});

var User = module.exports.User = mongoose.model('User', UserSchema);
var Relation = module.exports.Relation = mongoose.model('Relation', RelationSchema);
var RelationType = module.exports.RelationType = mongoose.model('RelationType', RelationTypeSchema);

/*RelationType.create([{type: '母子'}, {type: '父子'}, {type: '母女'}, {type: '父女'}, {type: '公媳'}, {type: '公婿'}, {type: '婆媳'}, {type: '婆婿'}, {type: '朋友'}], function(err){
	if(err) console.log(err);
});*/

/*RelationType.findOne({type: '朋友'}, function(err, doc){
	Relation.create({elder_id: 'user4', relatives: [{relative_id: 'user0', relation_type: doc._id}]}, function(err, doc){
		console.log(doc);
	});
});*/

module.exports.createUser = function(newUser, img, callback){
	bcrypt.genSalt(10, function(err, salt) {
			bcrypt.hash(newUser.password, salt, function(err, hash) {
					newUser.password = hash;
					newUser.save(function(err, doc){
						var userID = doc.userID;
						kairos.enroll(img, userID, function(error, status, appearance){
							var newAppearnce = new Appearance({user_id: userID});
				      if (status == 'success'){
								newAppearnce.age = appearance.age;
								if(appearance.glasses == 'None') newAppearnce.glasses = false;
								else newAppearnce.glasses = true;
								img_.saveAvatar(img, userID, newAppearnce, function(imgID){
									User.update({userID: userID}, {profile_picture_id: imgID, latest_picture_id: imgID}, function(err){
										if(err) console.log(err);
									});
								});
								var error = false;
							}
				      else var error = true;
							callback(error);
				    });
					});
			});
	});
};

module.exports.createExistedUser = function(id, newUser, img, callback){
	bcrypt.genSalt(10, function(err, salt) {
			bcrypt.hash(newUser.password, salt, function(err, hash) {
					newUser.password = hash;
					User.findOneAndUpdate({userID: id}, newUser, {new: true}).lean().exec(function(err, doc){
						console.log("updated:",doc);
						kairos.detect(img, function(error, status, age, glasses){
							var newAppearnce = new Appearance({user_id: id});
				      if (status == 'success'){
								newAppearnce.age = age;
								newAppearnce.glasses = glasses;
								img_.saveAvatar(img, id, newAppearnce, function(imgID){
									User.update({userID: id}, {profile_picture_id: imgID, latest_picture_id: imgID}, function(err){
										if(err) console.log(err);
									})
								});
								var error = false;
							}
				      else var error = true;
							callback(error);
				    });
					});
			});
	});
};

module.exports.saveUnknown = function saveUnknown(img, callback){
  User.nextCount(function(err, count){
		var userID = count;
		var newUser = new User({userID: userID, role: 'unknown'});
		var newAppearnce = new Appearance({user_id: userID});
		module.exports.nextUser = count;
		kairos.enroll(img, userID, function(error, status, appearance){
			if(error){
				img_.saveAvatar(img);
				if(callback) callback(error);
			}
      if(status == 'success'){
				newUser.gender = appearance.gender.type;
				newAppearnce.age = appearance.age;
				if(appearance.glasses == 'None')
					newAppearnce.glasses = false;
				else
					newAppearnce.glasses = true;
				img_.saveAvatar(img, userID, newAppearnce, function(imgID){
					newUser.profile_picture_id = imgID;
					newUser.latest_picture_id = imgID;
			    newUser.save(function(err, doc){
			      if(err) console.log(err);
						else console.log(doc);
			    });
				});
				var error = false;
				if(callback) callback(error, userID, appearance.age, appearance.gender.type);
			}
    });
  });
};

module.exports.saveImgUnknown = function(img, imgID, callback){
	var newUser = new User({role: 'unknown', profile_picture_id: imgID, latest_picture_id: imgID});
	newUser.save(function(err, user){
		if(err) console.log(err);
		else{
			var userID = user.userID;
			var newAppearnce = new Appearance({user_id: userID, media_id: imgID});
			kairos.enroll(img, userID, function(err, status, appearance){
				if(err)	callback(err);
				else if(status == 'success'){
					user.gender = appearance.gender.type;
					newAppearnce.age = appearance.age;
					if(appearance.glasses == 'None')
						newAppearnce.glasses = false;
					else
						newAppearnce.glasses = true;
					user.save(function(err, doc){
						if(err) console.log(err);
						else console.log(doc);
					});
					newAppearnce.save(function(err){
						if(err) console.log(err);
					});
					if(callback) callback(err, userID);
				}
			});
		}
	});
};

module.exports.validPassword = function(candidatePassword, hash, callback){
	bcrypt.compare(candidatePassword, hash, function(err, isMatch) {
    	if(err) console.log(err);
    	else callback(null, isMatch);
	});
};

module.exports.updateUser = function(query, update){
	var options = { new: true };
	User.findOneAndUpdate(query, update, options, function(err, doc){
		if(err) console.log(err);
		else console.log(doc);
	});
};
