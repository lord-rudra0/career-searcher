const mongoose = require('mongoose');

const QASchema = new mongoose.Schema({
  question: { type: String },
  answer: { type: String },
}, { _id: false });

const FullAnalysisResultSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  groupName: { type: String, required: true },
  preferences: { type: mongoose.Schema.Types.Mixed, default: {} },
  finalAnswers: { type: [QASchema], default: [] },
  response: { type: mongoose.Schema.Types.Mixed, required: true },
  answersCount: { type: Number, default: 0 },
  durationMs: { type: Number, default: 0 },
  inputHash: { type: String, index: true },
}, { timestamps: true });

module.exports = mongoose.model('FullAnalysisResult', FullAnalysisResultSchema);
