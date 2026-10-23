const { SKILL_DICTIONARY } = require('../ats/dictionary')
const { findSkill } = require('../ats/match')
const { lineAround } = require('../ats/match')
const { splitResume } = require('../ats/sections')
const { parseJobDescription } = require('../ats/jdParser')
const { rankProjects } = require('./rank')

function skillByName(name) {
  return SKILL_DICTIONARY.find((skill) => skill.canonical === name)
}

function quoteFor(repo, skill) {
  for (const file of repo.files || []) {
    const found = findSkill(file.text || '', skill)
    if (!found) continue
    const quote = lineAround(file.text, found.index)
    if (quote) return { source: 'github', quote, ref: `${repo.name}/${file.path}` }
  }
  const readme = repo.readme || ''
  const sentence = readme.split(/(?<=[.!?])\s+/).map((part) => part.trim()).find((part) => findSkill(part, skill))
  if (sentence) return { source: 'github', quote: sentence, ref: repo.name }
  const meta = [repo.name, repo.description].filter(Boolean).join('\n')
  const found = findSkill(meta, skill)
  if (found) {
    const quote = lineAround(meta, found.index)
    if (quote) return { source: 'github', quote, ref: repo.name }
  }
  return null
}

function proposeResumeEdits({ resumeText, jobDescription, repos = [] }) {
  const resume = String(resumeText || '')
  const parsed = parseJobDescription(jobDescription || '')
  const wanted = [...parsed.required, ...parsed.preferred]
  const demonstrated = []
  const evidenceBySkill = new Map()

  for (const skill of wanted) {
    const resumeHit = findSkill(resume, skill)
    let repoQuote = null
    for (const repo of repos) {
      repoQuote = quoteFor(repo, skill)
      if (repoQuote) break
    }
    if (!resumeHit && !repoQuote) continue
    demonstrated.push(skill.canonical)
    const quotes = []
    if (resumeHit) {
      const quote = lineAround(resume, resumeHit.index)
      if (quote) quotes.push({ source: 'resume', quote, ref: 'resume' })
    }
    if (repoQuote) quotes.push(repoQuote)
    evidenceBySkill.set(skill.canonical, quotes)
  }

  const suggestedToLearn = wanted
    .map((skill) => skill.canonical)
    .filter((name) => !demonstrated.includes(name))

  const sections = splitResume(resume)
  const changes = []
  const skillsText = (sections.sections.skills || '').trim()
  const missingOnResume = demonstrated.filter((name) => {
    const skill = skillByName(name)
    return skill && !findSkill(skillsText, skill)
  })

  if (skillsText && missingOnResume.length) {
    changes.push({
      id: 'skills-demonstrated',
      section: 'skills',
      action: 'revise',
      before: skillsText,
      after: `${skillsText}, ${missingOnResume.join(', ')}`,
      evidence: missingOnResume.flatMap((name) => evidenceBySkill.get(name) || []),
      status: 'pending',
    })
  }

  const ranked = rankProjects(repos, jobDescription)
  const highlight = ranked.projects.find((project) => project.recommendation === 'highlight' || project.recommendation === 'keep')
  if (highlight) {
    const repo = repos.find((item) => item.name === highlight.name)
    const skill = (highlight.demonstratedSkills || []).map(skillByName).find(Boolean)
    const quote = skill ? quoteFor(repo, skill) : null
    if (quote && quote.quote) {
      const projectLines = (sections.sections.projects || '').split('\n').map((line) => line.trim()).filter(Boolean)
      const before = projectLines.find((line) => line.toLowerCase().includes(String(repo.name).replace(/-/g, ' ').toLowerCase()))
        || projectLines[0]
        || ''
      changes.push({
        id: `project-${repo.name}`,
        section: 'projects',
        action: before ? 'revise' : 'add',
        before,
        after: before ? `${before}\n${quote.quote}` : `${repo.name}\n${quote.quote}`,
        evidence: [quote],
        status: 'pending',
      })
    }
  }

  const summary = (sections.sections.summary || '').trim()
  if (summary && highlight) {
    const repo = repos.find((item) => item.name === highlight.name)
    const skill = (highlight.demonstratedSkills || []).map(skillByName).find(Boolean)
    const quote = skill && repo ? quoteFor(repo, skill) : null
    if (quote && quote.quote && !summary.includes(quote.quote)) {
      changes.push({
        id: 'summary-evidence',
        section: 'summary',
        action: 'revise',
        before: summary,
        after: `${summary}\n${quote.quote}`,
        evidence: [quote],
        status: 'pending',
      })
    }
  }

  for (const project of ranked.projects.filter((item) => item.recommendation === 'remove')) {
    const line = (sections.sections.projects || '').split('\n').map((item) => item.trim()).find((item) => item && item.toLowerCase().includes(project.name.toLowerCase()))
    if (!line) continue
    changes.push({
      id: `remove-${project.name}`,
      section: 'projects',
      action: 'remove',
      before: line,
      after: '',
      evidence: [{ source: 'resume', quote: line, ref: 'resume' }],
      status: 'pending',
    })
  }

  return {
    originalText: resume,
    changes,
    demonstratedSkills: demonstrated,
    suggestedToLearn,
    projects: ranked.projects,
  }
}

module.exports = { proposeResumeEdits }
