const express = require('express')
const router = express.Router()
const { getGlobalLeaderboard, getCampusLeaderboard } = require('../controllers/leaderboard.controller')
const { requireAuth } = require('../middleware/auth.middleware')

router.use(requireAuth)

router.get('/', getGlobalLeaderboard)
router.get('/campus', getCampusLeaderboard)

module.exports = router
