const express = require('express')
const router = express.Router()
const { requireAuth } = require('../middleware/auth.middleware')
const { handleChat } = require('../controllers/chat.controller')

router.use(requireAuth)
router.post('/', handleChat)

module.exports = router
