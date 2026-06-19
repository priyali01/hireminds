const express = require('express')
const router = express.Router()
const {
  upload,
  analyzeText,
  uploadAndAnalyze,
  getHistory,
  getResume,
  submitFeedback,
} = require('../controllers/resume.controller')
const { requireAuth } = require('../middleware/auth.middleware')

// All resume routes require authentication
router.use(requireAuth)

// POST /resumes/analyze — analyse raw text
router.post('/analyze', analyzeText)

// POST /resumes/upload-and-analyze — PDF upload
router.post('/upload-and-analyze', upload.single('resume'), uploadAndAnalyze)

// POST /resumes/feedback — thumbs up/down on AI result
router.post('/feedback', submitFeedback)

// GET /resumes/history — list of past analyses
router.get('/history', getHistory)

// GET /resumes/:id — single resume details
router.get('/:id', getResume)

module.exports = router
