const User = require('../models/user.model')
const Interview = require('../models/interview.model')

/**
 * GET /tpo/dashboard
 * Fetches aggregate metrics for all students belonging to the TPO's college.
 */
async function getTPODashboardStats(req, res, next) {
  try {
    const tpo = await User.findById(req.user.userId)
    
    if (!tpo.college) {
      return res.status(400).json({ success: false, error: 'TPO profile must have a college specified to view analytics.' })
    }

    const collegeName = tpo.college

    // Fetch all students from this college
    const students = await User.find({ college: collegeName, role: 'user' }).select('fullName email points currentStreak badges')
    
    const studentIds = students.map(s => s._id)

    // Aggregate Interview stats for these students
    const completedInterviews = await Interview.countDocuments({
      userId: { $in: studentIds },
      status: 'completed'
    })

    const totalPoints = students.reduce((sum, student) => sum + student.points, 0)
    
    // Find top performers
    const topPerformers = [...students]
      .sort((a, b) => b.points - a.points)
      .slice(0, 5)

    res.json({
      success: true,
      college: collegeName,
      metrics: {
        totalStudents: students.length,
        totalPoints,
        totalMockInterviews: completedInterviews,
        averagePoints: students.length ? Math.round(totalPoints / students.length) : 0
      },
      topPerformers
    })
  } catch (err) {
    next(err)
  }
}

module.exports = {
  getTPODashboardStats
}
