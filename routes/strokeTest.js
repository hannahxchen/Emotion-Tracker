var express = require('express');
var router = express.Router();
var stringSimilarity = require('string-similarity');

router.get('/', function(req, res){
  res.render('strokeTest');
});

router.post('/uploadResults', function(req, res){

});

router.get('/generateText', function(req, res){

});

router.post('/checkSimilarity', function(req, res){
  var similarity = stringSimilarity.compareTwoStrings(req.body.string1, req.body.string2);
});

module.exports = router;
