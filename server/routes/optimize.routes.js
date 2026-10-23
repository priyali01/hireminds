const express = require('express')
const { optimizeLimiter } = require('../middleware/rateLimit.middleware')
const {
  loadGitHub,
  startGitHubConnect,
  githubStatus,
  githubRepos,
  githubDisconnect,
  createDraft,
  getDraft,
  reviewChange,
  rescoreDraft,
  exportDraft,
} = require('../controllers/optimize.controller')

const router = express.Router()

router.post('/github/connect', optimizeLimiter, startGitHubConnect)
router.get('/github/status', githubStatus)
router.get('/github/repos', githubRepos)
router.delete('/github', githubDisconnect)
router.post('/github', optimizeLimiter, loadGitHub)
router.post('/drafts', optimizeLimiter, createDraft)
router.get('/drafts/:id', getDraft)
router.patch('/drafts/:id/changes/:changeId', reviewChange)
router.post('/drafts/:id/rescore', rescoreDraft)
router.get('/drafts/:id/export', exportDraft)

module.exports = router
