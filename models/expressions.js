var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var autoIncrement = require('mongoose-auto-increment');
var prefix = 'exp_';

var EmotionSchema = mongoose.Schema({
  user_id: String,
  media: String,
  expressions: Object,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

autoIncrement.initialize(mongoose.connection);
ExpressionSchema.plugin(autoIncrement.plugin, { model: 'Expression', prefix: prefix, field: 'expressionID' });

var Expression = module.exports = mongoose.model('Expression', ExpressionSchema);
