const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: {
      values: ['video', 'pdf', 'image', 'link'],
      message: '{VALUE} is not a valid resource type'
    },
    required: [true, 'Resource type is required']
  },
  videoUrl: {
    type: String,
    trim: true
  },
  linkUrl: {
    type: String,
    trim: true
  },
  fileUrl: {
    type: String,
    trim: true
  },
  publicId: {
    type: String,
    trim: true
  },
  thumbnail: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
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
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
resourceSchema.index({ tags: 1 });
resourceSchema.index({ createdAt: -1 });

// Conditional validation: ensure at least one content field based on type
resourceSchema.pre('validate', function(next) {
  if (this.type === 'video' && !this.videoUrl) {
    this.invalidate('videoUrl', 'Video URL is required for video resources');
  }
  if (this.type === 'link' && !this.linkUrl) {
    this.invalidate('linkUrl', 'External URL is required for link resources');
  }
  if ((this.type === 'pdf' || this.type === 'image') && !this.fileUrl) {
    this.invalidate('fileUrl', 'File URL is required for uploaded resources');
  }
  next();
});

module.exports = mongoose.model('Resource', resourceSchema);
