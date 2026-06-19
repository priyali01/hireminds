const { z } = require('zod')

const createOrderSchema = z.object({
  plan: z.enum(['pro', 'campus'])
})

const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string()
})

module.exports = {
  createOrderSchema,
  verifyPaymentSchema
}
