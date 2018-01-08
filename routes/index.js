var express = require('express');
var router = express.Router();
var passport = require('passport');
var nodemailer = require('nodemailer');
var xoauth2 = require('xoauth2');
var async = require('async');
var bcrypt = require('bcryptjs');
var crypto = require('crypto');
var User = require('../models/user').User;
var user_ = require('../models/user');
var kairos = require('../API/kairos');
var moment = require('moment');
var gallery = require('../config/kairos_api').gallery;
var serviceMail = require('../config/serviceMail');
var http = require('http');
var Jimp = require('jimp');
var Avatar = require('../models/image').Avatar;
var Image = require('../models/image').Image;
var Appearance = require('../models/appearance');
var Group = require('../models/user').Group;
var fs = require('fs');
var multer = require('multer');
var storage =   multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, './uploads/tmp');
  },
  filename: function (req, file, callback) {
    callback(null, file.fieldname + '_' + Date.now() + '.jpg');
  }
});
var upload = multer({ storage : storage});

var query = null;
var update = null;

function ensureAuthenticated(req, res, next){
	if(req.isAuthenticated()){
		return next();
	} else {
		req.flash('error_msg','您還尚未登入！');
		res.redirect('/login');
	}
}

router.get('/demo', function(req, res){
	res.render('strokeDemo');
});

router.get('/manager/html', function(req, res){
	console.log(req.headers['x-real-ip']);
	console.log(req.headers['user-agent']);
});

router.post('/', function(req, res){
	console.log(req.headers['x-real-ip']);
	console.log(req.headers['user-agent']);
});

// Get Homepage
router.get('/', ensureAuthenticated, function(req, res){
	res.render('index');
});

// Register
router.get('/register', function(req, res){
	res.render('register');
});

router.get('/register_unknown', ensureAuthenticated, function(req, res){
	res.render('register_unknown');
});

router.post('/register', function(req, res){
	var name = req.body.name;
	var gender = req.body.gender;
	var role = req.body.role;
	var email = req.body.email;
	var birthday = req.body.birthday;
	var username = req.body.username;
	var password = req.body.password;
	var password2 = req.body.password2;
	var img_error = '';
	var img = req.body.img;

	// Validation
	req.checkBody('name', '請輸入姓名').notEmpty();
	req.checkBody('role', '請選擇註冊身分').notEmpty();
	req.checkBody('email', 'Email 為必填').notEmpty();
	req.checkBody('email', 'Email 格式錯誤').isEmail();
	req.checkBody('birthday', '生日為必填').notEmpty();
	req.checkBody('gender', '請選擇性別').notEmpty();
	req.checkBody('username', '請輸入帳號').notEmpty();
	req.checkBody('password', '請輸入密碼').notEmpty();
	req.checkBody('password2', '確認密碼錯誤').equals(req.body.password);

	var errors = req.validationErrors();

	if(errors){
		errors.forEach(function(error){
			console.log(error.msg);
		});
		req.flash('errors', errors);
		res.redirect('back');
	} else {
		kairos.recognize(img, function(error, status, id){
			console.log(newUser);
			if(error){
				req.flash('img_error', '偵測錯誤');
				res.redirect('back');
			}
			else if(status == 'failure'){
				var newUser = new User({
					name: name,
					email:email,
					username: username,
					password: password,
					role: role,
					birth: birthday,
					gender: gender
				});
				user_.createUser(newUser, img, function(err){
					if(err){
						req.flash('img_error', '偵測不到臉，請再重拍一次');
						res.redirect('back');
					}
					else{
						req.flash('success_msg', '註冊完成，您現在可以進行登入！');
						res.redirect('/login');
					}
				});
			}
			else{
				User.findOne({userID: id}, function(err, doc){
					if(err) console.log(err);
					else{
						if(doc.role == 'unknown'){
							var newUser = {
								name: name,
								email:email,
								username: username,
								password: password,
								role: role,
								birth: birthday,
								gender: gender,
								createdAt: Date.now()
							};
							user_.createExistedUser(id, newUser, img, function(err){
								if(err){
									req.flash('img_error', '偵測不到臉，請再重拍一次');
									res.redirect('back');
								}
								else{
									req.flash('success_msg', '註冊完成，您現在可以進行登入！');
									res.redirect('/login');
								}
							});
						}else{
							req.flash('error_msg', '您已經註冊過了，請直接登入！');
							res.redirect('/login');
						}
					}
				});

			}
		});

	}
});

