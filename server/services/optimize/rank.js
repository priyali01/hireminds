const { SKILL_DICTIONARY } = require('../ats/dictionary')
const { findSkill } = require('../ats/match')
const { parseJobDescription } = require('../ats/jdParser')

function words(text) {
  return String(text || '').trim().split(/\s+/).filter(Boolean)
}

function targetSkills(jobDescription) {
  const parsed = parseJobDescription(jobDescription || '')
  return [...parsed.required, ...parsed.preferred]
}

function repoParts(repo) {
  const fileText = (repo.files || []).map((file) => file.text || '').join('\n')
  const meta = [repo.name, repo.description, ...(repo.topics || []), repo.language].filter(Boolean).join('\n')
  return { fileText, readme: repo.readme || '', meta }
}

function measure(repo, skills) {
  const parts = repoParts(repo)
  const demonstrated = []
  let evidence = 0
  for (const skill of skills) {
    const inFile = findSkill(parts.fileText, skill)
    const inReadme = findSkill(parts.readme, skill)
    const inMeta = findSkill(parts.meta, skill)
    if (!inFile && !inReadme && !inMeta) continue
    demonstrated.push(skill.canonical)
    evidence = Math.max(evidence, inFile ? 100 : inReadme ? 70 : 40)
  }
  const relevance = skills.length === 0 ? 0 : Math.round((100 * demonstrated.length) / skills.length)
  return { demonstrated, evidence, relevance }
}

function depthScore(repo) {
  const languages = new Set([repo.language, ...Object.keys(repo.languages || {})].filter(Boolean))
  const fileCount = (repo.files || []).length
  const readmeWords = words(repo.readme).length
  return Math.min(100, languages.size * 20 + Math.min(40, fileCount * 15) + Math.min(40, Math.round(readmeWords / 5)))
}

function recencyScore(pushedAt, now) {
  if (!pushedAt) return 0
  const parsed = new Date(pushedAt)
  if (Number.isNaN(parsed.getTime())) return 0
  const days = (now.getTime() - parsed.getTime()) / 86400000
  if (days <= 180) return 100
  if (days <= 365) return 70
  if (days <= 730) return 40
  return 15
}

function recommendation({ relevance, evidence, score, readmeWords }) {
  if (relevance < 35 && readmeWords >= 150) return 'shorten'
  if (evidence >= 70 && relevance > 0 && score >= 55) return 'highlight'
  if (score >= 45 && relevance > 0) return 'keep'
  return 'remove'
}

function rankProjects(repos, jobDescription, { now = new Date() } = {}) {
  const skills = targetSkills(jobDescription)
  const projects = (repos || []).map((repo) => {
    const measured = measure(repo, skills)
    const depth = depthScore(repo)
    const recency = recencyScore(repo.pushedAt, now)
    const score = Math.round((0.45 * measured.relevance) + (0.25 * measured.evidence) + (0.15 * depth) + (0.15 * recency))
    const readmeWords = words(repo.readme).length
    const label = recommendation({ relevance: measured.relevance, evidence: measured.evidence, score, readmeWords })
    return {
      name: repo.name,
      htmlUrl: repo.htmlUrl || '',
      score,
      relevance: measured.relevance,
      evidence: measured.evidence,
      depth,
      recency,
      recommendation: label,
      demonstratedSkills: measured.demonstrated,
      reasons: [
        measured.demonstrated.length
          ? `Shows ${measured.demonstrated.join(', ')} in the repository text.`
          : 'No required or preferred skill from the job description appears in this repository.',
        label === 'shorten' ? 'The write-up is long for how little it matches this role.' : null,
        label === 'highlight' ? 'The repository contains the skill in a source file or README, not only in a title.' : null,
      ].filter(Boolean),
    }
  })
  projects.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
  return { projects }
}

module.exports = {
  rankProjects,
  targetSkills,
  SKILL_DICTIONARY,
}
