const mongoose = require('mongoose');

// Ensure Assessment model is registered
require('./Assessment');

const optionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: [true, 'Option text is required']
  },
  image: {
    type: String,
    default: null
  },
  isCorrect: {
    type: Boolean,
    default: false
  },
  score: {
    type: Number,
    default: 0
  },
  order: {
    type: Number,
    default: 0
  }
}, { _id: true });

// Schema for DISC statements (each question has 4 statements with traits)
const statementSchema = new mongoose.Schema({
  text: {
    type: String,
    required: [true, 'Statement text is required']
  },
  trait: {
    type: String,
    enum: ['D', 'I', 'S', 'C'],
    required: [true, 'Trait is required for DISC statements']
  },
  score: {
    type: Number,
    default: 4
  }
}, { _id: false });

const questionSchema = new mongoose.Schema({
  assessment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assessment',
    required: [true, 'Assessment is required']
  },
  type: {
    type: String,
    enum: ['mcq', 'text', 'image', 'graphic', 'rating', 'matrix', 'disc-ranking'],
    required: [true, 'Question type is required']
  },
  questionText: {
    type: String,
    required: [true, 'Question text is required']
  },
  questionImage: {
    type: String,
    default: null
  },
  options: [optionSchema],
  // For DISC assessment statements
  statements: [statementSchema],
  difficulty: {
    type: String,
    enum: ['basic', 'moderate', 'tough'],
    default: 'moderate'
  },
  category: {
    type: String,
    default: ''
  },
  subCategory: {
    type: String,
    default: ''
  },
  // For psychometric assessments
  dimension: {
    type: String,
    default: ''
  },
  trait: {
    type: String,
    default: ''
  },
  order: {
    type: Number,
    required: [true, 'Order is required']
  },
  marks: {
    type: Number,
    default: 1
  },
  negativeMarks: {
    type: Number,
    default: 0
  },
  timeLimit: {
    type: Number,
    default: 0
  },
  isRequired: {
    type: Boolean,
    default: true
  },
  explanation: {
    type: String,
    default: ''
  },
  tags: [{
    type: String,
    trim: true
  }],
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes
questionSchema.index({ assessment: 1 });
questionSchema.index({ assessment: 1, order: 1 });
questionSchema.index({ type: 1 });
questionSchema.index({ category: 1 });
questionSchema.index({ dimension: 1 });

module.exports = mongoose.model('Question', questionSchema);
