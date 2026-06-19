const express = require('express')
const router = express.Router()
const { requireAuth } = require('../middleware/auth.middleware')
const { getTPODashboardStats } = require('../controllers/tpo.controller')

router.use(requireAuth)

// Middleware to ensure user is a TPO
const requireTPO = (req, res, next) => {
  if (req.user.role !== 'tpo' && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Access denied. TPO role required.' })
  }
  next()
}

router.get('/dashboard', requireTPO, getTPODashboardStats)

module.exports = router
