const mongoose = require('mongoose')

const jobApplicationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
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
  location: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['saved', 'applied', 'interview', 'offer', 'rejected'],
    default: 'saved'
  },
  url: {
    type: String,
    trim: true
  },
  salary: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  appliedDate: {
    type: Date
  },
  // If matched via JD Matcher
  matchScore: {
    type: Number,
    min: 0,
    max: 100
  }
}, {
  timestamps: true
})

// Index for efficiently fetching a user's jobs by status
jobApplicationSchema.index({ userId: 1, status: 1 })

module.exports = mongoose.model('JobApplication', jobApplicationSchema)
