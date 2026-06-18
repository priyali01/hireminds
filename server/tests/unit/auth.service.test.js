/**
 * TDD: Auth service unit tests.
 * These tests verify the auth service layer in isolation using an in-memory MongoDB.
 * The JWT functions are exercised with test secrets injected via process.env.
 */
const { setupTestDB, clearDB, teardownTestDB } = require('../helpers/db.helper')
const {
  registerUser,
  loginUser,
  refreshUserToken,
  logoutUser,
  generateAccessToken,
  generateRefreshToken,
} = require('../../services/auth.service')
const User = require('../../models/user.model')

// Inject test secrets before any tests run
beforeAll(async () => {
  process.env.JWT_SECRET = 'test_jwt_secret_minimum_32_characters_long'
  process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_minimum_32_chars_xx'
  await setupTestDB()
})

afterEach(async () => {
  await clearDB()
})

afterAll(async () => {
  await teardownTestDB()
})

// ==========================================
// generateAccessToken
// ==========================================
describe('generateAccessToken', () => {
  it('returns a string', () => {
    const fakeUser = { _id: 'abc123', email: 'a@b.com', plan: 'free', role: 'user' }
    const token = generateAccessToken(fakeUser)
    expect(typeof token).toBe('string')
  })

  it('encodes userId, email, plan, role in the payload', () => {
    const jwt = require('jsonwebtoken')
    const fakeUser = { _id: '507f1f77bcf86cd799439011', email: 'test@example.com', plan: 'pro', role: 'user' }
    const token = generateAccessToken(fakeUser)
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    expect(decoded.userId).toBe(fakeUser._id.toString())
    expect(decoded.email).toBe(fakeUser.email)
    expect(decoded.plan).toBe('pro')
    expect(decoded.role).toBe('user')
  })

  it('expires in roughly 15 minutes', () => {
    const jwt = require('jsonwebtoken')
    const fakeUser = { _id: 'abc', email: 'a@b.com', plan: 'free', role: 'user' }
    const token = generateAccessToken(fakeUser)
    const decoded = jwt.decode(token)
    const expiresInSeconds = decoded.exp - decoded.iat
    expect(expiresInSeconds).toBe(15 * 60) // 900 seconds
  })
})

// ==========================================
// registerUser
// ==========================================
describe('registerUser', () => {
  const validData = {
    fullName: 'Priya Sharma',
    email: 'priya@example.com',
    password: 'Password1',
    consentGiven: true,
  }

  it('creates a user in the database', async () => {
    await registerUser(validData)
    const found = await User.findOne({ email: validData.email })
    expect(found).not.toBeNull()
    expect(found.fullName).toBe('Priya Sharma')
  })

  it('returns an accessToken string', async () => {
    const { accessToken } = await registerUser(validData)
    expect(typeof accessToken).toBe('string')
    expect(accessToken.length).toBeGreaterThan(10)
  })

  it('returns the public user profile (no password)', async () => {
    const { user } = await registerUser(validData)
    expect(user.email).toBe(validData.email)
    expect(user.password).toBeUndefined()
    expect(user.refreshToken).toBeUndefined()
  })

  it('records DPDP consent with timestamp', async () => {
    await registerUser(validData)
    const found = await User.findOne({ email: validData.email })
    expect(found.consentGiven).toBe(true)
    expect(found.consentAt).toBeInstanceOf(Date)
    expect(found.consentVersion).toBe('1.0')
  })

  it('hashes the password — stored password does not equal plain text', async () => {
    await registerUser(validData)
    const found = await User.findOne({ email: validData.email }).select('+password')
    expect(found.password).not.toBe('Password1')
    expect(found.password).toMatch(/^\$2[aby]\$/) // bcrypt hash prefix
  })

  it('throws ValidationError if email is already registered', async () => {
    await registerUser(validData)
    await expect(registerUser(validData)).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      statusCode: 422,
    })
  })

  it('throws ValidationError if consentGiven is false', async () => {
    await expect(
      registerUser({ ...validData, consentGiven: false })
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' })
  })
})

// ==========================================
// loginUser
// ==========================================
describe('loginUser', () => {
  beforeEach(async () => {
    await registerUser({
      fullName: 'Test User',
      email: 'user@test.com',
      password: 'Password1',
      consentGiven: true,
    })
  })

  it('returns accessToken on valid credentials', async () => {
    const { accessToken } = await loginUser({ email: 'user@test.com', password: 'Password1' })
    expect(typeof accessToken).toBe('string')
  })

  it('returns the public user profile', async () => {
    const { user } = await loginUser({ email: 'user@test.com', password: 'Password1' })
    expect(user.email).toBe('user@test.com')
    expect(user.password).toBeUndefined()
  })

  it('throws AuthError on wrong password', async () => {
    await expect(
      loginUser({ email: 'user@test.com', password: 'WrongPassword1' })
    ).rejects.toMatchObject({ code: 'AUTH_ERROR', statusCode: 401 })
  })

  it('throws AuthError on non-existent email', async () => {
    await expect(
      loginUser({ email: 'nobody@test.com', password: 'Password1' })
    ).rejects.toMatchObject({ code: 'AUTH_ERROR', statusCode: 401 })
  })

  it('does not reveal whether email exists (same error message for both failures)', async () => {
    let wrongEmailError, wrongPasswordError
    try {
      await loginUser({ email: 'nobody@test.com', password: 'Password1' })
    } catch (e) {
      wrongEmailError = e
    }
    try {
      await loginUser({ email: 'user@test.com', password: 'WrongPassword1' })
    } catch (e) {
      wrongPasswordError = e
    }
    expect(wrongEmailError.message).toBe(wrongPasswordError.message)
  })
})

// ==========================================
// refreshUserToken
// ==========================================
describe('refreshUserToken', () => {
  let validRefreshToken

  beforeEach(async () => {
    const { refreshToken } = await registerUser({
      fullName: 'Test User',
      email: 'refresh@test.com',
      password: 'Password1',
      consentGiven: true,
    })
    validRefreshToken = refreshToken
  })

  it('returns a new accessToken when given a valid refresh token', async () => {
    const { accessToken } = await refreshUserToken(validRefreshToken)
    expect(typeof accessToken).toBe('string')
  })

  it('rotates the refresh token — stored hash changes after use', async () => {
    const userBefore = await User.findOne({ email: 'refresh@test.com' }).select('+refreshToken')
    const hashBefore = userBefore.refreshToken

    await refreshUserToken(validRefreshToken)

    const userAfter = await User.findOne({ email: 'refresh@test.com' }).select('+refreshToken')
    const hashAfter = userAfter.refreshToken

    // The stored hash must change after a rotation — old token no longer matches
    expect(hashBefore).not.toBe(hashAfter)
  })

  it('throws AuthError when refresh token is missing', async () => {
    await expect(refreshUserToken(null)).rejects.toMatchObject({
      code: 'AUTH_ERROR',
      statusCode: 401,
    })
  })

  it('throws AuthError when refresh token is tampered', async () => {
    await expect(
      refreshUserToken(validRefreshToken + 'tampered')
    ).rejects.toMatchObject({ code: 'AUTH_ERROR' })
  })
})

// ==========================================
// logoutUser
// ==========================================
describe('logoutUser', () => {
  it('nullifies the refresh token in the database', async () => {
    const { user } = await registerUser({
      fullName: 'Logout Test',
      email: 'logout@test.com',
      password: 'Password1',
      consentGiven: true,
    })

    await logoutUser(user.id)

    const found = await User.findById(user.id).select('+refreshToken')
    expect(found.refreshToken).toBeNull()
  })
})
