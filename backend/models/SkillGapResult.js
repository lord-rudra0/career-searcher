const mongoose = require('mongoose');

const SkillGapCareerSchema = new mongoose.Schema({
  title: { type: String },
  match: { type: Number },
  requiredSkills: { type: mongoose.Schema.Types.Mixed },
  gaps: { type: mongoose.Schema.Types.Mixed },
  recommendations: { type: mongoose.Schema.Types.Mixed },
  next90DaysPlan: { type: mongoose.Schema.Types.Mixed },
  metrics: { type: [mongoose.Schema.Types.Mixed], default: [] },
}, { _id: false });

const SkillGapResultSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  groupName: { type: String },
  preferences: { type: mongoose.Schema.Types.Mixed },
  targetCareers: { type: [String], default: [] },
  userSkills: { type: mongoose.Schema.Types.Mixed },
  careers: { type: [SkillGapCareerSchema], default: [] },
  inputHash: { type: String, index: true },
}, { timestamps: true });

module.exports = mongoose.model('SkillGapResult', SkillGapResultSchema);
