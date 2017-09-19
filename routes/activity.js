var express = require('express');
var router = express.Router();

router.get('/', function(req, res){
  res.render('activity');
});

router.get('/upload', function(req, res){
  res.render('uploadActivity');
});

module.exports = router;
