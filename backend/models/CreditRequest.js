const mongoose = require('mongoose');

// Ensure dependent models are registered
require('./Organization');
require('./User');

const creditRequestSchema = new mongoose.Schema({
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    default: null  // null for individual user requests
  },
  requestedForUser: {
    // For individual (no-org) credit requests — points to the User
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  requestType: {
    type: String,
    enum: ['organization', 'individual'],
    default: 'organization'
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Requester is required']
  },
  creditsRequested: {
    type: Number,
    required: [true, 'Number of credits is required'],
    min: [1, 'Must request at least 1 credit']
  },
  reason: {
    type: String,
    required: [true, 'Reason is required']
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled', 'revoked'],
    default: 'pending'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  approvedAt: {
    type: Date,
    default: null
  },
  creditsGranted: {
    type: Number,
    default: 0
  },
  expiryDate: {
    type: Date,
    default: null
  },
  notes: {
    type: String,
    default: ''
  },
  adminNotes: {
    type: String,
    default: ''
  },
  paymentReference: {
    type: String,
    default: ''
  },
  paymentAmount: {
    type: Number,
    default: 0
  },
  paymentMethod: {
    type: String,
    enum: ['upi', 'bank_transfer', 'manual', 'none'],
    default: 'none'
  }
}, {
  timestamps: true
});

// Indexes
creditRequestSchema.index({ organization: 1 });
creditRequestSchema.index({ status: 1 });
creditRequestSchema.index({ requestedBy: 1 });
creditRequestSchema.index({ createdAt: -1 });

module.exports = mongoose.model('CreditRequest', creditRequestSchema);
