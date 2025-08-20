const mongoose = require('mongoose');

const EvidenceSchema = new mongoose.Schema({
  url: { type: String, required: false }
}, { _id: false });

const TaskSchema = new mongoose.Schema({
  id: { type: String, required: true },
  day: { type: Number, required: true },
  title: { type: String, required: true },
  skillTag: { type: String, required: true },
  status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
  timeMin: { type: Number, default: 0 },
  interest: { type: Number, default: 0 },
  difficulty: { type: Number, default: 0 },
  evidence: { type: [String], default: [] }
}, { _id: false });

const SideSummarySchema = new mongoose.Schema({
  completionRate: { type: Number, default: 0 },
  avgInterest: { type: Number, default: 0 },
  avgDifficulty: { type: Number, default: 0 },
  fitScore: { type: Number, default: 0 }
}, { _id: false });

const TryoutSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  pathA: { type: String, required: true },
  pathB: { type: String, required: true },
  durationDays: { type: Number, default: 7, min: 1 },
  createdAt: { type: Date, default: Date.now },
  tasks: {
    A: { type: [TaskSchema], default: [] },
    B: { type: [TaskSchema], default: [] }
  },
  summary: {
    A: { type: SideSummarySchema, default: () => ({}) },
    B: { type: SideSummarySchema, default: () => ({}) }
  }
});

module.exports = mongoose.model('Tryout', TryoutSchema);