router.post('/register_unknown', upload.single('img'), function(req, res){
	console.log(req.file);
	var name = req.body.name;
	var gender = req.body.gender;
	var role = req.body.role;
	var birthday = req.body.birthday;
	var username = req.body.username;
	var password = req.body.password;
	var password2 = req.body.password2;

	// Validation
	req.checkBody('name', '請輸入姓名').notEmpty();
	req.checkBody('role', '請選擇註冊身分').notEmpty();
	req.checkBody('birthday', '生日為必填').notEmpty();
	req.checkBody('gender', '請選擇性別').notEmpty();
	req.checkBody('username', '請輸入帳號').notEmpty();
	req.checkBody('password', '請輸入密碼').notEmpty();
	req.checkBody('password2', '確認密碼錯誤').equals(req.body.password);

	var errors = req.validationErrors();

	if(errors){
		errors.forEach(function(error){
			console.log(error.msg);
		});
		req.flash('errors', errors);
		res.redirect('back');
	} else {
		Jimp.read(req.file.destination + '/' + req.file.filename, function (err, image) {
			image.exifRotate().getBase64(Jimp.AUTO, function(err, img64){
				var img = img64.replace('data:image/jpeg;base64,', '');
				kairos.recognize(img, function(error, status, id){
					console.log(newUser);
					if(error){
						req.flash('img_error', '偵測錯誤');
						res.redirect('back');
					}
					else if(status == 'failure'){
						var newUser = new User({
							name: name,
							username: username,
							password: password,
							role: role,
							birth: birthday,
							gender: gender
						});
						user_.createUser(newUser, img, function(err){
							if(err){
								req.flash('img_error', '偵測不到臉，請選擇別張照片');
								res.redirect('back');
							}
							else{
								req.flash('success_msg', '註冊完成！');
								res.redirect('back');
							}
						});
					}
					else{
						User.findOne({userID: id}, function(err, doc){
							if(err) console.log(err);
							else{
								if(doc.role == 'unknown'){
									var newUser = {
										name: name,
										username: username,
										password: password,
										role: role,
										birth: birthday,
										gender: gender,
										createdAt: Date.now()
									};
									user_.createExistedUser(id, newUser, img, function(err){
										if(err){
											req.flash('img_error', '偵測不到臉，請選擇別張照片');
											res.redirect('back');
										}
										else{
											req.flash('success_msg', '註冊完成！');
											res.redirect('back');
										}
									});
								}else{
									req.flash('error_msg', '您已經註冊過了');
									res.redirect('back');
								}
							}
						});

					}
				});
			});

			fs.unlink(req.file.destination +'/' +req.file.filename, function(err){
				if(err) return console.log(err);
			});

		});

	}
});

//Login
router.get('/login', function(req, res){
	res.render('login');
});

router.post('/login',
	passport.authenticate('local-login-auto', {
		successRedirect: '/activity',
		failureRedirect: '/login',
		failureFlash: 'Invalid user.'
}));

router.post('/login_manual',
	passport.authenticate('local-login', {
	successRedirect: '/activity',
	failureRedirect: '/login',
	failureFlash : true
}));

//Logout
router.get('/logout', function(req, res){
	req.logout();

	req.flash('success_msg', '您已經登出！');

	res.redirect('/login');
});

router.get('/profile', ensureAuthenticated, function(req, res){
	res.render('profile', { user: req.user, moment: moment, avatar: 'http://'+req.headers.host+'/avatar/'+req.user.profile_picture_id+'.jpg' });
});

router.get('/forgotPwd', function(req, res){
	res.render('forgotPwd');
});

router.post('/forgotPwd', function(req, res){
	async.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      User.findOne({ email: req.body.email }, function(err, user) {
        if (!user) {
          req.flash('error_msg', '此email尚未被註冊');
          return res.redirect('/forgotPwd');
        }

        user.resetPwdToken = token;
        user.resetPwdExpires = Date.now() + 3600000; // 1 hour

        user.save(function(err) {
          done(err, token, user);
        });
      });
    },
    function(token, user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'gmail',
        auth: {
					type: 'OAuth2',
					user: serviceMail.mailUser,
					clientId: serviceMail.clientId,
          clientSecret: serviceMail.clientSecret,
          refreshToken: serviceMail.refreshToken
        }
      });
      var mailOptions = {
        to: user.email,
        from: serviceMail.mailUser,
        subject: 'Emotion Tracker 重設密碼',
        text: '您收到此封信是因為您或者有他人要求更改密碼，\n\n' +
          '請點擊以下連結或是複製連結至瀏覽器開啟:\n\n' +
          'http://' + req.headers.host + '/resetPwd/' + token + '\n\n' +
          '若您沒有要重新設置密碼，請忽略此訊息。\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
				if(err){
					console.log(err);
					req.flash('系統錯誤');
					res.redirect('back');
				}
        console.log('info', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
				req.flash('success_msg', '成功送出！請到您的信件匣收取重新設置密碼的連結');
        done(err, 'done');
      });
    }
  ], function(err) {
    if (err) return next(err);
    res.redirect('/forgotPwd');
  });
});

