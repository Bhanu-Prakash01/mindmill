const mongoose = require('mongoose');
const crypto = require('crypto');

const testTakerInviteSchema = new mongoose.Schema({
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
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Inviter is required']
  },
  testTakerName: {
    type: String,
    required: [true, 'Test taker name is required'],
    trim: true
  },
  testTakerEmail: {
    type: String,
    required: [true, 'Test taker email is required'],
    lowercase: true,
    trim: true
  },
  testTakerPhone: {
    type: String,
    required: [true, 'Test taker phone is required'],
    trim: true
  },
  token: {
    type: String,
    unique: true,
    required: true,
    default: () => crypto.randomBytes(32).toString('hex')
  },
  status: {
    type: String,
    enum: ['pending', 'email_sent', 'started', 'completed', 'expired'],
    default: 'pending'
  },
  attempt: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Attempt',
    default: null
  },
  emailSentAt: {
    type: Date,
    default: null
  },
  expiresAt: {
    type: Date,
    default: function() {
      const date = new Date();
      date.setDate(date.getDate() + 30);
      return date;
    }
  },
  creditConsumed: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

testTakerInviteSchema.index({ organization: 1 });
testTakerInviteSchema.index({ invitedBy: 1 });
testTakerInviteSchema.index({ assessment: 1 });
testTakerInviteSchema.index({ status: 1 });
testTakerInviteSchema.index({ testTakerEmail: 1, assessment: 1 });

module.exports = mongoose.model('TestTakerInvite', testTakerInviteSchema);
