const razorpay = require('../config/razorpay')
const Payment = require('../models/payment.model')
const User = require('../models/user.model')
const { createOrderSchema } = require('../validators/payment.validators')
const { NotFoundError, ValidationError } = require('../utils/errors')

// Define pricing (in paise for Razorpay)
const PRICING = {
  pro: 99900, // ₹999.00
  campus: 999900 // ₹9999.00
}

/**
 * POST /payments/create-order
 * Initiates a new Razorpay order
 */
async function createOrder(req, res, next) {
  try {
    const { plan } = createOrderSchema.parse(req.body)
    
    // Check if user already has this plan
    const user = await User.findById(req.user.userId)
    if (user.plan === plan) {
      throw new ValidationError(`You are already subscribed to the ${plan} plan.`)
    }

    const amount = PRICING[plan]
    if (!amount) throw new ValidationError('Invalid plan selection')

    // Create order with Razorpay
    const options = {
      amount,
      currency: 'INR',
      receipt: `receipt_${req.user.userId}_${Date.now()}`,
      notes: {
        userId: req.user.userId,
        plan
      }
    }

    const order = await razorpay.orders.create(options)

    // Save intended transaction in DB
    const payment = await Payment.create({
      userId: req.user.userId,
      razorpayOrderId: order.id,
      amount,
      planPurchased: plan,
      status: 'created'
    })

    // Return order details to client so they can open checkout modal
    res.status(201).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID // Safe to expose public key
    })
  } catch (err) {
    next(err)
  }
}

module.exports = {
  createOrder
}
