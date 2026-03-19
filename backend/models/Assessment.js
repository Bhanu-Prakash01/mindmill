const mongoose = require('mongoose');

// Ensure dependent models are registered
require('./Organization');
require('./User');
require('./Question');

const assessmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Assessment title is required'],
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    enum: ['psychometric', 'cognitive', 'situational', 'professional', 'big5', 'disc'],
    required: [true, 'Category is required']
  },
  isLockedStructure: {
    type: Boolean,
    default: false
  },
  isEditable: {
    type: Boolean,
    default: true
  },
  subCategory: {
    type: String,
    default: ''
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: [true, 'Organization is required']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator is required']
  },
  difficulty: {
    type: String,
    enum: ['basic', 'moderate', 'tough'],
    default: 'moderate'
  },
  timeBound: {
    enabled: { type: Boolean, default: false },
    durationMinutes: { type: Number, default: 30 }
  },
  purpose: {
    type: String,
    default: ''
  },
  audience: {
    type: String,
    default: ''
  },
  instructions: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  questions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question'
  }],
  totalQuestions: {
    type: Number,
    default: 0
  },
  totalMarks: {
    type: Number,
    default: 0
  },
  passingScore: {
    type: Number,
    default: 60
  },
  passingPercentage: {
    type: Number,
    default: 60
  },
  allowMultipleAttempts: {
    type: Boolean,
    default: false
  },
  maxAttempts: {
    type: Number,
    default: 1
  },
  showResultsImmediately: {
    type: Boolean,
    default: true
  },
  randomizeQuestions: {
    type: Boolean,
    default: false
  },
  randomizeOptions: {
    type: Boolean,
    default: false
  },
  reportConfig: {
    type: {
      type: String,
      enum: ['auto-psychometric', 'fixed-format', 'standard'],
      default: 'standard'
    },
    showScores: { type: Boolean, default: true },
    showFullReport: { type: Boolean, default: true },
    showPercentile: { type: Boolean, default: false },
    showCorrectAnswers: { type: Boolean, default: false },
    includeRecommendations: { type: Boolean, default: true }
  },
  tags: [{
    type: String,
    trim: true
  }],
  assignedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  assignedGroups: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group'
  }],
  usageCount: {
    type: Number,
    default: 0
  },
  averageScore: {
    type: Number,
    default: 0
  },
  completionRate: {
    type: Number,
    default: 0
  },
  passcode: {
    type: String,
    default: null
  },
  requirePasscode: {
    type: Boolean,
    default: false
  },
  isMuted: {
    type: Boolean,
    default: false
  },
  publicAccessToken: {
    type: String,
    default: null
  },
  publicExpiresAt: {
    type: Date,
    default: null
  },
  creditsRequired: {
    type: Number,
    default: function() {
      const creditMap = {
        psychometric: 5,
        big5: 5,
        disc: 5,
        cognitive: 8,
        situational: 3,
        professional: 3
      };
      return creditMap[this.category] || 5;
    }
  }
}, {
  timestamps: true
});

// Indexes
assessmentSchema.index({ organization: 1 });
assessmentSchema.index({ category: 1 });
assessmentSchema.index({ createdBy: 1 });
assessmentSchema.index({ isActive: 1, isPublished: 1 });
assessmentSchema.index({ title: 'text', description: 'text' });

// Pre-save middleware to update total questions count
assessmentSchema.pre('save', function(next) {
  if (this.isModified('questions')) {
    this.totalQuestions = this.questions.length;
  }
  next();
});

module.exports = mongoose.model('Assessment', assessmentSchema);
