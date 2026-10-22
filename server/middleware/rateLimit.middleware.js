const rateLimit = require('express-rate-limit')

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 20, // Limit each IP to 20 requests per `window` (here, per 15 minutes)
  standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Jest reuses one process, so register calls from other suites exhaust this
  // in-memory window. Production and local dev keep the limit.
  skip: () => process.env.NODE_ENV === 'test',
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later.'
  }
})

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 500, // Limit each IP to 500 requests per `window`
  standardHeaders: 'draft-7',
  legacyHeaders: false,
})

module.exports = {
  authLimiter,
  globalLimiter
}
