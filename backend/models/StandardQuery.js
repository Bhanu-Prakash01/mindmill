const mongoose = require('mongoose');

const standardQuerySchema = new mongoose.Schema({
  label: {
    type: String,
    required: [true, 'Label is required'],
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

standardQuerySchema.index({ isActive: 1, order: 1 });

module.exports = mongoose.model('StandardQuery', standardQuerySchema);
