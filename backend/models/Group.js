const mongoose = require('mongoose');

// Ensure dependent models are registered
require('./Organization');
require('./User');

const contactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Contact name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Contact email is required'],
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    default: ''
  }
}, { _id: true });

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Group name is required'],
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  icon: {
    type: String,
    default: ''
  },
  groupType: {
    type: String,
    enum: ['team', 'contacts'],
    default: 'team'
    // 'team' = admin manages org members (existing behavior)
    // 'contacts' = member manages test taker contacts
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
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // Contact list for 'contacts' type groups (test takers)
  contacts: [contactSchema],
  moderator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
groupSchema.index({ organization: 1 });
groupSchema.index({ createdBy: 1 });
groupSchema.index({ members: 1 });
groupSchema.index({ groupType: 1, createdBy: 1 });

module.exports = mongoose.model('Group', groupSchema);
