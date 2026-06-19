const mongoose = require('mongoose')

const reviewRequestSchema = new mongoose.Schema({
  requesterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  resumeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume',
    required: true
  },
  targetRole: {
    type: String,
    required: true
  },
  level: {
    type: String, // 'fresher', 'junior', 'mid', 'senior'
    required: true
  },
  status: {
    type: String,
    enum: ['open', 'in_review', 'completed'],
    default: 'open'
  },
  reviewerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  feedback: {
    overallRating: { type: Number, min: 1, max: 5 },
    comments: { type: String },
    sectionFeedback: [{
      section: { type: String },
      comment: { type: String }
    }]
  },
  completedAt: {
    type: Date
  }
}, {
  timestamps: true
})

reviewRequestSchema.index({ status: 1, targetRole: 1 })
reviewRequestSchema.index({ requesterId: 1 })

const ReviewRequest = mongoose.model('ReviewRequest', reviewRequestSchema)
module.exports = ReviewRequest
