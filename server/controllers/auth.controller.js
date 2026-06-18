const { registerUser, loginUser, refreshUserToken, logoutUser, setRefreshCookie } = require('../services/auth.service')
const { registerSchema, loginSchema, onboardingSchema } = require('../validators')
const User = require('../models/user.model')
const { AuthError, NotFoundError } = require('../utils/errors')

/**
 * POST /auth/register
 * Body: { fullName, email, password, consentGiven: true }
 * Response: { success, user, accessToken }
 * Sets httpOnly refreshToken cookie.
 */
async function register(req, res, next) {
  try {
    const data = registerSchema.parse(req.body)
    const { user, accessToken, refreshToken } = await registerUser(data)

    setRefreshCookie(res, refreshToken)

    res.status(201).json({
      success: true,
      user,
      accessToken,
    })
  } catch (err) {
    next(err)
  }
}

/**
 * POST /auth/login
 * Body: { email, password }
 * Response: { success, user, accessToken }
 * Sets httpOnly refreshToken cookie.
 */
async function login(req, res, next) {
  try {
    const data = loginSchema.parse(req.body)
    const { user, accessToken, refreshToken } = await loginUser(data)

    setRefreshCookie(res, refreshToken)

    res.json({
      success: true,
      user,
      accessToken,
    })
  } catch (err) {
    next(err)
  }
}

/**
 * POST /auth/refresh
 * Reads refreshToken from httpOnly cookie.
 * Response: { success, accessToken }
 * Rotates the refresh token cookie.
 */
async function refresh(req, res, next) {
  try {
    const cookieToken = req.cookies?.refreshToken

    const { user, accessToken, refreshToken } = await refreshUserToken(cookieToken)

    setRefreshCookie(res, refreshToken)

    res.json({
      success: true,
      user,
      accessToken,
    })
  } catch (err) {
    next(err)
  }
}

/**
 * POST /auth/logout
 * Requires auth middleware.
 * Clears the refresh cookie and revokes the stored token.
 */
async function logout(req, res, next) {
  try {
    await logoutUser(req.user.userId)

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/auth/refresh',
    })

    res.json({ success: true, message: 'Logged out successfully' })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /auth/me
 * Requires auth middleware.
 * Returns the currently authenticated user's public profile.
 */
async function me(req, res, next) {
  try {
    const user = await User.findById(req.user.userId)

    if (!user) {
      throw new NotFoundError('User')
    }

    res.json({ success: true, user: user.toPublicProfile() })
  } catch (err) {
    next(err)
  }
}

/**
 * PUT /auth/onboarding
 * Requires auth middleware.
 * Saves the 5-step onboarding data and marks onboardingComplete: true.
 */
async function completeOnboarding(req, res, next) {
  try {
    const data = onboardingSchema.parse(req.body)

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      {
        ...data,
        onboardingComplete: true,
      },
      { new: true, runValidators: true }
    )

    if (!user) {
      throw new NotFoundError('User')
    }

    res.json({
      success: true,
      user: user.toPublicProfile(),
    })
  } catch (err) {
    next(err)
  }
}

module.exports = {
  register,
  login,
  refresh,
  logout,
  me,
  completeOnboarding,
}
