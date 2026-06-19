const User = require('../models/user.model')

/**
 * Middleware to lazily reset daily/weekly quotas if the reset period has passed.
 */
async function enforceQuotasLazily(req, res, next) {
  if (!req.user) return next()

  try {
    const user = await User.findById(req.user.userId)
    if (!user) return next()

    const now = new Date()
    const lastReset = user.lastQuotaReset

    if (!lastReset) {
      user.lastQuotaReset = now
      await user.save()
      return next()
    }

    // Reset daily quotas if it's a new day
    const isNewDay = lastReset.getDate() !== now.getDate() || 
                     lastReset.getMonth() !== now.getMonth() || 
                     lastReset.getFullYear() !== now.getFullYear()

    // Reset weekly quotas if it's been more than 7 days, or a new week started (simplified to 7 day rolling for MVP)
    const diffTime = Math.abs(now - lastReset)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    let needsSave = false

    if (isNewDay) {
      user.aiUsageToday = 0
      needsSave = true
    }

    if (diffDays >= 7) {
      user.interviewsThisWeek = 0
      needsSave = true
    }

    if (needsSave) {
      user.lastQuotaReset = now
      await user.save()
    }

    next()
  } catch (err) {
    next() // Fail silently for quota check
  }
}

module.exports = {
  enforceQuotasLazily
}
