const mongoose = require('mongoose')

const experienceSchema = new mongoose.Schema({
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  company: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    required: true,
    trim: true
  },
  outcome: {
    type: String,
    enum: ['offer', 'rejected', 'ghosted', 'awaiting'],
    required: true
  },
  dateOfInterview: {
    type: Date,
    required: true
  },
  content: {
    type: String, // Full write-up
    required: true
  },
  questionsAsked: [{
    type: String
  }],
  isAnonymous: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending' // Moderation queue
  },
  upvotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  verifiedBadge: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
})

// Indexes for fast feed queries
experienceSchema.index({ status: 1, createdAt: -1 })
experienceSchema.index({ company: 1, status: 1 })
experienceSchema.index({ role: 1, status: 1 })

const Experience = mongoose.model('Experience', experienceSchema)
module.exports = Experience
