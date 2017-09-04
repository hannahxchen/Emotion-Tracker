var express = require('express');
var router = express.Router();

router.get('/apply', function(req, res){
  res.render('applyActivity');
});

module.exports = router;
