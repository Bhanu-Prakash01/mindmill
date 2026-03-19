const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Ensure Organization model is registered first
require('./Organization');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [3, 'Password must be at least 6 characters']
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  lastName: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    enum: ['superadmin', 'admin', 'user'],
    default: 'user'
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: null
  },
  assignedAssessments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assessment'
  }],
  avatar: {
    type: String,
    default: null
  },
  phoneCountryCode: {
    type: String,
    default: null
  },
  phone: {
    type: String,
    default: null
  },
  salutation: {
    type: String,
    default: null
  },
  jobTitle: {
    type: String,
    default: null
  },
  city: {
    type: String,
    default: null
  },
  company: {
    type: String,
    default: null
  },
  isEmailVerified: {
    type: Boolean,
    default: true // Assuming true for existing flow, or adjust based on actual email tracking
  },
  deactivationDate: {
    type: Date,
    default: null
  },
  deactivationReason: {
    type: String,
    enum: ['Separated', 'Disassociated', 'Sabbatical', null],
    default: null
  }
}, {
  timestamps: true
});

// Index for faster queries
userSchema.index({ organization: 1 });
userSchema.index({ role: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Get full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName}${this.lastName ? ' ' + this.lastName : ''}`;
});

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

module.exports = mongoose.model('User', userSchema);
