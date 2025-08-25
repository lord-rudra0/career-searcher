const mongoose = require('mongoose');

const AssessmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  group: { type: String },
  analysis: { type: mongoose.Schema.Types.Mixed },
  aiCareers: { type: [mongoose.Schema.Types.Mixed], default: [] },
  timestamp: { type: Date, default: Date.now, index: true },
}, { timestamps: true });

module.exports = mongoose.model('Assessment', AssessmentSchema);
