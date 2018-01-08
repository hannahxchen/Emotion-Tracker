var LocalStrategy = require('passport-local').Strategy;
var User = require('../models/user').User;
var user_ = require('../models/user');
var mongoose = require('mongoose');

module.exports = function(passport) {
  passport.serializeUser(function(user, done){
    done(null, user.id);
  });

  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });

  passport.use('local-login', new LocalStrategy({
    usernameField: 'username',
    passwordField: 'password',
    passReqToCallback: true
  },
  function(req, username, password, done) {
    User.findOne({username: username}, function(err, user){
      if(err) throw err;
      if(!user){
        return done(null, false, {message: 'Unknown User'});
      }

      user_.validPassword(password, user.password, function(err, isMatch){
        if(err) throw err;
        if(isMatch){
          console.log(req.user);
          req.flash('success_msg', ', welcome back!');
          return done(null, user);
        } else {
          return done(null, false, {message: 'Invalid password'});
        }
      });
    });
  }));

  passport.use('local-login-auto', new LocalStrategy({
    usernameField: "username",
    passwordField: 'username',
    passReqToCallback: true
  },
  function(req, username, password, done){
    User.findOne({username: username}, function(err, user){
      if(err) throw err;
      if(!user){
        return done(null, false, {message: 'Unknown User'});
      }
      else{
        req.flash('success_msg', ', welcome back!');
      }
      return done(null, user);
    });
  }));
};
