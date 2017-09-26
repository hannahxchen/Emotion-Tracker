var kairos = require('./API/kairos');
var mongoose = require('mongoose');
var User = require('./models/user');
var faceDetect = require('./routes/faceDetect');
var kairos = require('./API/kairos');
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
			kairos.recognize(img, function(error, status, userID){
				if(error) socket.emit('login', {success: false});
				else if(status == "success"){
					User.findOne({userID: userID}, function(err, doc){
						if(err) throw err;
						console.log('Login with username: ' + doc.username);
						socket.emit('login', {success: true, id: doc.username});
					});
				}
				else if(status == "failure"){
					console.log("Unknown user");
					socket.emit('login', {success: false});
				}
			});

		});

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

			/*socket.on('face-data', function(data){
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

					socket.on('selected-id', function(username){
						User.findOne({username: username}, function(err, user){
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
		});*/

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
