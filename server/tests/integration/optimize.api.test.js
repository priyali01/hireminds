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
  delete process.env.GITHUB_APP_ID
  delete process.env.GITHUB_APP_SLUG
  delete process.env.GITHUB_APP_PRIVATE_KEY
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

  it('tells the candidate to add projects when GitHub is not configured', async () => {
    const token = await register('noconfig@test.com')
    const response = await request(app)
      .post('/optimize/github/connect')
      .set('Authorization', `Bearer ${token}`)
    expect(response.status).toBe(503)
    expect(response.body.code).toBe('GITHUB_NOT_CONFIGURED')
    expect(response.body.message).toMatch(/add projects yourself/i)
    expect(JSON.stringify(response.body)).not.toMatch(/PRIVATE KEY|BEGIN RSA/)
  })

  it('tailors from a project the candidate typed, without GitHub', async () => {
    const token = await register('manual@test.com')
    const response = await request(app)
      .post('/optimize/drafts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        jobDescription: JD,
        resumeText: RESUME,
        manualProjects: [{ name: 'Campus API', details: 'Built a Node.js service for campus events.' }],
      })
    expect(response.status).toBe(201)
    expect(response.body.draft.demonstratedSkills).toContain('node.js')
    expect(response.body.draft.rubricVersion).toBe('h02-projects-v1')
    expect(response.body.draft.report).toBeNull()
    expect(response.body.draft.projects[0].declaredTechnologies).toContain('node.js')
    expect(response.body.draft.projects[0].score).toEqual(expect.any(Number))
    expect(response.body.draft.projects.map((project) => project.recommendation)).toEqual(['highlight'])
    const projectChange = response.body.draft.changes.find((change) => change.section === 'projects')
    expect(projectChange.after).toContain('Built a Node.js service for campus events.')
    expect(response.body.draft.suggestedToLearn).toEqual(expect.arrayContaining(['react', 'docker']))
    expect(response.body.draft.changes.map((change) => change.after).join('\n').toLowerCase()).not.toMatch(/\bdocker\b/)
    expect(response.body.draft.originalText).toBe(RESUME)
  })

  it('sends the user to GitHub to choose repositories and only reads the ones they shared', async () => {
    const { generateKeyPairSync } = require('crypto')
    const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
    process.env.GITHUB_APP_ID = '4242'
    process.env.GITHUB_APP_SLUG = 'hireminds'
    process.env.GITHUB_APP_PRIVATE_KEY = privateKey.export({ type: 'pkcs1', format: 'pem' })
    process.env.CLIENT_URL = 'http://localhost:5173'
    const token = await register('install@test.com')

    const missing = await request(app).post('/optimize/github/connect')
    expect(missing.status).toBe(401)

    const started = await request(app)
      .post('/optimize/github/connect')
      .set('Authorization', `Bearer ${token}`)
    expect(started.status).toBe(200)
    const connectUrl = new URL(started.body.url)
    expect(connectUrl.origin).toBe('https://github.com')
    expect(connectUrl.pathname).toBe('/apps/hireminds/installations/new')
    expect(started.body.url).not.toContain('PRIVATE KEY')
    const state = connectUrl.searchParams.get('state')

    const pendingStart = await request(app)
      .post('/optimize/github/connect')
      .set('Authorization', `Bearer ${token}`)
    const pendingState = new URL(pendingStart.body.url).searchParams.get('state')
    const pending = await request(app).get(`/optimize/github/callback?state=${pendingState}&setup_action=request`)
    expect(pending.status).toBe(302)
    expect(pending.headers.location).toBe('http://localhost:5173/resume?github=pending')
    const stillOff = await request(app)
      .get('/optimize/github/status')
      .set('Authorization', `Bearer ${token}`)
    expect(stillOff.body.connected).toBe(false)

    global.fetch = jest.fn(async (url) => {
      const href = String(url)
      if (href === 'https://api.github.com/app/installations/99') {
        return { ok: true, status: 200, json: async () => ({ id: 99, account: { login: 'octocat' } }) }
      }
      if (href.endsWith('/access_tokens')) {
        return { ok: true, status: 200, json: async () => ({ token: 'ghs_install_secret' }) }
      }
      if (href.includes('/installation/repositories')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            repositories: [
              { name: 'campus-api', private: true, description: 'events', language: 'JavaScript', pushed_at: '2026-10-01T00:00:00Z', html_url: 'https://github.com/octocat/campus-api', owner: { login: 'octocat' } },
              { name: 'other', private: false, description: 'notes', language: 'JavaScript', pushed_at: '2026-10-01T00:00:00Z', html_url: 'https://github.com/octocat/other', owner: { login: 'octocat' } },
            ],
          }),
        }
      }
      if (href.endsWith('/readme')) {
        return { ok: true, status: 200, json: async () => ({ encoding: 'base64', content: Buffer.from('Built a Node.js service for campus events.').toString('base64') }) }
      }
      if (href.endsWith('/contents/')) {
        return { ok: true, status: 200, json: async () => [{ path: 'server.js', type: 'file', size: 40 }] }
      }
      if (href.endsWith('/server.js')) {
        return { ok: true, status: 200, json: async () => ({ encoding: 'base64', content: Buffer.from('// node.js routes').toString('base64') }) }
      }
      return { ok: false, status: 404, json: async () => ({}) }
    })

    const bad = await request(app).get('/optimize/github/callback?state=nope&installation_id=99')
    expect(bad.status).toBe(302)
    expect(bad.headers.location).toContain('github=error')

    const back = await request(app).get(`/optimize/github/callback?state=${state}&installation_id=99&setup_action=install`)
    expect(back.status).toBe(302)
    expect(back.headers.location).toBe('http://localhost:5173/resume?github=connected')
    expect(back.headers.location).not.toContain('ghs_install_secret')

    const reused = await request(app).get(`/optimize/github/callback?state=${state}&installation_id=99&setup_action=install`)
    expect(reused.status).toBe(302)
    expect(reused.headers.location).toBe('http://localhost:5173/resume?github=error')

    const listed = await request(app)
      .get('/optimize/github/repos')
      .set('Authorization', `Bearer ${token}`)
    expect(listed.status).toBe(200)
    expect(listed.body.repos.map((repo) => repo.name)).toEqual(['campus-api', 'other'])
    expect(JSON.stringify(listed.body)).not.toContain('ghs_install_secret')
    expect(JSON.stringify(listed.body)).not.toContain('PRIVATE KEY')

    const draft = await request(app)
      .post('/optimize/drafts')
      .set('Authorization', `Bearer ${token}`)
      .send({ jobDescription: JD, resumeText: RESUME, repoNames: ['campus-api', 'not-shared'] })
    expect(draft.status).toBe(201)
    expect(draft.body.draft.projects.map((project) => project.name)).toEqual(['campus-api'])
    expect(draft.body.draft.projects[0].verifiedTechnologies).toContain('node.js')
    expect(draft.body.draft.rubricVersion).toBe('h02-projects-v1')
    expect(draft.body.draft.demonstratedSkills).toContain('node.js')
    expect(JSON.stringify(draft.body)).not.toContain('ghs_install_secret')

    const other = await register('someoneelse@test.com')
    const hiddenRepos = await request(app)
      .get('/optimize/github/repos')
      .set('Authorization', `Bearer ${other}`)
    expect(hiddenRepos.body.connected).toBe(false)
    expect(hiddenRepos.body.repos).toEqual([])
    const hiddenDraft = await request(app)
      .post('/optimize/drafts')
      .set('Authorization', `Bearer ${other}`)
      .send({ jobDescription: JD, resumeText: RESUME, repoNames: ['campus-api'] })
    expect(hiddenDraft.status).toBe(422)
  })

  it('drops a cancelled or forged GitHub callback and clears revoked access', async () => {
    const { generateKeyPairSync } = require('crypto')
    const jwt = require('jsonwebtoken')
    const GitHubConnection = require('../../models/githubConnection.model')
    const OptimizerDraft = require('../../models/optimizerDraft.model')
    const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
    process.env.GITHUB_APP_ID = '4242'
    process.env.GITHUB_APP_SLUG = 'hireminds'
    process.env.GITHUB_APP_PRIVATE_KEY = privateKey.export({ type: 'pkcs1', format: 'pem' })
    process.env.CLIENT_URL = 'http://localhost:5173'
    const token = await register('callback@test.com')
    const userId = jwt.verify(token, process.env.JWT_SECRET).userId

    const started = await request(app)
      .post('/optimize/github/connect')
      .set('Authorization', `Bearer ${token}`)
    const state = new URL(started.body.url).searchParams.get('state')
    const cancelled = await request(app).get(`/optimize/github/callback?state=${state}&error=access_denied&error_description=The+user+canceled`)
    expect(cancelled.status).toBe(302)
    expect(cancelled.headers.location).toBe('http://localhost:5173/resume?github=error')
    expect(cancelled.headers.location).not.toContain('canceled')
    expect(await GitHubConnection.countDocuments({ userId })).toBe(0)

    const again = await request(app)
      .post('/optimize/github/connect')
      .set('Authorization', `Bearer ${token}`)
    const forgedState = new URL(again.body.url).searchParams.get('state')
    global.fetch = jest.fn(async () => ({ ok: true, status: 200, json: async () => ({ id: 5, account: { login: 'intruder' } }) }))
    const forged = await request(app).get(`/optimize/github/callback?state=${forgedState}&installation_id=99&setup_action=install`)
    expect(forged.headers.location).toBe('http://localhost:5173/resume?github=error')
    expect(await GitHubConnection.countDocuments({ userId })).toBe(0)

    await GitHubConnection.create({ userId, installationId: 7, accountLogin: 'octocat' })
    global.fetch = jest.fn(async (url) => {
      const href = String(url)
      if (href.endsWith('/access_tokens')) return { ok: false, status: 404, json: async () => ({}) }
      return { ok: false, status: 404, json: async () => ({}) }
    })
    const revoked = await request(app).get('/optimize/github/repos').set('Authorization', `Bearer ${token}`)
    expect(revoked.status).toBe(200)
    expect(revoked.body.revoked).toBe(true)
    expect(revoked.body.connected).toBe(false)
    expect(JSON.stringify(revoked.body)).not.toMatch(/ghs_|BEGIN RSA/)
    expect(await GitHubConnection.countDocuments({ userId })).toBe(0)

    await GitHubConnection.create({ userId, installationId: 7, accountLogin: 'octocat' })
    global.fetch = jest.fn(async (url) => {
      const href = String(url)
      if (href.endsWith('/access_tokens')) return { ok: true, status: 200, json: async () => ({ token: 'ghs_rate_secret' }) }
      if (href.includes('page=1')) {
        return { ok: true, status: 200, json: async () => ({ repositories: Array.from({ length: 100 }, (_, index) => ({ id: index + 1, name: `repo-${index}`, private: false, owner: { login: 'octocat' }, default_branch: 'main' })) }) }
      }
      if (href.includes('page=2')) {
        return { ok: true, status: 200, json: async () => ({ repositories: [{ id: 250, name: 'last-repo', private: true, owner: { login: 'octocat' }, default_branch: 'main' }] }) }
      }
      return { ok: false, status: 404, json: async () => ({}) }
    })
    const pages = await request(app).get('/optimize/github/repos').set('Authorization', `Bearer ${token}`)
    expect(pages.status).toBe(200)
    expect(pages.body.repos).toHaveLength(100)
    expect(pages.body.repos.map((item) => item.name)).not.toContain('last-repo')
    expect(pages.body.repos[0].defaultBranch).toBe('main')
    expect(JSON.stringify(pages.body)).not.toContain('ghs_rate_secret')

    global.fetch = jest.fn(async (url) => {
      if (String(url).endsWith('/access_tokens')) return { ok: true, status: 200, json: async () => ({ token: 'ghs_rate_secret' }) }
      return { ok: false, status: 429, json: async () => ({ message: 'rate limit' }) }
    })
    const limited = await request(app).get('/optimize/github/repos').set('Authorization', `Bearer ${token}`)
    expect(limited.status).toBe(429)
    expect(JSON.stringify(limited.body)).not.toContain('ghs_rate_secret')

    await request(app)
      .post('/optimize/drafts')
      .set('Authorization', `Bearer ${token}`)
      .send({ jobDescription: JD, resumeText: RESUME, manualProjects: [{ name: 'Campus API', details: 'Built a Node.js service for campus events.' }] })
    const removed = await request(app).delete('/users/account').set('Authorization', `Bearer ${token}`)
    expect(removed.status).toBe(200)
    expect(await GitHubConnection.countDocuments({ userId })).toBe(0)
    expect(await OptimizerDraft.countDocuments({ userId })).toBe(0)
  })
})
