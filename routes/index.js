var express = require('express');
var router = express.Router();
var passport = require('passport');
var User = require('../models/user');
var kairos = require('../API/kairos');
var moment = require('moment');
var gallery = require('../config/kairos_api').gallery;

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

// Get Homepage
router.get('/', ensureAuthenticated, function(req, res){
	res.render('index');
});

// Register
router.get('/register', function(req, res){
	res.render('register', {errors: false, img_error: false});
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
		res.render('register',{
			errors:errors,
		});
	} else {
		var newUser = new User({
			name: name,
			email:email,
			username: username,
			password: password,
			role: role,
			birth: birthday,
			gender: gender
		});

		var response = User.createUser(newUser, img, function(err, user){
			if(err) throw err;
			else console.log(user);
		});

		if(response.error){
			res.render('register',{
				img_error: "偵測不到臉，請再重拍一次"
			});
		}
		else{
			req.flash('success_msg', '註冊完成，您現在可以進行登入！');
			res.redirect('/login');
		}
	}
});

//Login
router.get('/login', function(req, res){
	res.render('login');
});

router.post('/login',
	passport.authenticate('local-login-auto', {
		successRedirect: '/',
		failureRedirect: '/login',
		failureFlash: 'Invalid user.'
}));

router.post('/login_manual',
	passport.authenticate('local-login', {
	successRedirect: '/',
	failureRedirect: '/login_manual',
	failureFlash: 'Invalid username or password.'
}));

//Logout
router.get('/logout', function(req, res){
	req.logout();

	req.flash('success_msg', '您已經登出！');

	res.redirect('/login');
});

router.get('/profile', ensureAuthenticated, function(req, res){
	res.render('profile', { user: req.user, moment: moment });
});

module.exports = router;