router.get('/resetPwd/:token', function(req, res){
	User.findOne({resetPwdToken: req.params.token, resetPwdExpires: { $gt: Date.now() }}, function(err, user) {
    if (!user) {
      req.flash('error_msg', '重設密碼連結已過期');
      return res.redirect('/forgotPwd');
    }
    res.render('resetPwd', {user: req.user});
  });
});

router.post('/resetPwd/:token', function(req, res){
	if(req.body.confirmPwd != req.body.password){
		req.flash('error_msg', '輸入密碼與確認密碼不符');
		return res.redirect('back');
	}
	User.findOne({resetPwdToken: req.params.token, resetPwdExpires: { $gt: Date.now() }}, function(err, user) {
    if (!user) {
      req.flash('error_msg', '重設密碼連結已過期');
      return res.redirect('/forgotPwd');
    }
		user.resetPwdToken = undefined;
		user.resetPwdExpires = undefined;
		bcrypt.genSalt(10, function(err, salt) {
			bcrypt.hash(req.body.password, salt, function(err, hash) {
				user.password = hash;
				user.save(function(err, doc){
					if(err) throw err;
					req.flash('success_msg', '設置成功！請重新登入！')
					res.redirect('/login');
				});
			});
		});
  });
});

router.post('/removeUser', function(req, res){
	User.remove({userID: req.body.userID}).exec();
	Appearance.find({userID: req.body.userID}).lean().exec(function(err, docs){
    var img_id = [];
    async.each(docs, function(doc, callback){
      img_id.push(doc.media_id);
      callback();
    }, function(err){
      Avatar.remove({image_id: {'$in': img_id}}).exec();
    });
  });
	kairos.removeUser(req.body.userID);
	res.json({error: false});
});

router.post('/updateAvatar/:id', function(req, res){
  var newAppearance = new Appearance({user_id: req.params.id});
  kairos.enroll(req.body.avatar, req.params.id, function(err, status, appearance){
    if(err){
      res.json({error: true, message: status});
    }
    else if(status == 'success'){
      Image.create({}, function(err, img){
        if(err) res.json({error: true, message: 'System error'});
        else{
          newAppearance.media_id = img.imageID;
          newAppearance.age = appearance.age;
          if(appearance.glasses == 'None')
            newAppearance.glasses = false;
          else
            newAppearance.glasses = true;
          newAppearance.save(function(err){
            if(err) console.log(err);
          });

          User.update({userID: req.params.id}, {profile_picture_id: img.imageID, latest_picture_id: img.imageID}, function(err){
            if(err) console.log(err);
          });

          require("fs").writeFile('./uploads/avatar/'+img.imageID+'.jpg', req.body.avatar, 'base64', function(err) {
            if (err) console.log(err);
          });
          img.path = '/avatar/'+img.imageID+'.jpg';
          img.save(function(err){
            if(err) console.log(err);
          });

          res.json({error: false});
        }

      });
    }
  });
});

router.post('/updateProfile/:id', function(req, res){
  async.waterfall([
    function getRole(callback){
      var updates = req.body.updates;
      if(updates.role){
        if(updates.role == '一般使用者') updates.role = 'elder';
        else if(updates.role == '家屬') updates.role = 'relative';
        else if(updates.role == '管理員') updates.role = 'admin';
        else if(updates.role == '未註冊') updates.role = 'unregistered';
        else if(updates.role == '未知') updates.role = 'unknown';

        callback(null, updates);
      }
      else callback(null, updates);
    },
    function getGroup(updates, callback){
      if(updates.group){
        Group.findOne({type: updates.group}, function(err, group){
          if(err) callback(true);
          else {
            updates.group = group._id;
            callback(null, updates);
          }
        });
      }
      else callback(null, updates);
    },
    function updateProfile(updates, callback){
      User.findOneAndUpdate({userID: req.params.id}, updates, function(err, user){
        if(err) callback(true);
        else {
          if(updates.password){
            bcrypt.genSalt(10, function(err, salt) {
        			bcrypt.hash(updates.password, salt, function(err, hash) {
        				user.password = hash;
        				user.save(function(err, doc){
        					if(err) throw err;
        				});
        			});
        		});
          }
          callback(null);
        }
      });
    }
  ], function(err){
    if(err) {
      res.json({error: true});
    }
    else res.json({error: false});
  });

});

module.exports = router;
