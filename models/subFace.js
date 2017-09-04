var mongoose = require('mongoose');

var SubFaceSchema = mongoose.Schema({
  emotion: [{}],
	appearance: [{}],
	expression: [{}],
	featurePoint: [{}],
	createdAt: {
    type:Date,
    default:Date.now
  }
},{ _id : false });

var SubFace = module.exports= mongoose.model('SubFace', SubFaceSchema);
