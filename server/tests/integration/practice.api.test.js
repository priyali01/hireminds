const request = require('supertest')
const app = require('../../app')
const PracticeSession = require('../../models/practiceSession.model')
const OptimizerDraft = require('../../models/optimizerDraft.model')
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

async function register(email) {
  const response = await request(app).post('/auth/register').send({
    fullName: 'Priya Sharma',
    email,
    password: 'Password1',
    consentGiven: true,
  })
  return { token: response.body.accessToken, userId: response.body.user.id || response.body.user._id }
}

describe('practice interview links', () => {
  const body = {
    role: 'Backend intern',
    company: 'Razorpay',
    jobDescription: 'Requirements\nRequired: Node.js and SQL\n',
    resumeText: 'Projects\nCampus API\nBuilt a small service.\n',
    sources: [],
  }

  it('runs one private link without storing a transcript or audio unless the candidate agrees', async () => {
    const owner = await register('priya@test.com')
    const other = await register('other@test.com')
    const created = await request(app)
      .post('/practice/sessions')
      .set('Authorization', `Bearer ${owner.token}`)
      .send(body)
    expect(created.status).toBe(201)
    const token = created.body.session.token
    expect(token).toMatch(/^[a-f0-9]{48}$/)

    const joined = await request(app).get(`/practice/join/${token}`)
    expect(joined.status).toBe(200)
    expect(joined.body.session.email).toBeUndefined()
    expect(JSON.stringify(joined.body)).not.toMatch(/priya@test.com/)
    expect(joined.body.session.question).toBeNull()

    const denied = await request(app).post(`/practice/join/${token}/consent`).send({ microphone: false })
    expect(denied.status).toBe(422)
    const noCamera = await request(app).post(`/practice/join/${token}/consent`).send({ microphone: true, camera: false, videoAnalysis: true })
    expect(noCamera.status).toBe(422)

    const consented = await request(app).post(`/practice/join/${token}/consent`).send({
      microphone: true,
      camera: false,
      storeTranscript: false,
      videoAnalysis: false,
    })
    expect(consented.status).toBe(200)
    const started = await request(app).post(`/practice/join/${token}/start`)
    expect(started.status).toBe(200)
    expect(started.body.session.question.text).toMatch(/node\.js/i)
    expect(started.body.session.progress.total).toBeGreaterThan(1)

    const answered = await request(app).post(`/practice/join/${token}/answer`).send({
      transcript: 'I used node.js because the campus API needed a small service.',
      durationSeconds: 20,
      audioBase64: 'secret-audio',
      video: [{ type: 'look_away' }],
    })
    expect(answered.status).toBe(200)
    expect(answered.body.evaluation.video).toBeNull()
    expect(JSON.stringify(answered.body.session || {})).not.toContain('secret-audio')

    const stored = await PracticeSession.findOne({ token })
    expect(stored.answers[0].transcript).toBe('')
    expect(JSON.stringify(stored)).not.toContain('secret-audio')

    const stranger = await request(app).get(`/practice/sessions/${stored._id}`).set('Authorization', `Bearer ${other.token}`)
    expect(stranger.status).toBe(404)

    const done = await request(app).post(`/practice/join/${token}/finish`)
    expect(done.status).toBe(200)
    expect(done.body.report.coachPlan.weaknesses).toHaveLength(3)

    await request(app).delete(`/practice/sessions/${stored._id}`).set('Authorization', `Bearer ${owner.token}`)
    const gone = await request(app).get(`/practice/join/${token}`)
    expect(gone.status).toBe(404)
  })

  it('revokes a link, drops retained sessions, and deletes practice data with the account', async () => {
    const owner = await register('keep@test.com')
    const created = await request(app)
      .post('/practice/sessions')
      .set('Authorization', `Bearer ${owner.token}`)
      .send(body)
    const token = created.body.session.token
    const id = created.body.session.id

    await request(app).post(`/practice/sessions/${id}/revoke`).set('Authorization', `Bearer ${owner.token}`)
    const revoked = await request(app).get(`/practice/join/${token}`)
    expect(revoked.status).toBe(410)

    const second = await request(app)
      .post('/practice/sessions')
      .set('Authorization', `Bearer ${owner.token}`)
      .send(body)
    await PracticeSession.updateOne({ _id: second.body.session.id }, { retainUntil: new Date('2020-01-01') })
    const listed = await request(app).get('/practice/sessions').set('Authorization', `Bearer ${owner.token}`)
    expect(listed.body.sessions.map((item) => item.id)).not.toContain(second.body.session.id)

    await OptimizerDraft.create({
      userId: owner.userId,
      originalText: 'Summary\nStudent\n',
      jobDescription: body.jobDescription,
      changes: [],
      approvedText: 'Summary\nStudent\n',
    })
    const removed = await request(app).delete('/users/account').set('Authorization', `Bearer ${owner.token}`)
    expect(removed.status).toBe(200)
    expect(await PracticeSession.countDocuments({ userId: owner.userId })).toBe(0)
    expect(await OptimizerDraft.countDocuments({ userId: owner.userId })).toBe(0)
  })
})
