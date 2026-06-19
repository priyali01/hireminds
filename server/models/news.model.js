const mongoose = require('mongoose')

const newsArticleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  link: {
    type: String,
    required: true,
    unique: true
  },
  source: String,
  snippet: String,
  date: String,
  thumbnail: String,
  
  // AI-generated tags (e.g., "Software Engineering", "Hiring", "AI", "Startup")
  tags: [{
    type: String
  }],
  
  // Auto-expire after 24 hours (TTL index)
  // We refresh every 6 hours, but keep articles for 24h
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000)
  }
}, {
  timestamps: true
})

// TTL Index
newsArticleSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

// Index for tag-based personalized fetching
newsArticleSchema.index({ tags: 1 })

module.exports = mongoose.model('NewsArticle', newsArticleSchema)
