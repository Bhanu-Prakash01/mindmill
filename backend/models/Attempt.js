const mongoose = require('mongoose');

// Ensure dependent models are registered
require('./User');
require('./Assessment');
require('./Organization');
require('./Report');
require('./Question');

const answerSchema = new mongoose.Schema({
  question: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true
  },
  selectedOption: {
    type: Number,
    default: null
  },
  textAnswer: {
    type: String,
    default: ''
  },
  ratingAnswer: {
    type: Number,
    default: null
  },
  isCorrect: {
    type: Boolean,
    default: false
  },
  marksObtained: {
    type: Number,
    default: 0
  },
  answeredAt: {
    type: Date,
    default: Date.now
  },
  timeSpent: {
    type: Number,
    default: 0
  }
}, { _id: true });

const attemptSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  testTakerName: {
    type: String,
    default: null
  },
  assessment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assessment',
    required: [true, 'Assessment is required']
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: [true, 'Organization is required']
  },
  isPublicAttempt: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['in-progress', 'completed', 'expired', 'abandoned', 'paused'],
    default: 'in-progress'
  },
  attemptNumber: {
    type: Number,
    default: 1
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date,
    default: null
  },
  expiresAt: {
    type: Date,
    default: null
  },
  timeSpent: {
    type: Number,
    default: 0
  },
  timeLimit: {
    type: Number,
    default: 0
  },
  answers: [answerSchema],
  totalQuestions: {
    type: Number,
    default: 0
  },
  answeredQuestions: {
    type: Number,
    default: 0
  },
  score: {
    type: Number,
    default: 0
  },
  totalMarks: {
    type: Number,
    default: 0
  },
  percentage: {
    type: Number,
    default: 0
  },
  percentile: {
    type: Number,
    default: 0
  },
  passed: {
    type: Boolean,
    default: false
  },
  report: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Report',
    default: null
  },
  // For psychometric assessments
  dimensionScores: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // For Big5 personality assessments
  big5Results: {
    E: {
      score: { type: Number, default: 0 },
      percent: { type: Number, default: 0 },
      level: { type: String, default: '' }
    },
    A: {
      score: { type: Number, default: 0 },
      percent: { type: Number, default: 0 },
      level: { type: String, default: '' }
    },
    C: {
      score: { type: Number, default: 0 },
      percent: { type: Number, default: 0 },
      level: { type: String, default: '' }
    },
    N: {
      score: { type: Number, default: 0 },
      percent: { type: Number, default: 0 },
      level: { type: String, default: '' }
    },
    O: {
      score: { type: Number, default: 0 },
      percent: { type: Number, default: 0 },
      level: { type: String, default: '' }
    }
  },
  // For DISC personality assessments
  discResults: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  // Security tracking
  ipAddress: {
    type: String,
    default: ''
  },
  userAgent: {
    type: String,
    default: ''
  },
  tabSwitchCount: {
    type: Number,
    default: 0
  },
  fullscreenExits: {
    type: Number,
    default: 0
  },
  suspiciousActivity: {
    type: Boolean,
    default: false
  },
  deviceInfo: {
    browser: { type: String, default: '' },
    os: { type: String, default: '' },
    device: { type: String, default: '' }
  },
  // Proctoring
  proctoringEnabled: {
    type: Boolean,
    default: false
  },
  proctoringLogs: [{
    event: String,
    timestamp: Date,
    details: mongoose.Schema.Types.Mixed
  }],
  reportRequest: {
    requested: { type: Boolean, default: false },
    requestedAt: { type: Date, default: null },
    message: { type: String, default: '' },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    reviewedAt: { type: Date, default: null },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
  }
}, {
  timestamps: true
});

// Indexes
attemptSchema.index({ user: 1 });
attemptSchema.index({ assessment: 1 });
attemptSchema.index({ organization: 1 });
attemptSchema.index({ status: 1 });
attemptSchema.index({ user: 1, assessment: 1 });
attemptSchema.index({ createdAt: -1 });

// Pre-save middleware to calculate statistics
attemptSchema.pre('save', function(next) {
  if (this.isModified('answers')) {
    this.answeredQuestions = this.answers.filter(a => 
      a.selectedOption !== null || a.textAnswer !== '' || a.ratingAnswer !== null
    ).length;
  }
  next();
});

module.exports = mongoose.model('Attempt', attemptSchema);
