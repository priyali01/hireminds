const mongoose = require('mongoose')

const paymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  razorpayOrderId: {
    type: String,
    required: true,
    unique: true
  },
  razorpayPaymentId: {
    type: String
  },
  razorpaySignature: {
    type: String
  },
  amount: {
    type: Number, // in paise (e.g. 9900 for INR 99.00)
    required: true
  },
  currency: {
    type: String,
    default: 'INR'
  },
  status: {
    type: String,
    enum: ['created', 'captured', 'failed', 'refunded'],
    default: 'created'
  },
  planPurchased: {
    type: String,
    enum: ['pro', 'campus'],
    required: true
  }
}, {
  timestamps: true
})

paymentSchema.index({ userId: 1, status: 1 })
paymentSchema.index({ razorpayOrderId: 1 })

const Payment = mongoose.model('Payment', paymentSchema)
module.exports = Payment
