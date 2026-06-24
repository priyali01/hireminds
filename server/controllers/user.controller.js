const User = require('../models/user.model')
const { AppError } = require('../utils/errors')

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const { fullName, level, targetRoles, skills, college, branch, graduationYear } = req.body

    const user = await User.findById(req.user.id)
    if (!user) {
      return next(new AppError('User not found', 404))
    }

    // Update allowed fields
    if (fullName !== undefined) user.fullName = fullName
    if (level !== undefined) user.level = level
    if (targetRoles !== undefined) user.targetRoles = targetRoles
    if (skills !== undefined) user.skills = skills
    if (college !== undefined) user.college = college
    if (branch !== undefined) user.branch = branch
    if (graduationYear !== undefined) user.graduationYear = graduationYear

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
    const user = await User.findById(req.user.id).select('+password')
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
    await User.findByIdAndDelete(req.user.id)
    
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
