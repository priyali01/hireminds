const crypto = require('crypto')
const jwt = require('jsonwebtoken')
const GitHubConnectState = require('../../models/githubConnectState.model')
const GitHubConnection = require('../../models/githubConnection.model')
const { loadRepositoryEvidence } = require('./github')
const { AppError, ValidationError } = require('../../utils/errors')

function privateKey() {
  return String(process.env.GITHUB_APP_PRIVATE_KEY || '').replace(/\\n/g, '\n').trim()
}

function appConfig() {
  const id = String(process.env.GITHUB_APP_ID || '').trim()
  const slug = String(process.env.GITHUB_APP_SLUG || '').trim()
  const key = privateKey()
  if (!id || !slug || !key) return null
  return { id, slug, key }
}

function githubHeaders(bearer) {
  return {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'HireMinds',
    Authorization: `Bearer ${bearer}`,
  }
}

function appJwt(config) {
  const now = Math.floor(Date.now() / 1000)
  return jwt.sign(
    { iat: now - 60, exp: now + 8 * 60, iss: config.id },
    config.key,
    { algorithm: 'RS256' }
  )
}

async function readJson(response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}

async function beginConnect(userId) {
  const config = appConfig()
  if (!config) {
    throw new AppError('GitHub connection is not set up on the server yet. You can still add projects yourself.', 503, 'GITHUB_NOT_CONFIGURED')
  }
  const state = crypto.randomBytes(24).toString('hex')
  await GitHubConnectState.create({
    state,
    userId,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  })
  const url = new URL(`https://github.com/apps/${encodeURIComponent(config.slug)}/installations/new`)
  url.searchParams.set('state', state)
  return { url: url.toString() }
}

async function completeInstall({ state, installationId, setupAction, error, fetchImpl = global.fetch }) {
  const pending = state ? await GitHubConnectState.findOne({ state: String(state) }) : null
  if (!pending || pending.expiresAt.getTime() < Date.now()) {
    throw new ValidationError('GitHub returned a connection that could not be verified. Start again from HirMind.')
  }
  await GitHubConnectState.deleteOne({ _id: pending._id })
  if (error) throw new ValidationError('GitHub did not complete the connection.')
  if (setupAction === 'request') return { status: 'pending' }

  const id = Number(installationId)
  if (!Number.isInteger(id) || id <= 0) {
    throw new ValidationError('GitHub did not return an installation.')
  }
  const config = appConfig()
  if (!config) {
    throw new AppError('GitHub connection is not set up on the server yet.', 503, 'GITHUB_NOT_CONFIGURED')
  }
  const response = await fetchImpl(`https://api.github.com/app/installations/${id}`, {
    headers: githubHeaders(appJwt(config)),
  })
  const body = await readJson(response)
  if (!response.ok || Number(body?.id) !== id || !body?.account || typeof body.account !== 'object') {
    throw new AppError('GitHub did not confirm this installation.', 502, 'GITHUB_UNAVAILABLE')
  }
  await GitHubConnection.findOneAndUpdate(
    { userId: pending.userId },
    { userId: pending.userId, installationId: id, accountLogin: body.account.login || '' },
    { upsert: true, new: true }
  )
  return { status: 'connected' }
}

async function installationAccessToken(installationId, fetchImpl) {
  const config = appConfig()
  if (!config) {
    throw new AppError('GitHub connection is not set up on the server yet.', 503, 'GITHUB_NOT_CONFIGURED')
  }
  const response = await fetchImpl(
    `https://api.github.com/app/installations/${installationId}/access_tokens`,
    { method: 'POST', headers: githubHeaders(appJwt(config)) }
  )
  const body = await readJson(response)
  if (response.status === 401 || response.status === 404) {
    throw new AppError('GitHub access for this account was removed.', 401, 'GITHUB_REVOKED')
  }
  if (response.status === 429) {
    throw new AppError('GitHub rate limit reached. Try again later.', 429, 'GITHUB_RATE_LIMIT')
  }
  if (!response.ok || !body?.token) {
    throw new AppError('GitHub did not provide access to the repositories you shared.', 502, 'GITHUB_UNAVAILABLE')
  }
  return body.token
}

