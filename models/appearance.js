var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var autoIncrement = require('mongoose-auto-increment');
var prefix = 'appearance_';

var AppearanceSchema = mongoose.Schema({
  user_id: String,
  media_id: String,
  age: Number,
  glasses: Boolean,
  createdAt: {
    type: Date,
    default: Date.now
  }
},{
  toObject: {virtuals:true},
	toJSON: {virtuals:true}
});

AppearanceSchema.virtual('media', {
	ref: 'Image',
	localField: 'media_id',
	foreignField: 'imageID',
	justOne: true
});

autoIncrement.initialize(mongoose.connection);
AppearanceSchema.plugin(autoIncrement.plugin, { model: 'Appearance', prefix: prefix, field: 'appearanceID' });

var Appearance = module.exports = mongoose.model('Appearance', AppearanceSchema);
