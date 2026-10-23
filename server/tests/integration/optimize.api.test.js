const request = require('supertest')
const app = require('../../app')
const { setupTestDB, clearDB, teardownTestDB } = require('../helpers/db.helper')

const JD = 'Requirements\nRequired: Node.js\nPreferred: React and Docker\nBuild services for students.\n'
const RESUME = `Summary
Computer science student looking for a backend internship.

Projects
Campus API
Kept notes for campus events.

Skills
JavaScript
`

beforeAll(async () => {
  process.env.JWT_SECRET = 'test_jwt_secret_minimum_32_characters_long'
  process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_minimum_32_chars_xx'
  await setupTestDB()
})

afterEach(async () => {
  await clearDB()
  delete process.env.GITHUB_TOKEN
  if (global.fetch && global.fetch.mockRestore) global.fetch.mockRestore()
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
  return response.body.accessToken
}

describe('optimizer drafts', () => {
  it('keeps the original, applies a review, and rescores the approved text for the owner only', async () => {
    const token = await register('priya@test.com')
    const other = await register('other@test.com')
    const created = await request(app)
      .post('/optimize/drafts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        jobDescription: JD,
        resumeText: RESUME,
        repos: [{
          name: 'campus-api',
          description: '',
          readme: 'Built a Node.js service for campus events.',
          language: 'JavaScript',
          pushedAt: '2026-10-01T00:00:00Z',
          files: [{ path: 'server.js', text: 'const express = require("express")\n// node.js routes' }],
        }],
      })
    expect(created.status).toBe(201)
    expect(created.body.draft.originalText).toBe(RESUME)
    expect(created.body.draft.suggestedToLearn).toEqual(expect.arrayContaining(['react', 'docker']))
    const id = created.body.draft.id

    const hidden = await request(app).get(`/optimize/drafts/${id}`).set('Authorization', `Bearer ${other}`)
    expect(hidden.status).toBe(404)

    const change = created.body.draft.changes[0]
    const rejected = await request(app)
      .patch(`/optimize/drafts/${id}/changes/${change.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ action: 'reject' })
    expect(rejected.status).toBe(200)
    expect(rejected.body.draft.originalText).toBe(RESUME)

    const accepted = await request(app)
      .patch(`/optimize/drafts/${id}/changes/${created.body.draft.changes[1].id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ action: 'accept' })
    expect(accepted.body.draft.approvedText).not.toBe(RESUME)
    expect(accepted.body.draft.originalText).toBe(RESUME)

    const invented = await request(app)
      .patch(`/optimize/drafts/${id}/changes/${created.body.draft.changes[1].id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ action: 'edit', text: 'Increased revenue by 40% with Docker' })
    expect(invented.status).toBe(422)

    const scored = await request(app)
      .post(`/optimize/drafts/${id}/rescore`)
      .set('Authorization', `Bearer ${token}`)
    expect(scored.status).toBe(200)
    expect(typeof scored.body.report.scoreExact).toBe('number')

    const pdf = await request(app)
      .get(`/optimize/drafts/${id}/export?format=pdf`)
      .set('Authorization', `Bearer ${token}`)
    expect(pdf.status).toBe(200)
    expect(pdf.body.slice(0, 4).toString()).toBe('%PDF')
  })

  it('reads a public GitHub profile and does not send a token or keep private repositories', async () => {
    const token = await register('git@test.com')
    process.env.GITHUB_TOKEN = 'ghp_server_secret'
    global.fetch = jest.fn(async (url, options) => {
      expect(options.headers.Authorization).toBeUndefined()
      const href = String(url)
      if (href.includes('/repos?')) {
        return {
          ok: true,
          status: 200,
          json: async () => [
            { name: 'secret', private: true, fork: false, description: 'hidden' },
            { name: 'campus-api', private: false, fork: false, description: 'events', language: 'JavaScript', topics: [], pushed_at: '2026-10-01T00:00:00Z', html_url: 'https://github.com/octocat/campus-api' },
          ],
        }
      }
      if (href.endsWith('/readme')) {
        return { ok: true, status: 200, json: async () => ({ encoding: 'base64', content: Buffer.from('Built a Node.js service.').toString('base64') }) }
      }
      if (href.endsWith('/contents/')) {
        return { ok: true, status: 200, json: async () => [{ path: 'server.js', type: 'file', size: 40 }] }
      }
      if (href.endsWith('/server.js')) {
        return { ok: true, status: 200, json: async () => ({ encoding: 'base64', content: Buffer.from('// node.js routes').toString('base64') }) }
      }
      return { ok: false, status: 404, json: async () => ({}) }
    })

    const response = await request(app)
      .post('/optimize/github')
      .set('Authorization', `Bearer ${token}`)
      .send({ profile: 'https://github.com/octocat' })
    expect(response.status).toBe(200)
    expect(response.body.repos.map((repo) => repo.name)).toEqual(['campus-api'])
    expect(JSON.stringify(response.body)).not.toContain('ghp_server_secret')

    const leaked = await request(app)
      .post('/optimize/drafts')
      .set('Authorization', `Bearer ${token}`)
      .send({ jobDescription: JD, resumeText: RESUME, profile: 'ghp_pasted_token' })
    expect(leaked.status).toBe(422)
  })
})
