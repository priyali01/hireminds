const express = require('express')
const router = express.Router()
const { requireAuth } = require('../middleware/auth.middleware')
const { createOrder, verifyPayment, webhookHandler } = require('../controllers/payment.controller')

// Webhook doesn't require our JWT auth, it verifies the Razorpay signature
router.post('/webhook', webhookHandler)

// Require authentication for user actions
router.use(requireAuth)

// Checkout Flow
router.post('/create-order', createOrder)
router.post('/verify', verifyPayment)

module.exports = router
