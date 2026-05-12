const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Organization name is required'],
    trim: true
  },
  slug: {
    type: String,
    required: [true, 'Slug is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  subdomain: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true,
    sparse: true,
    match: [/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, 'Subdomain must contain only lowercase letters, numbers, and hyphens, and cannot start or end with a hyphen']
  },
  description: {
    type: String,
    default: ''
  },
  logo: {
    type: String,
    default: null
  },
  banner: {
    type: String,
    default: null
  },
  primaryColor: {
    type: String,
    default: '#6366f1'
  },
  secondaryColor: {
    type: String,
    default: '#8b5cf6'
  },
  brandingEnabled: {
    type: Boolean,
    default: false
  },
  publicProfileEnabled: {
    type: Boolean,
    default: false
  },
  moderatorName: {
    type: String,
    default: ''
  },
  publicProfile: {
    headline: { type: String, default: '' },
    about: { type: String, default: '' },
    bestHRPractices: { type: String, default: '' },
    awardsAccolades: { type: String, default: '' },
    website: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    location: { type: String, default: '' },
    industry: { type: String, default: '' },
    companySize: { type: String, default: '' },
    bestHRPracticesDocs: [{
      name: { type: String, required: true },
      url: { type: String, required: true },
      type: { type: String, required: true },
      size: { type: Number, required: true },
      uploadedAt: { type: Date, default: Date.now }
    }],
    awardsAccoladesDocs: [{
      name: { type: String, required: true },
      url: { type: String, required: true },
      type: { type: String, required: true },
      size: { type: Number, required: true },
      uploadedAt: { type: Date, default: Date.now }
    }]
  },
  credits: {
    total: { type: Number, default: 0 },
    used: { type: Number, default: 0 },
    locked: { type: Number, default: 0 },
    remaining: {
      type: Number,
      default: function() {
        return this.credits.total - this.credits.used - this.credits.locked;
      }
    },
    expiryDate: { type: Date, default: null },
    batches: [{
      amount: { type: Number, required: true },
      purchasedAt: { type: Date, default: Date.now },
      expiresAt: { type: Date, required: true },
      used: { type: Number, default: 0 }
    }],
    creditCost: {
      psychometric: { type: Number, default: 5 },
      personality: { type: Number, default: 5 },
      big5: { type: Number, default: 5 },
      disc: { type: Number, default: 5 },
      cognitive: { type: Number, default: 8 },
      aptitude: { type: Number, default: 3 },
      situational: { type: Number, default: 3 },
      professional: { type: Number, default: 3 }
    }
  },
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'basic', 'pro', 'enterprise'],
      default: 'free'
    },
    status: {
      type: String,
      enum: ['active', 'expired', 'pending', 'cancelled'],
      default: 'active'
    },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date, default: null },
    paymentMethod: {
      type: { type: String, enum: ['upi', 'bank_transfer', 'manual'], default: null },
      details: { type: String, default: '' }
    }
  },
  settings: {
    allowUserRegistration: { type: Boolean, default: false },
    requireApprovalForTests: { type: Boolean, default: false },
    defaultReportVisibility: { type: String, enum: ['private', 'shared', 'public'], default: 'private' }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

// Indexes
organizationSchema.index({ 'subscription.status': 1 });

// Pre-save middleware to auto-generate subdomain from slug if not set
organizationSchema.pre('save', function(next) {
  if (!this.subdomain && this.slug) {
    this.subdomain = this.slug;
  }
  next();
});

// Pre-save middleware to calculate remaining credits
organizationSchema.pre('save', function(next) {
  if (this.isModified('credits.total') || this.isModified('credits.used')) {
    this.credits.remaining = this.credits.total - this.credits.used;
  }
  next();
});

module.exports = mongoose.model('Organization', organizationSchema);
