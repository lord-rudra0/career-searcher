const mongoose = require('mongoose');

const MinimalCareerSchema = new mongoose.Schema({
  title: { type: String, required: true },
  match: { type: Number },
}, { _id: false });

const AnalysisResultSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  groupName: { type: String, required: true },
  answersCount: { type: Number, default: 0 },
  durationMs: { type: Number, default: 0 },
  aiCareers: { type: [MinimalCareerSchema], default: [] },
  pdfCareers: { type: [MinimalCareerSchema], default: [] },
  inputHash: { type: String, index: true },
}, { timestamps: true });

module.exports = mongoose.model('AnalysisResult', AnalysisResultSchema);
