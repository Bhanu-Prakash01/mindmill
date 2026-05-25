const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Ensure Organization model is registered first
require('./Organization');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
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
  accountType: {
    type: String,
    enum: ['organization', 'individual'],
    default: 'organization'
  },
  // Free trial tracking
  freeTrialUsed: {
    type: Boolean,
    default: false
  },
  freeTrialAssessmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assessment',
    default: null
  },
  freeTrialAttemptId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Attempt',
    default: null
  },
  // Personal credits wallet (for individual accountType users only)
  personalCredits: {
    total: { type: Number, default: 0 },
    used: { type: Number, default: 0 }
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
  emailVerificationOtp: {
    type: String,
    default: null
  },
  emailVerificationOtpExpire: {
    type: Date,
    default: null
  },
  deactivationDate: {
    type: Date,
    default: null
  },
  deactivationReason: {
    type: String,
    enum: ['Separated', 'Disassociated', 'Sabbatical', null],
    default: null
  },
  isCoordinator: {
    type: Boolean,
    default: false
  },
  resetPasswordToken: {
    type: String,
    default: null
  },
  resetPasswordExpire: {
    type: Date,
    default: null
  },
  // Registration source
  registeredAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index for faster queries
userSchema.index({ organization: 1 });
userSchema.index({ role: 1 });
// Compound unique index: email must be unique within an organization
// Superadmin users (organization: null) have globally unique emails
userSchema.index({ email: 1, organization: 1 }, { unique: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  console.log('[pre-save] Password modified for:', this.email);
  console.log('[pre-save] Raw password length:', this.password?.length);
  console.log('[pre-save] Already a bcrypt hash?', this.password?.startsWith('$2'));

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    console.log('[pre-save] Hashed password (first 20):', this.password?.substring(0, 20));
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  console.log('[comparePassword] Email:', this.email);
  console.log('[comparePassword] Candidate password length:', candidatePassword?.length);
  console.log('[comparePassword] Stored hash (first 20):', this.password?.substring(0, 20));
  console.log('[comparePassword] Stored hash starts with $2 (valid bcrypt)?', this.password?.startsWith('$2'));
  const result = await bcrypt.compare(candidatePassword, this.password);
  console.log('[comparePassword] Match result:', result);
  return result;
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
