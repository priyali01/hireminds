const express = require('express')
const router = express.Router()
const { requireAuth } = require('../middleware/auth.middleware')
const { createOrder } = require('../controllers/payment.controller')

// Require authentication
router.use(requireAuth)

// Create an order
router.post('/create-order', createOrder)

module.exports = router
