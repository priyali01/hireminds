/**
 * TDD: Auth API integration tests.
 * Uses Supertest to hit the Express app's HTTP layer.
 * Tests the full request → middleware → controller → service → DB cycle.
 * No mocking of the service layer here — this is an integration test.
 */
const request = require('supertest')
const app = require('../../app')
const { setupTestDB, clearDB, teardownTestDB } = require('../helpers/db.helper')

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
// POST /auth/register
// ==========================================
describe('POST /auth/register', () => {
  const validBody = {
    fullName: 'Priya Sharma',
    email: 'priya@test.com',
    password: 'Password1',
    consentGiven: true,
  }

  it('returns 201 and accessToken on valid registration', async () => {
    const res = await request(app).post('/auth/register').send(validBody)
    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(typeof res.body.accessToken).toBe('string')
    expect(res.body.user.email).toBe(validBody.email)
  })

  it('sets httpOnly refreshToken cookie', async () => {
    const res = await request(app).post('/auth/register').send(validBody)
    const cookies = res.headers['set-cookie']
    expect(cookies).toBeDefined()
    const refreshCookie = cookies.find((c) => c.startsWith('refreshToken='))
    expect(refreshCookie).toBeDefined()
    expect(refreshCookie).toContain('HttpOnly')
  })

  it('returns 422 if consentGiven is false', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ ...validBody, consentGiven: false })
    expect(res.status).toBe(422)
    expect(res.body.code).toBe('VALIDATION_ERROR')
  })

  it('returns 422 if consentGiven is missing', async () => {
    const { consentGiven, ...noConsent } = validBody
    const res = await request(app).post('/auth/register').send(noConsent)
    expect(res.status).toBe(422)
  })

  it('returns 422 if email is already registered', async () => {
    await request(app).post('/auth/register').send(validBody)
    const res = await request(app).post('/auth/register').send(validBody)
    expect(res.status).toBe(422)
    expect(res.body.code).toBe('VALIDATION_ERROR')
  })

  it('returns 422 if email is invalid', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ ...validBody, email: 'not-an-email' })
    expect(res.status).toBe(422)
  })

  it('returns 422 if password is too short', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ ...validBody, password: 'abc' })
    expect(res.status).toBe(422)
  })

  it('never returns the password field in the response', async () => {
    const res = await request(app).post('/auth/register').send(validBody)
    expect(res.body.user.password).toBeUndefined()
  })
})

// ==========================================
// POST /auth/login
// ==========================================
describe('POST /auth/login', () => {
  beforeEach(async () => {
    await request(app).post('/auth/register').send({
      fullName: 'Test User',
      email: 'user@test.com',
      password: 'Password1',
      consentGiven: true,
    })
  })

  it('returns 200 and accessToken on valid credentials', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'user@test.com', password: 'Password1' })
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(typeof res.body.accessToken).toBe('string')
  })

  it('returns 401 on wrong password', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'user@test.com', password: 'WrongPass1' })
    expect(res.status).toBe(401)
    expect(res.body.code).toBe('AUTH_ERROR')
  })

  it('returns 401 on non-existent email', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'ghost@test.com', password: 'Password1' })
    expect(res.status).toBe(401)
  })
})

// ==========================================
// GET /auth/me
// ==========================================
describe('GET /auth/me', () => {
  it('returns user profile when authenticated', async () => {
    const registerRes = await request(app).post('/auth/register').send({
      fullName: 'Me Test',
      email: 'me@test.com',
      password: 'Password1',
      consentGiven: true,
    })
    const { accessToken } = registerRes.body

    const res = await request(app)
      .get('/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
    expect(res.status).toBe(200)
    expect(res.body.user.email).toBe('me@test.com')
  })

  it('returns 401 without Authorization header', async () => {
    const res = await request(app).get('/auth/me')
    expect(res.status).toBe(401)
  })

  it('returns 401 with a tampered token', async () => {
    const res = await request(app)
      .get('/auth/me')
      .set('Authorization', 'Bearer invalid.token.here')
    expect(res.status).toBe(401)
  })
})

// ==========================================
// PUT /auth/onboarding
// ==========================================
describe('PUT /auth/onboarding', () => {
  let accessToken

  beforeEach(async () => {
    const res = await request(app).post('/auth/register').send({
      fullName: 'Onboard Test',
      email: 'onboard@test.com',
      password: 'Password1',
      consentGiven: true,
    })
    accessToken = res.body.accessToken
  })

  const validOnboarding = {
    level: 'fresher',
    targetRoles: ['Frontend Developer', 'Full Stack Developer'],
    skills: ['React', 'Node.js', 'MongoDB'],
    college: 'IIT Bombay',
    branch: 'Computer Science',
    graduationYear: 2025,
  }

  it('returns 200 and marks onboardingComplete: true', async () => {
    const res = await request(app)
      .put('/auth/onboarding')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(validOnboarding)
    expect(res.status).toBe(200)
    expect(res.body.user.onboardingComplete).toBe(true)
  })

  it('saves the level correctly', async () => {
    const res = await request(app)
      .put('/auth/onboarding')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(validOnboarding)
    expect(res.body.user.level).toBe('fresher')
  })

  it('returns 422 if level is not one of the valid enums', async () => {
    const res = await request(app)
      .put('/auth/onboarding')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ ...validOnboarding, level: 'junior' })
    expect(res.status).toBe(422)
  })

  it('returns 401 without auth token', async () => {
    const res = await request(app).put('/auth/onboarding').send(validOnboarding)
    expect(res.status).toBe(401)
  })
})

// ==========================================
// Health check
// ==========================================
describe('GET /health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/health')
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ok')
  })
})
