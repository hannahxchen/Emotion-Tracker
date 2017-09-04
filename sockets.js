var kairos = require('./API/kairos');
var mongoose = require('mongoose');
var Face = require('./models/face');
var SubFace = require('./models/subFace');
var User = require('./models/user');
var faceDetect = require('./routes/faceDetect');
var gallery = require('./config/kairos_api').gallery;
var hue = require("node-hue-api");
var HueApi = hue.HueApi;

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
			img = img.replace('data:image/jpeg;base64,', '');
			kairos.recognize(img, gallery, get_id);

		});

		function get_id(){
			if(kairos.error) socket.emit('login', {success: false});
			else if(kairos.status == "success"){
				console.log("Got username:", JSON.stringify(kairos.id));
				socket.emit('login', {success: true, id: kairos.id});
			}
			else if(kairos.status == "failure"){
				console.log("Unknown user");
				socket.emit('login', {success: false});
			}
		}

		socket.on('tracker-img', function(img){
			var img_uri = img.replace('data:image/jpeg;base64,', '');
			kairos.recognize(img_uri, gallery, function(){
				if(kairos.status == "failure"){
					enroll_visitor(img);
				}
				else if(kairos.status == "success"){
					socket.emit('identity-confirmed', "true");
				}
				else if(kairos.error){
					socket.emit('identity-confirmed', "false");
				}
			});
		});

		function enroll_visitor(img){
			var img_uri = img.replace('data:image/jpeg;base64,', '');
			var newVisitor = new User({img_base64: img, role: 'visitor'});
			User.saveVisitor(newVisitor, function(){
				socket.emit('identity-confirmed', "true");
				console.log(User.visitorUsername);
				kairos.enroll(img_uri, User.visitorUsername, gallery, function(){
					if(kairos.error) socket.emit('identity-confirmed', "false");
					else{
						var query = {'_id': User.count};
						var update = {username: User.visitorUsername, gender: kairos.attributes.gender.type,
							age: kairos.attributes.age};
							User.updateUser(query, update);
							var newFace = new Face({username: User.visitorUsername});
							Face.saveFace(newFace);
						}
					});
				});
			}

			socket.on('face-data', function(data){
				if(kairos.status == "failure"){
					var query = {username: User.visitorUsername};
					var newSubFace = new SubFace({emotion: data.emotion, appearance: data.appearance,
						expression: data.expression, featurePoint: data.featurePoint});
						Face.updateFace(query,{$push: {data: newSubFace}});

					}
					if(kairos.status == "success"){
						var query = {username: kairos.id};
						var newSubFace = new SubFace({emotion: data.emotion, appearance: data.appearance,
							expression: data.expression, featurePoint: data.featurePoint});
							Face.updateFace(query,{$push: {data: newSubFace}});
						}
					});

					User.find({}).sort('-createdAt').limit(10).exec(function(err, docs){
						if(err) throw err;
						socket.emit('load visitors', docs);
					});

					socket.on('selected-id', function(id){
						User.getUserByUsername(id, function(err, user){
							if(err) throw err;
							//console.log(user.username);
							socket.emit('visitor data', user);
						});
					});

					socket.on('profile-update', function(data){
						var query = {'username': data.username};
						var update = {'name': data.name};
						User.updateUser(query, update);
					});

					socket.on('search user', function(data){
						var query;
						if(data.option == 'User ID') query ={username : data.input};
						else if(data.option == '姓名') query ={name : data.input};
						else if(data.option == '身分') query ={role : data.input};
						else if(data.option == '年齡') query ={age : data.input};
						else if(data.option == '性別') query ={gender : data.input.toUpperCase()};

						User.find(query, function(err, data) {
							if(err) throw err;
							//console.log(data);
							socket.emit('searched user data', data);
						}).select("-password -_v");
					});

					socket.on('push data start', function(start){
						if(start == true) socket.emit('getUsername', faceDetect.username);
						/*if(start == true){
						var query = {username: index.username};
						var joy = [];
						var sadness = [];
						var disgust = [];
						var contempt = [];
						var anger = [];
						var fear = [];
						var surprise = [];
						var valence = [];
						var engagement = [];
						var createdAt = [];
						Face.findOne(query, function(err, face){
						if(err) throw err;
						face.data.forEach(function(element){
						joy.push(element.emotion[0].joy);
						sadness.push(element.emotion[0].sadness);
						disgust.push(element.emotion[0].disgust);
						contempt.push(element.emotion[0].contempt);
						anger.push(element.emotion[0].anger);
						fear.push(element.emotion[0].fear);
						surprise.push(element.emotion[0].surprise);
						valence.push(element.emotion[0].valence);
						engagement.push(element.emotion[0].engagement);
						createdAt.push(element.createdAt);
					});
					socket.emit('push old data', {joy: joy, sadness: sadness, disgust: disgust,
					contempt: contempt, anger: anger, fear: fear, surprise: surprise, valence: valence,
					engagement: engagement}, createdAt);
				});
			}*/
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
	});
};
