const express = require('express')
const router = express.Router()
const { getNews, getEvents, triggerNewsFetch } = require('../controllers/dashboard.controller')
const { requireAuth } = require('../middleware/auth.middleware')

router.use(requireAuth)

router.get('/news', getNews)
router.post('/news/fetch', triggerNewsFetch) // Manual trigger
router.get('/events', getEvents)

module.exports = router
