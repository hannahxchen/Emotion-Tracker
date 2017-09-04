var express = require('express');
var router = express.Router();
var passport = require('passport');
var User = require('../models/user');
var Face = require('../models/face');
var kairos = require('../API/kairos');
var moment = require('moment');
var gallery = require('../config/kairos_api').gallery;

var query = null;
var update = null;

function ensureAuthenticated(req, res, next){
	if(req.isAuthenticated()){
		return next();
	} else {
		//req.flash('error_msg','您還尚未登入！');
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
	var email = req.body.email;
	var username = req.body.username;
	var password = req.body.password;
	var password2 = req.body.password2;
	var img_error = '';
	var shot = req.body.ifshot;
	console.log(shot);

	// Validation
	req.checkBody('name', '請輸入姓名').notEmpty();
	req.checkBody('email', 'Email 為必填').notEmpty();
	req.checkBody('email', 'Email 格式錯誤').isEmail();
	req.checkBody('username', '請輸入帳號').notEmpty();
	req.checkBody('password', '請輸入密碼').notEmpty();
	req.checkBody('password2', '確認密碼錯誤').equals(req.body.password);

	if(shot == "false"){
		console.log('no profile pic');
		img_error = '請拍張個人照';
	}else{
		var img = req.body.img_uri;
		var img_uri = img.replace('data:image/jpeg;base64,', '');
	}

	var errors = req.validationErrors();

	if(errors || !shot){
		errors.forEach(function(error){
			console.log(error.msg);
		});
		res.render('register',{
			errors:errors,
			img_error:img_error
		});
	} else {
		var newUser = new User({
			name: name,
			email:email,
			username: username,
			password: password,
			img_base64: img
		});

		User.createUser(newUser, function(err, user){
			if(err) throw err;
			//console.log(user);
		});

		kairos.enroll(img_uri, username, gallery, function(){
			query = {username: username};
			update = {gender: kairos.attributes.gender.type, age: kairos.attributes.age};
			User.updateUser(query, update);
		});

		var newFace = new Face({username: username});
		Face.saveFace(newFace);

		req.flash('success_msg', 'You are registered and can now login');

		res.redirect('/login');
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

router.get('/strokeTest', function(req, res){
  res.render('strokeTest');
});

<<<<<<< HEAD
=======
<<<<<<< HEAD
=======
router.get('/hueLight', function(req, res){
	res.render('hueAPI');
});

>>>>>>> origin/master
>>>>>>> origin/master
module.exports = router;
