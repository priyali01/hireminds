const express = require('express')
const router = express.Router()
const { getJobs, createJob, updateJobStatus, deleteJob, matchJD, getJobInsight } = require('../controllers/job.controller')
const { requireAuth } = require('../middleware/auth.middleware')
const { checkQuota } = require('../middleware/quota.middleware')

router.use(requireAuth)

// Application Tracker (Kanban)
router.get('/', getJobs)
router.post('/', createJob)
router.patch('/:id/status', updateJobStatus)
router.delete('/:id', deleteJob)

// AI Tools
router.post('/match', checkQuota, matchJD)
router.get('/insight', getJobInsight)

module.exports = router
