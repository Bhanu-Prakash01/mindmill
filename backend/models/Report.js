const mongoose = require('mongoose');

// Ensure dependent models are registered
require('./Attempt');
require('./User');
require('./Assessment');
require('./Organization');
require('./Question');

const categoryScoreSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true
  },
  score: {
    type: Number,
    default: 0
  },
  maxScore: {
    type: Number,
    default: 0
  },
  percentage: {
    type: Number,
    default: 0
  },
  interpretation: {
    type: String,
    default: ''
  }
}, { _id: true });

const shareRecordSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true
  },
  sharedAt: {
    type: Date,
    default: Date.now
  },
  accessToken: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    default: null
  },
  viewedAt: {
    type: Date,
    default: null
  }
}, { _id: true });

const reportSchema = new mongoose.Schema({
  attempt: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Attempt',
    required: [true, 'Attempt is required']
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  // Member/admin who conducted the assessment
  conductedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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
  type: {
    type: String,
    enum: ['psychometric', 'standard', 'cognitive', 'situational', 'disc', 'big5'],
    required: [true, 'Report type is required']
  },
  // Test taker details (from invite or user account)
  testTakerName: {
    type: String,
    default: null
  },
  testTakerEmail: {
    type: String,
    default: null
  },
  testTakerPhone: {
    type: String,
    default: null
  },
  generatedAt: {
    type: Date,
    default: Date.now
  },
  // Standard scores
  scores: {
    total: { type: Number, default: 0 },
    maxScore: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    percentile: { type: Number, default: 0 },
    byCategory: [categoryScoreSchema]
  },
  // For psychometric reports
  dimensions: {
    DISC: {
      D: { 
        rawScore: { type: Number, default: 0 },
        score: { type: Number, default: 0 },
        percentage: { type: Number, default: 0 }
      },
      I: { 
        rawScore: { type: Number, default: 0 },
        score: { type: Number, default: 0 },
        percentage: { type: Number, default: 0 }
      },
      S: { 
        rawScore: { type: Number, default: 0 },
        score: { type: Number, default: 0 },
        percentage: { type: Number, default: 0 }
      },
      C: { 
        rawScore: { type: Number, default: 0 },
        score: { type: Number, default: 0 },
        percentage: { type: Number, default: 0 }
      },
      dominant: { type: String, default: '' },
      secondary: { type: String, default: '' },
      pattern: { type: String, default: '' }
    },
    MBTI: {
      EI: { type: Number, default: 50 },
      SN: { type: Number, default: 50 },
      TF: { type: Number, default: 50 },
      JP: { type: Number, default: 50 },
      type: { type: String, default: '' }
    },
    BigFive: {
      openness: { type: Number, default: 0 },
      conscientiousness: { type: Number, default: 0 },
      extraversion: { type: Number, default: 0 },
      agreeableness: { type: Number, default: 0 },
      neuroticism: { type: Number, default: 0 }
    },
    dominantTraits: [{
      type: String
    }],
    personalityProfile: {
      type: String,
      default: ''
    }
  },
  // Analysis
  analysis: {
    summary: { type: String, default: '' },
    strengths: [{ type: String }],
    developmentAreas: [{ type: String }],
    recommendations: [{ type: String }],
    careerSuggestions: [{ type: String }],
    workStyle: { type: mongoose.Schema.Types.Mixed, default: '' },
    teamFit: { type: mongoose.Schema.Types.Mixed, default: '' },
    leadershipStyle: { type: mongoose.Schema.Types.Mixed, default: '' }
  },
  // Detailed breakdown
  questionAnalysis: [{
    question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
    userAnswer: mongoose.Schema.Types.Mixed,
    correctAnswer: mongoose.Schema.Types.Mixed,
    isCorrect: { type: Boolean, default: false },
    timeSpent: { type: Number, default: 0 },
    difficulty: { type: String, default: '' }
  }],
  // Sharing
  sharedWith: [shareRecordSchema],
  isPublic: {
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
  // PDF generation
  pdfUrl: {
    type: String,
    default: null
  },
  pdfGeneratedAt: {
    type: Date,
    default: null
  },
  // Versioning
  version: {
    type: Number,
    default: 1
  },
  isLatest: {
    type: Boolean,
    default: true
  },
  // Admin controls
  visibleToUser: {
    type: Boolean,
    default: true
  },
  adminNotes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Indexes
reportSchema.index({ user: 1 });
reportSchema.index({ assessment: 1 });
reportSchema.index({ organization: 1 });
reportSchema.index({ attempt: 1 });
reportSchema.index({ publicAccessToken: 1 });
reportSchema.index({ generatedAt: -1 });

module.exports = mongoose.model('Report', reportSchema);
