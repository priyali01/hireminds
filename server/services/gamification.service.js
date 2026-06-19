const User = require('../models/user.model')
const logger = require('../utils/logger')

const POINT_VALUES = {
  RESUME_UPLOAD: 10,
  MOCK_INTERVIEW: 50,
  JOB_APPLICATION: 5,
  DAILY_LOGIN: 2,
  PEER_REVIEW: 25 // Points for helping others
}

const BADGES = {
  RESUME_MASTER: { id: 'resume_master', req: { type: 'resume_count', value: 5 } },
  INTERVIEW_READY: { id: 'interview_ready', req: { type: 'interview_count', value: 3 } },
  STREAK_7: { id: 'streak_7', req: { type: 'streak', value: 7 } }
}

/**
 * Awards points to a user, applying their current streak multiplier.
 * Multiplier logic: +10% for every day in streak, up to 2x max (10 days).
 */
async function awardPoints(userId, actionKey) {
  try {
    const basePoints = POINT_VALUES[actionKey] || 0
    if (basePoints === 0) return

    const user = await User.findById(userId)
    if (!user) return

    let multiplier = 1 + (user.currentStreak * 0.1)
    if (multiplier > 2) multiplier = 2

    const finalPoints = Math.floor(basePoints * multiplier)

    user.points += finalPoints
    await user.save()

    logger.info(`Awarded ${finalPoints} points to user ${userId} for ${actionKey}`)
    
    // Check for point-based badges here if necessary
  } catch (err) {
    logger.error(`Failed to award points for ${actionKey}:`, err.message)
  }
}

/**
 * Checks and awards badges based on specific trigger events
 */
async function checkAndAwardBadge(userId, badgeKey) {
  try {
    const badge = BADGES[badgeKey]
    if (!badge) return

    const user = await User.findById(userId)
    if (!user || user.badges.includes(badge.id)) return // Already has it

    user.badges.push(badge.id)
    await user.save()

    logger.info(`User ${userId} earned badge: ${badge.id}`)
  } catch (err) {
    logger.error(`Failed to award badge ${badgeKey}:`, err.message)
  }
}

module.exports = {
  POINT_VALUES,
  BADGES,
  awardPoints,
  checkAndAwardBadge
}
