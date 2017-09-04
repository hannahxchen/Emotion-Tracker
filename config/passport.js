var LocalStrategy = require('passport-local').Strategy;
var User = require('../models/user');
var mongoose = require('mongoose');

module.exports = function(passport) {
  passport.serializeUser(function(user, done){
    done(null, user.id);
  });

  passport.deserializeUser(function(id, done) {
    User.getUserById(id, function(err, user) {
      done(err, user);
    });
  });

  /*passport.use('local-signup', new LocalStrategy({
    usernameField: 'username',
    passwordField: 'password',
    passReqToCallback: true,
  },
  function(req, username, password, done) {
    process.nextTick(function() {
      var name = req.body.name;
      var email = req.body.email;
      var username = req.body.username;
      var password1 = req.body.password;
      var password2 = req.body.password2;

      req.checkBody('name', 'Name is required').notEmpty();
      req.checkBody('email', 'Email is required').notEmpty();
      req.checkBody('email', 'Email is not valid').isEmail();
      req.checkBody('username', 'Username is required').notEmpty();
      req.checkBody('password1', 'Password is required').notEmpty();
      req.checkBody('password1', 'The password length must be between 8 and 100.').isLength({min: 8, max: 100});
      req.checkBody('password2', 'Passwords do not match').equals(password1);

      var errors = req.validationErrors();

      if (errors) {
        return done(errors, false, { success: false, error: errors});
      }

      User.getUserByUsername(username, function(err, user) {
        if (err) throw err;
        if(!user){
          return done(null, false, {message: 'That username is already taken!'});
        } else {
          var newUser = new User({
            name: name,
            email:email,
            username: username,
            password: password
          });

          User.createUser(newUser, function(err, user){
            if(err) throw err;
            console.log(user);
          });

          req.flash('success_msg', 'You are registered and can now login');

          res.redirect('/users/login');
        }
      });
    });
  }));*/

  passport.use('local-login', new LocalStrategy({
    usernameField: 'username',
    passwordField: 'password',
    passReqToCallback: true
  },
  function(req, username, password, done) {
    User.getUserByUsername(username, function(err, user){
      if(err) throw err;
      if(!user){
        return done(null, false, {message: 'Unknown User'});
      }

      User.validPassword(password, user.password, function(err, isMatch){
        if(err) throw err;
        if(isMatch){
          return done(null, user);
        } else {
          return done(null, false, {message: 'Invalid password'});
        }
      });
    });
  }));

  passport.use('local-login-auto', new LocalStrategy({
    usernameField: 'username',
    passwordField: 'username',
    passReqToCallback: true,
  },
    function(req, username, password,done){
      User.getUserByUsername(username, function(err, user){
        if(err) throw err;
        if(!user){
          return done(null, false, {message: 'Unknown User'});
        }

        return done(null, user);
      });
  }));
};
