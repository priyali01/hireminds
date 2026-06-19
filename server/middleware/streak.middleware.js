const User = require('../models/user.model')
const { awardPoints } = require('../services/gamification.service')

/**
 * Middleware that tracks daily activity.
 * Should be placed after authentication.
 */
async function trackDailyStreak(req, res, next) {
  if (!req.user) return next()

  try {
    const user = await User.findById(req.user.userId)
    if (!user) return next()

    const now = new Date()
    const lastActive = user.lastActiveDate

    if (!lastActive) {
      // First time active
      user.lastActiveDate = now
      user.currentStreak = 1
      user.longestStreak = 1
      await user.save()
      
      // Award login points without waiting
      awardPoints(user._id, 'DAILY_LOGIN')
      return next()
    }

    // Reset dates to midnight to compare just the days
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const lastDate = new Date(lastActive.getFullYear(), lastActive.getMonth(), lastActive.getDate())

    const diffTime = Math.abs(today - lastDate)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) {
      // Consecutive day
      user.currentStreak += 1
      if (user.currentStreak > user.longestStreak) {
        user.longestStreak = user.currentStreak
      }
      user.lastActiveDate = now
      await user.save()
      
      awardPoints(user._id, 'DAILY_LOGIN')
    } else if (diffDays > 1) {
      // Streak broken
      user.currentStreak = 1
      user.lastActiveDate = now
      await user.save()
      
      awardPoints(user._id, 'DAILY_LOGIN')
    }
    // If diffDays === 0, they already logged in today, do nothing.

    next()
  } catch (err) {
    // Fail silently so we don't break the app just because gamification failed
    next()
  }
}

module.exports = {
  trackDailyStreak
}
