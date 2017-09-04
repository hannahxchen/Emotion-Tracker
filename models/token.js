var mongoose = require('mongoose');

var TokenSchema=mongoose.Schema({
  key: {type: String}
});

var Token = module.exports = mongoose.model('Token', TokenSchema, 'tokens');

module.exports.findToken = function findToken(token, callback){
  var query = {key: token};
  Token.findOne(query, callback);
};
