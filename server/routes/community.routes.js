const express = require('express')
const router = express.Router()
const { requireAuth } = require('../middleware/auth.middleware')
const {
  getFeed,
  submitExperience,
  toggleUpvote,
  getPendingQueue,
  moderateExperience,
  requestReview,
  getOpenReviews,
  submitReview
} = require('../controllers/community.controller')

// Require auth for all community routes
router.use(requireAuth)

// Feed & Submissions
router.get('/experiences', getFeed)
router.post('/experiences', submitExperience)
router.post('/experiences/:id/upvote', toggleUpvote)

// Peer Resume Reviews
router.post('/reviews/request', requestReview)
router.get('/reviews/open', getOpenReviews)
router.post('/reviews/:id/submit', submitReview)

// Admin Middleware check
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Admin access required' })
  }
  next()
}

// Admin Moderation Queue
router.get('/admin/pending', requireAdmin, getPendingQueue)
router.patch('/admin/moderate/:id', requireAdmin, moderateExperience)

module.exports = router
