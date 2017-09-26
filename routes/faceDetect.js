/*var express = require('express');
var router = express.Router();
var Face = require('../models/face');

router.get('/tracker', function(req, res){
  res.render('tracker');
});

router.get('/monitor', function(req, res){
  res.render('monitor');
});

router.get('/visitors', function(req, res){
  res.render('visitors');
});

router.get('/trackerData', function(req, res){
	res.render('trackerData');
	module.exports.username = req.user.username;
});

router.post('/clearData', function(req, res){
  Face.updateFace({username: req.user.username}, {'data': []}, function(err, face){
    if(err) throw err;
  });
  res.redirect('/faceDetect/trackerData');
});

module.exports = router;*/
