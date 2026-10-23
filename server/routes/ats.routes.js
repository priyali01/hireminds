const express = require('express')
const {
  uploadResume,
  createAssessment,
  listAssessments,
  getAssessment,
  getGate,
  advance,
} = require('../controllers/assessment.controller')

const router = express.Router()

router.post('/assess', uploadResume, createAssessment)
router.get('/assessments', listAssessments)
router.get('/gate', getGate)
router.post('/advance', advance)
router.get('/assessments/:id', getAssessment)

module.exports = router
