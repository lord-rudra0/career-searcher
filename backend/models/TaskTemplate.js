const mongoose = require('mongoose');

const TaskTemplateSchema = new mongoose.Schema({
  role: { type: String, required: true, unique: true },
  skills: { type: [String], default: [] },
  titles: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

TaskTemplateSchema.pre('save', function(next) { this.updatedAt = new Date(); next(); });

module.exports = mongoose.model('TaskTemplate', TaskTemplateSchema);
