const User = require('../models/user.model')
const GitHubConnection = require('../models/githubConnection.model')
const GitHubConnectState = require('../models/githubConnectState.model')
const OptimizerDraft = require('../models/optimizerDraft.model')
const { AppError } = require('../utils/errors')

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const CAREER_STAGES = {
  fresher: 'fresher',
  student: 'fresher',
  junior: 'intermediate',
  intermediate: 'intermediate',
  mid: 'experienced',
  senior: 'experienced',
  experienced: 'experienced',
}

function cleanList(values, limit) {
  if (!Array.isArray(values)) return null
  return values.map((item) => String(item || '').trim()).filter(Boolean).slice(0, limit)
}

exports.updateProfile = async (req, res, next) => {
  try {
    const { fullName, level, targetRoles, skills, college, branch, graduationYear } = req.body
    const userId = req.user.userId || req.user.id

    const user = await User.findById(userId)
    if (!user) {
      return next(new AppError('User not found', 404))
    }

    if (fullName !== undefined) user.fullName = String(fullName).trim()
    if (level !== undefined) {
      const stage = CAREER_STAGES[String(level).toLowerCase()]
      if (!stage) return next(new AppError('Level must be fresher, intermediate, or experienced', 422))
      user.level = stage
    }
    if (targetRoles !== undefined) {
      const roles = cleanList(targetRoles, 5)
      if (!roles) return next(new AppError('Target roles must be a list', 422))
      user.targetRoles = roles
    }
    if (skills !== undefined) {
      const listed = cleanList(skills, 20)
      if (!listed) return next(new AppError('Skills must be a list', 422))
      user.skills = listed
    }
    if (college !== undefined) user.college = String(college).trim() || null
    if (branch !== undefined) user.branch = String(branch).trim() || null
    if (graduationYear !== undefined && graduationYear !== '') {
      const year = Number(graduationYear)
      if (!Number.isInteger(year) || year < 2000 || year > 2035) {
        return next(new AppError('Invalid graduation year', 422))
      }
      user.graduationYear = year
    }

    await user.save()

    res.status(200).json({
      success: true,
      user: user.toPublicProfile()
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Change user password
// @route   POST /api/users/change-password
// @access  Private
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      return next(new AppError('Please provide current and new password', 400))
    }

    if (newPassword.length < 8) {
      return next(new AppError('New password must be at least 8 characters', 400))
    }

    // Need to explicitly select password
    const user = await User.findById(req.user.userId || req.user.id).select('+password')
    if (!user) {
      return next(new AppError('User not found', 404))
    }

    const isMatch = await user.comparePassword(currentPassword)
    if (!isMatch) {
      return next(new AppError('Incorrect current password', 401))
    }

    user.password = newPassword
    await user.save()

    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Delete user account
// @route   DELETE /api/users/account
// @access  Private
exports.deleteAccount = async (req, res, next) => {
  try {
    // In a real production scenario, we might soft-delete or schedule deletion
    // For V2.0, we will perform a hard delete for DPDP compliance.
    const userId = req.user.userId || req.user.id
    await User.findByIdAndDelete(userId)
    await GitHubConnection.deleteMany({ userId })
    await GitHubConnectState.deleteMany({ userId })
    await OptimizerDraft.deleteMany({ userId })
    
    // Clear cookies
    res.cookie('refreshToken', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true
    })

    res.status(200).json({
      success: true,
      message: 'Account successfully deleted'
    })
  } catch (error) {
    next(error)
  }
}