function presentRepo(repo) {
  return {
    id: Number.isInteger(repo.id) ? repo.id : null,
    name: repo.name,
    owner: repo.owner?.login || '',
    description: repo.description || '',
    language: repo.language || '',
    topics: Array.isArray(repo.topics) ? repo.topics.slice(0, 20) : [],
    defaultBranch: repo.default_branch || '',
    private: Boolean(repo.private),
    htmlUrl: repo.html_url || '',
    pushedAt: repo.pushed_at || null,
  }
}

async function listSharedRepos(userId, fetchImpl = global.fetch) {
  const connection = await GitHubConnection.findOne({ userId })
  if (!connection) return { connected: false, repos: [] }
  let access
  try {
    access = await installationAccessToken(connection.installationId, fetchImpl)
  } catch (err) {
    if (err.code === 'GITHUB_REVOKED') {
      await GitHubConnection.deleteOne({ userId })
      return { connected: false, revoked: true, repos: [] }
    }
    throw err
  }
  const repositories = []
  for (let page = 1; page <= 3 && repositories.length < 100; page += 1) {
    const response = await fetchImpl(
      `https://api.github.com/installation/repositories?per_page=100&page=${page}`,
      { headers: githubHeaders(access) }
    )
    const body = await readJson(response)
    if (response.status === 401 || response.status === 404) {
      await GitHubConnection.deleteOne({ userId })
      return { connected: false, revoked: true, repos: [] }
    }
    if (response.status === 429) {
      throw new AppError('GitHub rate limit reached. Try again later.', 429, 'GITHUB_RATE_LIMIT')
    }
    if (!response.ok || !Array.isArray(body?.repositories)) {
      throw new AppError('GitHub could not list the repositories you shared.', 502, 'GITHUB_UNAVAILABLE')
    }
    repositories.push(...body.repositories)
    if (body.repositories.length < 100) break
  }
  return {
    connected: true,
    accountLogin: connection.accountLogin,
    repos: repositories.slice(0, 100).map(presentRepo),
  }
}

async function fetchSharedRepos(userId, names, fetchImpl = global.fetch) {
  const wanted = [...new Set((names || []).map((name) => String(name || '').trim()).filter(Boolean))].slice(0, 8)
  if (wanted.length === 0) return []
  const listed = await listSharedRepos(userId, fetchImpl)
  if (!listed.connected) {
    throw new ValidationError('Connect GitHub before choosing repositories.')
  }
  const chosen = listed.repos.filter((repo) => wanted.includes(repo.name))
  if (chosen.length === 0) {
    throw new ValidationError('Choose a repository you shared with HirMind.')
  }
  const access = await installationAccessToken(
    (await GitHubConnection.findOne({ userId })).installationId,
    fetchImpl
  )
  return loadRepositoryEvidence(chosen, { fetchImpl, token: access })
}

function clientRedirect(flag) {
  const base = process.env.CLIENT_URL || 'http://localhost:5173'
  const url = new URL('/resume', base)
  url.searchParams.set('github', ['connected', 'pending', 'error'].includes(flag) ? flag : 'error')
  return url.toString()
}

async function disconnect(userId) {
  await GitHubConnectState.deleteMany({ userId })
  await GitHubConnection.deleteOne({ userId })
}

async function connectionStatus(userId) {
  const connection = await GitHubConnection.findOne({ userId })
  if (!connection) return { connected: false, accountLogin: '' }
  return { connected: true, accountLogin: connection.accountLogin }
}

module.exports = {
  appConfig,
  beginConnect,
  completeInstall,
  listSharedRepos,
  fetchSharedRepos,
  clientRedirect,
  disconnect,
  connectionStatus,
}
