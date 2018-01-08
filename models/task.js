var mongoose = require('mongoose');
var moment = require('moment');
var ObjectId = mongoose.Schema.ObjectId;

var TaskSchema = mongoose.Schema({
  applicant_id: String,
  object_id: String,
  task_type: {type: ObjectId, ref: 'TaskType'},
  content: String,
  urgency: String,
  read: {type: Boolean, default: false},
  done: {type: Boolean, default: false},
  createdAt: {type: Date, default: Date.now()}
});

var TaskTypeSchema = mongoose.Schema({
  type: String
});

var Task = module.exports.Task = mongoose.model('Task', TaskSchema);
var TaskType = module.exports.TaskType = mongoose.model('TaskType', TaskTypeSchema);
