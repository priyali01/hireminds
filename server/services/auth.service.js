const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const User = require('../models/user.model')
const { AuthError, NotFoundError, ValidationError } = require('../utils/errors')

const ACCESS_TOKEN_EXPIRY = '15m'
const REFRESH_TOKEN_EXPIRY = '7d'

/**
 * Generates a signed JWT access token.
 * Payload: userId, email, plan, role.
 * Expiry: 15 minutes.
 */
function generateAccessToken(user) {
  return jwt.sign(
    {
      userId: user._id.toString(),
      email: user.email,
      plan: user.plan,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  )
}

/**
 * Generates a signed JWT refresh token.
 * Payload: userId only (minimal data in long-lived token).
 * Expiry: 7 days.
 */
function generateRefreshToken(user) {
  return jwt.sign(
    { userId: user._id.toString() },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  )
}

/**
 * Attaches the refresh token as an httpOnly cookie.
 * httpOnly: XSS cannot read it from JavaScript.
 * Secure: only sent over HTTPS (set true in production).
 * SameSite=Strict: CSRF cannot trigger the cookie cross-origin.
 */
function setRefreshCookie(res, token) {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    path: '/auth/refresh', // cookie is only sent to the refresh endpoint
  })
}

/**
 * Registers a new user.
 * Requires DPDP Act 2023 consent to be explicitly given (consentGiven: true).
 *
 * @param {{ fullName: string, email: string, password: string, consentGiven: boolean }} data
 * @returns {{ user: object, accessToken: string, refreshToken: string }}
 */
async function registerUser(data) {
  const { fullName, email, password, consentGiven } = data

  // consentGiven should already be validated as literal(true) by Zod, but double-check
  if (!consentGiven) {
    throw new ValidationError('Consent to privacy policy is required', [
      { field: 'consentGiven', message: 'You must accept the privacy policy (DPDP Act 2023)' },
    ])
  }

  // Check for existing email (Mongoose will throw a 11000 duplicate key on save,
  // but pre-checking gives a cleaner error message)
  const existing = await User.findOne({ email })
  if (existing) {
    throw new ValidationError('This email is already registered', [
      { field: 'email', message: 'An account with this email already exists' },
    ])
  }

  const user = await User.create({
    fullName,
    email,
    password, // hashed by pre-save hook
    consentGiven: true,
    consentAt: new Date(),
    consentVersion: '1.0',
  })

  const accessToken = generateAccessToken(user)
  const refreshToken = generateRefreshToken(user)

  // Store hashed refresh token — if the DB is breached, raw tokens are not exposed
  const salt = await bcrypt.genSalt(10)
  user.refreshToken = await bcrypt.hash(refreshToken, salt)
  await user.save()

  return { user: user.toPublicProfile(), accessToken, refreshToken }
}

/**
 * Authenticates a user with email + password.
 *
 * @param {{ email: string, password: string }} data
 * @returns {{ user: object, accessToken: string, refreshToken: string }}
 */
async function loginUser(data) {
  const { email, password } = data

  // select('+password +refreshToken') because both are select: false on the schema
  const user = await User.findOne({ email }).select('+password +refreshToken')

  if (!user) {
    // Do not reveal whether the email exists — same error for both cases
    throw new AuthError('Invalid email or password')
  }

  const passwordMatch = await user.comparePassword(password)
  if (!passwordMatch) {
    throw new AuthError('Invalid email or password')
  }

  const accessToken = generateAccessToken(user)
  const refreshToken = generateRefreshToken(user)

  // Rotate refresh token: hash and store new one
  const salt = await bcrypt.genSalt(10)
  user.refreshToken = await bcrypt.hash(refreshToken, salt)
  await user.save()

  return { user: user.toPublicProfile(), accessToken, refreshToken }
}

/**
 * Rotates the refresh token.
 * Reads the refresh token from the httpOnly cookie.
 * Validates it, then issues new access + refresh tokens.
 *
 * @param {string} cookieToken - The raw refresh token from the cookie
 * @returns {{ user: object, accessToken: string, refreshToken: string }}
 */
async function refreshUserToken(cookieToken) {
  if (!cookieToken) {
    throw new AuthError('Refresh token missing')
  }

  let decoded
  try {
    decoded = jwt.verify(cookieToken, process.env.JWT_REFRESH_SECRET)
  } catch {
    throw new AuthError('Refresh token is invalid or expired')
  }

  const user = await User.findById(decoded.userId).select('+refreshToken')

  if (!user || !user.refreshToken) {
    throw new AuthError('Refresh token has been revoked')
  }

  // Compare incoming token against stored hash
  const tokenMatch = await bcrypt.compare(cookieToken, user.refreshToken)
  if (!tokenMatch) {
    // Possible token reuse attack: revoke all tokens for this user
    user.refreshToken = null
    await user.save()
    throw new AuthError('Refresh token reuse detected. Please log in again.')
  }

  const accessToken = generateAccessToken(user)
  const newRefreshToken = generateRefreshToken(user)

  // Rotate: invalidate old, store new (hashed)
  const salt = await bcrypt.genSalt(10)
  user.refreshToken = await bcrypt.hash(newRefreshToken, salt)
  await user.save()

  return { user: user.toPublicProfile(), accessToken, refreshToken: newRefreshToken }
}

/**
 * Revokes a user's refresh token (logout).
 *
 * @param {string} userId
 */
async function logoutUser(userId) {
  await User.findByIdAndUpdate(userId, { refreshToken: null })
}

module.exports = {
  registerUser,
  loginUser,
  refreshUserToken,
  logoutUser,
  generateAccessToken,
  generateRefreshToken,
  setRefreshCookie,
}
