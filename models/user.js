var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var autoIncrement = require('mongoose-auto-increment');
var bcrypt = require('bcryptjs');
var prefix = "v";

// User Schema
var UserSchema = mongoose.Schema({
	username: {
		type: String,
		index:true
	},
	password: {type: String},
	email: {type: String},
	name: {type: String},
	gender:{type: String},
	age:{type: Number},
	role: {
		type: String,
		default: 'user'
	},
	img_base64: {type: String},
	createdAt: {
    type: Date,
    default: Date.now
  },
	face: [{ type: Schema.Types.ObjectId, ref: 'Face' }]
});

autoIncrement.initialize(mongoose.connection);

UserSchema.plugin(autoIncrement.plugin, 'User');

var User = module.exports = mongoose.model('User', UserSchema);

module.exports.createUser = function(newUser, callback){
	bcrypt.genSalt(10, function(err, salt) {
	    bcrypt.hash(newUser.password, salt, function(err, hash) {
	        newUser.password = hash;
	        newUser.save(callback);
	    });
	});
};

module.exports.saveVisitor = function saveVisitor(newVisitor, callback){
  User.nextCount(function(err, count){
		console.log('count:', count);
		var visitorUsername = prefix + count.toString();
		module.exports.count = count.toString();
    module.exports.visitorUsername = visitorUsername;
		callback();
    newVisitor.save(function(err){
      if(err) throw err;
    });
  });
};

module.exports.getUserByUsername = function(username, callback){
	var query = {username: username};
	User.findOne(query, callback);
};

module.exports.getUserById = function(id, callback){
	User.findById(id, callback);
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
