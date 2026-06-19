const crypto = require('crypto')
const razorpay = require('../config/razorpay')
const Payment = require('../models/payment.model')
const User = require('../models/user.model')
const { createOrderSchema, verifyPaymentSchema } = require('../validators/payment.validators')
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

/**
 * POST /payments/verify
 * Cryptographically verifies the Razorpay signature and provisions the plan
 */
async function verifyPayment(req, res, next) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = verifyPaymentSchema.parse(req.body)

    // 1. Verify cryptographic signature
    const body = razorpay_order_id + "|" + razorpay_payment_id
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex')

    const isAuthentic = expectedSignature === razorpay_signature

    if (!isAuthentic) {
      throw new ValidationError('Payment verification failed. Invalid signature.')
    }

    // 2. Fetch the corresponding payment record
    const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id })
    if (!payment) {
      throw new NotFoundError('Payment Record')
    }

    // Prevent double processing
    if (payment.status === 'captured') {
      return res.json({ success: true, message: 'Payment already processed.' })
    }

    // 3. Update Payment record
    payment.status = 'captured'
    payment.razorpayPaymentId = razorpay_payment_id
    payment.razorpaySignature = razorpay_signature
    await payment.save()

    // 4. Provision the plan to the User
    const user = await User.findById(payment.userId)
    user.plan = payment.planPurchased
    // If it's a campus plan, we might also assign them TPO role implicitly
    if (payment.planPurchased === 'campus' && user.role !== 'admin') {
      user.role = 'tpo'
    }
    
    // Set expiry 30 days from now
    const expiry = new Date()
    expiry.setDate(expiry.getDate() + 30)
    user.planExpiresAt = expiry

    await user.save()

    res.json({ 
      success: true, 
      message: 'Payment verified successfully. Plan updated.',
      plan: user.plan
    })

  } catch (err) {
    next(err)
  }
}

/**
 * POST /payments/webhook
 * Handles asynchronous Razorpay events (e.g. subscription renewals, failures)
 * Note: Must be raw body or use express.json() depending on Razorpay setup. 
 * We assume standard express.json() here for simplicity, but Razorpay signature requires raw body string matching.
 */
async function webhookHandler(req, res, next) {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET
    
    // Verify signature
    const shasum = crypto.createHmac('sha256', secret)
    shasum.update(JSON.stringify(req.body)) // In production, use req.rawBody
    const digest = shasum.digest('hex')

    if (digest !== req.headers['x-razorpay-signature']) {
      return res.status(400).json({ error: 'Invalid webhook signature' })
    }

    // Process event
    const event = req.body.event
    if (event === 'payment.failed') {
      const orderId = req.body.payload.payment.entity.order_id
      await Payment.findOneAndUpdate({ razorpayOrderId: orderId }, { status: 'failed' })
    }

    res.status(200).json({ status: 'ok' })
  } catch (err) {
    console.error('Webhook Error:', err)
    res.status(500).json({ error: 'Webhook processing failed' })
  }
}

module.exports = {
  createOrder,
  verifyPayment,
  webhookHandler
}
