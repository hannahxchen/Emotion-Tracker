var express = require('express');
var router = express.Router();
var Image = require('../models/image');
var multer = require('multer');

var storage = multer.diskStorage({
 destination: function(req, file, cb) {
 cb(null, 'uploads/')
 },
 filename: function(req, file, cb) {
 cb(null, file.originalname);
 }
});

var upload = multer({
 storage: storage
});

router.addImage = function(image, callback) {
  Image.create(image, callback);
};

router.get('/', function(req, res, next){
  res.render('photoAlbum');
});

router.post('/uploadImage', upload.any(), function(req, res, next){
  console.log(req.files);
  res.send(req.files);

  var path = req.files[0].path;
  var imageName = req.files[0].originalname;

  var imagepath = {};
  imagepath['path'] = path;
  imagepath['originalname'] = imageName;

  router.addImage(imagepath, function(err) {

 });
});

module.exports = router;
