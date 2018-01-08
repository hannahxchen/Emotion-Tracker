var express = require('express');
var router = express.Router();
var stringSimilarity = require('string-similarity');
var CVATest_ = require('../models/CVATest');
var CVAAudio = require('../models/CVATest').CVAAudio;
var SampleText = require('../models/CVATest').SampleText;
var CVATest = require('../models/CVATest').CVATest;
var Landmark = require('../models/landmarks').Landmark;
var Image = require('../models/image').Image;
var fs = require('fs');
var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.ObjectId;

function ensureAuthenticated(req, res, next){
	if(req.isAuthenticated()){
		return next();
	} else {
		req.flash('error_msg','您還尚未登入！');
		res.redirect('/login');
	}
}

router.get('/', ensureAuthenticated, function(req, res){
  res.render('strokeTest');
});

router.get('/manage', ensureAuthenticated, function(req, res){
  res.render('sampleText_manage');
});


router.post('/createSampleText', function(req, res){
  var s = req.body.text.replace(/\s+/g,'');
  if(s.length < 10){
    req.flash('error_msg', '新增文字長度過短');
    res.redirect('/strokeTest/manage');
  }
  else if(s.length > 300){
    req.flash('error_msg', '新增文字長度過長');
    res.redirect('/strokeTest/manage');
  }
  else{
    CVATest_.createSampleText(s);
    req.flash('success_msg', '新增完成');
    res.redirect('/strokeTest/manage');
  }
});

router.get('/generateText', function(req, res){
	SampleText.count().exec(function (err, count) {
		var random = Math.floor(Math.random() * count);
		SampleText.findOne().skip(random).exec(
			function (err, result) {
				if(err) throw err;
				console.log(result.SampleTextID);
				res.json(result);
		});
	});
});

router.post('/uploadResults', function(req, res){
  var sampleTxt = req.body.sampleText.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()，。「」]/g, '');
  sampleTxt = sampleTxt.replace(/\s/g, '');
  var audioTxt = req.body.audioText.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()，。「」]/g, '');
  audioTxt = audioTxt.replace(/\s/g, '');
  var accuracy = stringSimilarity.compareTwoStrings(sampleTxt, audioTxt);

  Image.create({people_id: [req.user.userID], owner_id: req.user.userID}, function(err, img){
    if(err) throw err;

    var img_path = "./uploads/CVA_img/"+ img.imageID +'.jpg';
    fs.writeFile(img_path, req.body.img, 'base64', function(err){
      if(err) throw err;
    });

    Image.update({imageID: img.imageID}, {path: img_path.replace("./uploads", "")}, function(err){});

    CVAAudio.create({duration: req.body.duration, text: req.body.audioText, sampleText: req.body.sampleTextID}, function(err, audio){
      if(err) throw err;

      var audio_path = "./uploads/CVA_audio/"+ audio._id+'.mp3';
      fs.writeFile(audio_path, req.body.audio, 'base64', function(err){
        if(err) throw err;
      });

      CVAAudio.update({_id: audio._id}, {path: audio_path.replace('./uploads', '')}, function(err){});

      Landmark.create({user_id: req.user.userID, image_id: img.imageID, landmarks: req.body.landmarks}, function(err, doc){
        if(err) throw err;

        CVATest_.saveResults(req.user.userID, req.body.angle, accuracy, img.imageID, audio._id, doc._id);
      });
    });
  });

  res.json({speechAccuracy: accuracy});
});

module.exports = router;
