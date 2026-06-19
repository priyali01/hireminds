const mongoose = require('mongoose')

const jobInsightSchema = new mongoose.Schema({
  // Hash of the role name or JD to identify cached queries quickly
  queryHash: {
    type: String,
    required: true,
    index: true,
    unique: true
  },
  role: {
    type: String,
    required: true
  },
  requiredSkills: [{
    type: String
  }],
  salaryTrends: {
    min: String,
    max: String,
    median: String
  },
  interviewProcess: [{
    type: String
  }],
  topCompanies: [{
    type: String
  }],
  growthOutlook: {
    type: String
  },
  // Auto-expire after 24 hours (TTL index)
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000)
  }
}, {
  timestamps: true
})

// TTL Index - MongoDB will automatically delete documents where expiresAt is older than current time
jobInsightSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

module.exports = mongoose.model('JobInsight', jobInsightSchema)
