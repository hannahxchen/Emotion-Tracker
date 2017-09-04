var mongoose = require('mongoose');
var Schema    = mongoose.Schema;
var SubFace = require('./subFace');

var FaceSchema = mongoose.Schema({
  username      : String,
	data: [SubFace.schema]
}); 

var Face=module.exports=mongoose.model('Face', FaceSchema);

module.exports.saveFace = function saveFace(newFace){
  newFace.save(function(err){
    if(err) throw err;
  });
};

module.exports.updateFace = function(query, update){
	var options = { new: true };
	Face.findOneAndUpdate(query, update, options, function(err, doc){
		if(err) throw err;
	});
};
