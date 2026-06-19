const express = require('express')
const {
  createSession,
  submitAnswer,
  getHistory,
  getSession,
  completeSession,
  startDrive,
  submitDriveSection,
  completeDrive
} = require('../controllers/interview.controller')
const { requireAuth } = require('../middleware/auth.middleware')

const router = express.Router()

// All routes require authentication
router.use(requireAuth)

// Standard Interview Routes
router.post('/sessions', createSession)
router.get('/sessions', getHistory)
router.get('/sessions/:id', getSession)
router.post('/sessions/:id/answer', submitAnswer)
router.patch('/sessions/:id/complete', completeSession)

// Mock Placement Drive Routes
router.post('/drives', startDrive)
router.post('/drives/:id/section-answer', submitDriveSection)
router.patch('/drives/:id/complete', completeDrive)

module.exports = router
