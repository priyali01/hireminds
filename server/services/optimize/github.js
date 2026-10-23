const { ValidationError, NotFoundError, AppError } = require('../../utils/errors')

const TOKEN_RE = /ghp_|github_pat_|gho_|ghu_/i
const SOURCE_RE = /\.(js|jsx|ts|tsx|py|go|java|kt)$/i

function parseGitHubLogin(input) {
  if (typeof input !== 'string' || !input.trim()) {
    throw new ValidationError('Enter a GitHub username or a public profile URL.')
  }
  const trimmed = input.trim()
  if (TOKEN_RE.test(trimmed)) {
    throw new ValidationError('Paste a profile URL, not a token.')
  }
  const profile = trimmed.match(/^(?:https?:\/\/)?(?:www\.)?github\.com\/([A-Za-z0-9-]+)\/?$/i)
  if (profile) return profile[1]
  if (/github\.com\//i.test(trimmed)) {
    throw new ValidationError('Use a profile URL such as github.com/your-name, not a repository link.')
  }
  if (!/^[A-Za-z0-9-]{1,39}$/.test(trimmed)) {
    throw new ValidationError('Enter a GitHub username or a public profile URL.')
  }
  return trimmed
}

function selectPublicRepos(apiRepos, { allowPrivate = false } = {}) {
  return (apiRepos || [])
    .filter((repo) => repo && repo.fork !== true)
    .filter((repo) => allowPrivate || repo.private !== true)
    .map((repo) => ({
      name: repo.name,
      description: repo.description || '',
      language: repo.language || '',
      languages: repo.languages || {},
      topics: Array.isArray(repo.topics) ? repo.topics : [],
      pushedAt: repo.pushed_at || repo.pushedAt || null,
      private: Boolean(repo.private),
      htmlUrl: repo.html_url || repo.htmlUrl || '',
      readme: repo.readme || '',
      files: Array.isArray(repo.files) ? repo.files : [],
    }))
}

function selectSourceFiles(entries) {
  return (entries || [])
    .filter((entry) => entry && (entry.type === 'blob' || entry.type === 'file'))
    .filter((entry) => entry.path && !/(^|\/)node_modules\//.test(entry.path))
    .filter((entry) => SOURCE_RE.test(entry.path))
    .filter((entry) => entry.size == null || entry.size <= 20000)
    .slice(0, 3)
}

function githubHeaders(token, allowPrivate) {
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'HireMinds',
  }
  if (allowPrivate && token) headers.Authorization = `Bearer ${token}`
  return headers
}

async function readJson(response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}

async function fetchReadme(fetchImpl, headers, login, repo) {
  const response = await fetchImpl(`https://api.github.com/repos/${encodeURIComponent(login)}/${encodeURIComponent(repo)}/readme`, { headers })
  if (!response.ok) return ''
  const body = await readJson(response)
  if (!body || body.encoding !== 'base64' || !body.content) return ''
  return Buffer.from(body.content, 'base64').toString('utf8').slice(0, 20000)
}

async function fetchSourceFiles(fetchImpl, headers, login, repo) {
  const response = await fetchImpl(`https://api.github.com/repos/${encodeURIComponent(login)}/${encodeURIComponent(repo)}/contents/`, { headers })
  if (!response.ok) return []
  const body = await readJson(response)
  if (!Array.isArray(body)) return []
  const picked = selectSourceFiles(body.map((entry) => ({
    path: entry.path,
    type: entry.type === 'file' ? 'blob' : entry.type,
    size: entry.size,
  })))
  const files = []
  for (const entry of picked) {
    const fileResponse = await fetchImpl(
      `https://api.github.com/repos/${encodeURIComponent(login)}/${encodeURIComponent(repo)}/contents/${entry.path}`,
      { headers }
    )
    if (!fileResponse.ok) continue
    const fileBody = await readJson(fileResponse)
    if (!fileBody || fileBody.encoding !== 'base64' || !fileBody.content) continue
    files.push({
      path: entry.path,
      text: Buffer.from(fileBody.content, 'base64').toString('utf8').slice(0, 20000),
    })
  }
  return files
}

async function fetchPublicProfile(login, { fetchImpl = global.fetch, token = null, allowPrivate = false } = {}) {
  const headers = githubHeaders(token, allowPrivate)
  const response = await fetchImpl(
    `https://api.github.com/users/${encodeURIComponent(login)}/repos?per_page=30&sort=updated&type=owner`,
    { headers }
  )
  if (response.status === 404) throw new NotFoundError('GitHub profile')
  if (response.status === 403 || response.status === 429) {
    throw new AppError('GitHub rate limit reached. Try again later.', 429, 'GITHUB_RATE_LIMIT')
  }
  if (!response.ok) throw new AppError('GitHub could not be reached.', 502, 'GITHUB_UNAVAILABLE')
  const body = await readJson(response)
  if (!Array.isArray(body)) throw new AppError('GitHub returned an unexpected response.', 502, 'GITHUB_UNAVAILABLE')

  const repos = selectPublicRepos(body, { allowPrivate: Boolean(allowPrivate && token) }).slice(0, 8)
  const detailed = []
  for (const repo of repos) {
    detailed.push({
      ...repo,
      readme: await fetchReadme(fetchImpl, headers, login, repo.name),
      files: await fetchSourceFiles(fetchImpl, headers, login, repo.name),
    })
  }
  return detailed
}

module.exports = {
  parseGitHubLogin,
  selectPublicRepos,
  selectSourceFiles,
  fetchPublicProfile,
}
