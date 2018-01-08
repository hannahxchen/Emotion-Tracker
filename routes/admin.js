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
	res.render('admin_index');
});

//Login
router.get('/login', function(req, res){
	res.render('admin_login');
});

router.post('/login',
	passport.authenticate('local-login-auto', {
		successRedirect: '/admin',
		failureRedirect: '/admin/login',
		failureFlash: 'Invalid user.'
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

module.exports = router;
