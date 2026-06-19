const User = require('../models/user.model')
const { NotFoundError } = require('../utils/errors')

/**
 * GET /leaderboard
 * Fetch the top 100 users globally based on points.
 * Also returns the current user's rank.
 */
async function getGlobalLeaderboard(req, res, next) {
  try {
    const limit = 100

    // Fetch top 100 users sorted by points (descending)
    const topUsers = await User.find({})
      .sort({ points: -1 })
      .limit(limit)
      .select('fullName level points currentStreak badges') // Only safe fields

    // Calculate current user's rank
    const currentUser = await User.findById(req.user.userId)
    if (!currentUser) throw new NotFoundError('User')

    // Count how many users have strictly more points
    const higherRankCount = await User.countDocuments({ points: { $gt: currentUser.points } })
    const userRank = higherRankCount + 1

    res.json({
      success: true,
      leaderboard: topUsers,
      userStats: {
        rank: userRank,
        points: currentUser.points,
        streak: currentUser.currentStreak,
        badges: currentUser.badges
      }
    })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /leaderboard/campus
 * Fetch leaderboard restricted to users from the same college/university.
 */
async function getCampusLeaderboard(req, res, next) {
  try {
    const currentUser = await User.findById(req.user.userId)
    if (!currentUser) throw new NotFoundError('User')

    const userCollege = currentUser.college
    if (!userCollege) {
      return res.json({
        success: true,
        message: 'No college specified in profile',
        leaderboard: [],
        userStats: {
          rank: null,
          points: currentUser.points
        }
      })
    }

    const campusUsers = await User.find({ college: userCollege })
      .sort({ points: -1 })
      .limit(100)
      .select('fullName level points currentStreak badges')

    const higherRankCount = await User.countDocuments({ 
      college: userCollege, 
      points: { $gt: currentUser.points } 
    })
    const userRank = higherRankCount + 1

    res.json({
      success: true,
      college: userCollege,
      leaderboard: campusUsers,
      userStats: {
        rank: userRank,
        points: currentUser.points,
        streak: currentUser.currentStreak,
        badges: currentUser.badges
      }
    })
  } catch (err) {
    next(err)
  }
}

module.exports = {
  getGlobalLeaderboard,
  getCampusLeaderboard
}
