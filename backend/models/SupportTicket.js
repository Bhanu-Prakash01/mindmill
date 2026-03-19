const mongoose = require('mongoose');

// Ensure dependent models are registered
require('./User');
require('./Organization');

const responseSchema = new mongoose.Schema({
  from: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: [true, 'Message is required']
  },
  attachments: [{
    type: String
  }],
  isInternal: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

const supportTicketSchema = new mongoose.Schema({
  ticketNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    default: null
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true
  },
  message: {
    type: String,
    required: [true, 'Message is required']
  },
  category: {
    type: String,
    enum: ['technical', 'billing', 'general', 'complaint', 'feature_request', 'assessment_issue'],
    default: 'general'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['open', 'in-progress', 'waiting', 'resolved', 'closed'],
    default: 'open'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  attachments: [{
    type: String
  }],
  responses: [responseSchema],
  resolution: {
    type: String,
    default: ''
  },
  resolvedAt: {
    type: Date,
    default: null
  },
  closedAt: {
    type: Date,
    default: null
  },
  satisfactionRating: {
    type: Number,
    min: 1,
    max: 5,
    default: null
  },
  satisfactionFeedback: {
    type: String,
    default: ''
  },
  tags: [{
    type: String,
    trim: true
  }],
  metadata: {
    browser: { type: String, default: '' },
    os: { type: String, default: '' },
    pageUrl: { type: String, default: '' },
    userAgent: { type: String, default: '' }
  }
}, {
  timestamps: true
});

// Indexes
supportTicketSchema.index({ user: 1 });
supportTicketSchema.index({ organization: 1 });
supportTicketSchema.index({ status: 1 });
supportTicketSchema.index({ priority: 1 });
supportTicketSchema.index({ category: 1 });
supportTicketSchema.index({ assignedTo: 1 });
supportTicketSchema.index({ createdAt: -1 });

// Generate ticket number with client code before saving
supportTicketSchema.pre('save', async function(next) {
  if (!this.ticketNumber) {
    const Organization = mongoose.model('Organization');
    
    let clientCode = 'GEN';
    let sequenceNumber = 1;
    
    if (this.organization) {
      const org = await Organization.findById(this.organization);
      if (org && org.slug) {
        clientCode = org.slug.toUpperCase().slice(0, 4);
      }
      
      // Get the last ticket number for this organization
      const lastTicket = await mongoose.model('SupportTicket').findOne({
        organization: this.organization
      }).sort({ createdAt: -1 });
      
      if (lastTicket && lastTicket.ticketNumber) {
        // Extract sequence number from last ticket (format: CODE-YYYYMM-0001)
        const parts = lastTicket.ticketNumber.split('-');
        if (parts.length >= 3) {
          const lastSequence = parseInt(parts[parts.length - 1]);
          if (!isNaN(lastSequence)) {
            sequenceNumber = lastSequence + 1;
          }
        }
      }
    } else {
      // For tickets without organization, use global sequence
      const count = await mongoose.model('SupportTicket').countDocuments({ organization: null });
      sequenceNumber = count + 1;
    }
    
    const yearMonth = new Date().toISOString().slice(0, 7).replace('-', '');
    this.ticketNumber = `${clientCode}-${yearMonth}-${String(sequenceNumber).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
