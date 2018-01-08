var kairos = require('./API/kairos');
var mongoose = require('mongoose');
var User = require('./models/user').User;
var Relation = require('./models/user').Relation;
var Appearance = require('./models/appearance');
var Activity = require('./models/activity').Activity;
var ActivityType = require('./models/activity').ActivityType;
var Emotion = require('./models/emotions').Emotion;
var kairos = require('./API/kairos');
var Enroll = require('./models/activity').Enroll;
var CheckInTmp = require('./models/activity').CheckInTmp;
var Album = require('./models/image').Album;
var Image = require('./models/image').Image;
var Avatar = require('./models/image').Avatar;
var Task = require('./models/task').Task;
var hue = require("node-hue-api");
var HueApi = hue.HueApi;
var async = require('async');
var Jimp = require('jimp');
var fs = require("fs");

module.exports=function(io){
	io.sockets.on('connection', function (socket) {
		connections.push(socket);
		console.log('Connected: %s sockets connected', connections.length);

		//Disconnect
		socket.on('disconnect', function(data){
			connections.splice(connections.indexOf(socket),1);
			console.log('Disconnected: %s sockets connected', connections.length);
		});

		socket.on('login-img', function(img){
			kairos.recognize(img, function(error, status, userID){
				if(error) {
					socket.emit('login', {success: false, message: status});
				}
				else if(status == "success"){
					User.findOne({userID: userID}, function(err, doc){
						if(err) console.log(err);
						else if(doc.role != 'unknown'){
							console.log('Login with username: ' + doc.username);
							socket.emit('login', {success: true, id: doc.username});
						}
						else{
							console.log("Unknown user");
							socket.emit('login', {success: false, message: 'Unknown user'});
						}
					});
				}
				else if(status == "failure"){
					console.log("Unknown user");
					socket.emit('login', {success: false, message: 'Unknown user'});
				}
			});

		});

		socket.on('hueIP', function(hueIP){
			var host = hueIP;
			var username;

			var displayUserResult = function(result) {
				console.log("User created: " + result);
				if(result){
					socket.emit('userCreated', result);
				}
			};

			var hue = new HueApi();

			var displayError = function(err) {
				console.log(err);
			};

			hue.registerUser(host)
			.then(displayUserResult)
			.fail(displayError)
			.done();
		});

		socket.on('selectUser', function(data){
			async.parallel({
				getProfile: function(callback){
					User.findOne({userID: data.user_id}).populate('group').populate('profile_picture').exec(function(err, user){
						if(err) console.log(err);
						else callback(null, user);
					});
				},
				getRelations: function(callback){
					if(data.getRelations){
						Relation.findOne({elder_id: data.user_id})
						.populate('relatives.relative_profile')
						.populate('relatives.relation_type')
						.exec(function(err, doc){
							if(err) console.log(err);
							else if(!doc) callback(null, null);
							else{
								console.log(doc);
								callback(null, doc.relatives);
							}
						});
					}
					else callback(null, '');
				},
				getDetectedAge: function(callback){
					if(!data.getRelations){
						Appearance.find({user_id: data.user_id}).sort('-createdAt').limit(1).lean().exec(function(err, doc){
							if(err) console.log(err);
							else callback(null, doc[0].age);
						});
					}
					else callback(null, null);
				},
				getTasks: function(callback){
					Task.find({object_id: data.user_id}).populate('task_type').lean().exec(function(err, tasks){
						if(err) console.log(err);
						else callback(null, tasks);
					});
				},
				getEmotions: function(callback){
					Emotion.find({user_id: data.user_id}).lean().exec(function(err, emotions){
						if(err) console.log(err);
						else callback(null, emotions);
					});
				}
			}, function(err, results){
					if(err) console.log(err);
					else socket.emit('userData', {
						profile: results.getProfile,
						relations: results.getRelations,
						age: results.getDetectedAge,
						tasks: results.getTasks,
						emotions: results.getEmotions
					});
			});
		});

		socket.on('edit_profile', function(data){
			User.findOneAndUpdate({userID: data.userID}, data.update, {multi:true}, function(err){
				if(err) console.log(err);
			});
		});

		socket.on('delete_user', function(selected){
			User.remove({userID: {$in: selected}}).exec();
			Appearance.remove({userID: {$in: selected}}).exec();
			Avatar.remove({userID: {$in: selected}}).exec();
		});

		socket.on('select_activity', function(id){
			Enroll.findOne({activity})
			Activity.findOne({_id: id}, function(err, doc){
				if(err) console.log(err);
				else socket.emit('activity_data', doc);
			});
		});

		socket.on('delete_activity', function(ids){
			ids.forEach(function(id){
				Activity.findOneAndRemove({_id: id}).exec(function(err, removed){
					if(err) console.log(err);
					Enroll.findOneAndRemove({_id: removed.enroll}, function(err){
						if(err) console.log(err);
					});
				});
			});
		});

		socket.on('get_unenrolledList', function(activity_id){
			async.waterfall([
				function(callback){
					var enroll_list = [];
					Enroll.findOne({activity: activity_id}, function(err, enroll){
						if(err) console.log(err);
						else if(enroll.enrollList.length > 0){
							async.each(enroll.enrollList, function(element, callback){
								enroll_list.push(element.user_id);
								callback();
							}, function(err){
									if(err) console.log(err);
									else callback(null, enroll_list);
							});
						}
						else callback(null, enrollList);
					});
				},
				function(enroll_list, callback){
					var unenrolledList = [];
					User.find().lean().exec(function(err, users){
						if(err) console.log(err);
						else if(enroll_list.length == 0){
							callback(null, users);
						}
						else{
							async.each(users, function(user, callback){
								var enroll = false;
								async.each(enroll_list, function(element, callback){
									if(user.userID == element) enroll = true;
									callback();
								},function(err){
										if(err) console.log(err);
										else{
											if(!enroll){
												unenrolledList.push({
													userID: user.userID,
													username: user.username,
													name: user.name,
													gender: user.gender
												});
											}
											callback();
										}
								});
							}, function(err){
									if(err) console.log(err);
									else callback(null, unenrolledList);
							});
						}
					});
				}
			],function(err, results){
					if(err) console.log(err);
					else socket.emit('unenrolledList', results);
			});
		});

		socket.on('enroll_newUser', function(data){
			async.waterfall([
				function(callback){
					var userData = [];
					User.find({userID: {$in: data.list}}).exec(function(err, users){
						if(err) console.log(err);
						else{
							async.each(users, function(user, callback){
								userData.push({
									user_id: user.userID,
									data:{
										username: user.username,
										name: user.name,
										birth: user.birth,
							      gender: user.gender,
										email: user.email,
									}
								});
								callback();
							}, function(err){
									if(err) console.log(err);
									else callback(null, userData);
							});
						}
					});
				},
				function(userData, callback){
					Enroll.findOne({activity: data.activity_id}, function(err, doc){
						userData.forEach(function(element){
							doc.enrollList.push(element);
						});
						doc.save(function(err){
							if(err) console.log(err);
						});
						callback(null);
				  });
				}
			], function(err){
					if(err) console.log(err);
			});
		});

		module.exports.updateEnrolled = function(activity_id){
		  Enroll.findOne({activity: activity_id}).exec(function(err, doc){
		    if(err) console.log(err);
		    else{
					var checked = [];
					var unchecked = [];
					async.each(doc.enrollList, function(person, callback){
						if(person.checkIn == true){
							checked.push({
								username: person.data.username,
								name: person.data.name,
								checkInTime: person.checkInTime
							});
							callback();
						}
						else{
							unchecked.push({
								username: person.data.username,
								name: person.data.name
							});
							callback();
						}
					}, function(err){
						socket.emit('update-checked-list', {checked: checked, unchecked: unchecked});
					});

		    }
		  });
		}

		socket.on('update-activity', function(data){
			if(data.activity_type) {
				if(!data.updates) var updates = {};
				ActivityType.findOne({type: data.activity_type}, function(err, doc){
					if(err) console.log(err);
					else{
						data.updates.activity_type = doc._id;
						Activity.findOneAndUpdate({_id: data.id}, data.updates).exec(function(err){
							if(err) console.log(err);
						});
					}
				});
			}
			else{
				Activity.findOneAndUpdate({_id: data.id}, data.updates).exec(function(err){
					if(err) console.log(err);
				});
			}
			if(data.coverPhoto){
				console.log(data.coverPhoto);
				var path = "./uploads/activityCover/"+ Date.now() +'.jpg';
				Jimp.read(Buffer.from(data.coverPhoto, 'base64'), function(err, image){
					image.exifRotate().write( path, function(err){
						if(err) console.log(err);
					});
				});
				Activity.findOneAndUpdate({_id: data.id}, {coverPhoto_path: path.replace('./uploads', '')}).exec(function(err){
					if(err) console.log(err);
				});
			}
		});

		module.exports.updateAlbum = function(id){
			Album.findOne({_id: id}).populate('image_list').exec(function(err, album){
				socket.emit('update-album', album.image_list);
			});
		}

		module.exports.continueUpload = function(){
			socket.emit('upload-file', true);
		}

		socket.on('get-user-data', function(data){
			User.find().lean().exec(function(err, users){
				if(err) console.log(err);
				else socket.emit('send-user-data', users);
			});
		});

		socket.on('get-selected-user', function(id){
			console.log(id);
			User.findOne({userID: id}).lean().exec(function(err, user){
				if(err) console.log(err);
				else socket.emit('send-selected-user', user);
			});
		});

	});
};
