const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  // Required group type (e.g., 'Class 9-10', 'Class 11-12', 'Graduate')
  groupType: { type: String, required: [true, 'Group type is required'] },
  // Optional location preferences
  preferences: {
    // Academic profile fields used by dashboard/checklist
    stream: { type: String },
    targetExam: { type: String },
    colleges: { type: [String], default: [] },
    jobLocation: {
      country: { type: String },
      state: { type: String },
      district: { type: String },
    },
    studyLocation: {
      // If India: set state/district; if abroad: set country
      country: { type: String },
      state: { type: String },
      district: { type: String },
    }
  },
  // Map of journey step title -> boolean (completed)
  journeyProgress: { type: Map, of: Boolean, default: {} },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Method to verify password
UserSchema.methods.verifyPassword = async function(password) {
  return bcrypt.compare(password, this.password);
};

// Pre-save hook to hash the password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const User = mongoose.model('User', UserSchema);
module.exports = User;