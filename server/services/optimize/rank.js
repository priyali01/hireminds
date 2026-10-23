const { SKILL_DICTIONARY } = require('../ats/dictionary')
const { findSkill, lineAround } = require('../ats/match')
const { parseJobDescription } = require('../ats/jdParser')
const { redactSecrets } = require('./github')

const RUBRIC_VERSION = 'h02-projects-v1'

function words(text) {
  return String(text || '').trim().split(/\s+/).filter(Boolean)
}

function targetSkills(jobDescription) {
  const parsed = parseJobDescription(jobDescription || '')
  return [...parsed.required, ...parsed.preferred]
}

function isUntrustedInstruction(line) {
  return /ignore\s+(?:all\s+|any\s+|previous\s+|prior\s+)?instructions|system\s+prompt|<\s*\/?\s*script\b/i.test(line)
}

function trustedText(text) {
  return String(text || '')
    .split('\n')
    .filter((line) => !isUntrustedInstruction(line))
    .join('\n')
}

function repoParts(repo) {
  const fileText = trustedText((repo.files || []).map((file) => file.text || '').join('\n'))
  const readme = trustedText(repo.readme || '')
  const meta = [repo.name, repo.description, ...(repo.topics || []), repo.language].filter(Boolean).join('\n')
  return { fileText, readme, meta: trustedText(meta) }
}

function mentions(parts, word) {
  return new RegExp(`\\b${word}\\b`, 'i').test(`${parts.fileText}\n${parts.readme}\n${parts.meta}`)
}

function classifyTechnologies(parts) {
  const verified = []
  const declared = []
  for (const skill of SKILL_DICTIONARY) {
    if (findSkill(parts.fileText, skill)) verified.push(skill.canonical)
    else if (findSkill(parts.readme, skill) || findSkill(parts.meta, skill)) declared.push(skill.canonical)
  }
  if ((verified.includes('node.js') || declared.includes('node.js')) && !mentions(parts, 'javascript')) {
    return {
      verified: verified.filter((name) => name !== 'javascript'),
      declared: declared.filter((name) => name !== 'javascript'),
    }
  }
  return { verified, declared }
}

function readmeFeatures(readme) {
  return trustedText(readme)
    .split('\n')
    .filter((line) => /^#{1,3}\s+\S/.test(line))
    .map((line) => line.replace(/^#{1,3}\s+/, '').trim())
    .filter((line) => line.length >= 3 && line.length <= 120)
    .slice(0, 5)
}

function statedAchievements(text) {
  return trustedText(text)
    .split(/\n|(?<=[.!?])\s+/)
    .map((line) => line.trim())
    .filter((line) => line.length >= 12 && line.length <= 200)
    .filter((line) => /\d/.test(line))
    .filter((line) => /\b(built|reduced|increased|shipped|launched|handled|served|cut|improved)\b/i.test(line))
    .slice(0, 3)
    .map((line) => redactSecrets(line))
}

function evidenceSnippets(repo, verifiedNames) {
  const skills = verifiedNames
    .map((name) => SKILL_DICTIONARY.find((skill) => skill.canonical === name))
    .filter(Boolean)
  const snippets = []
  for (const file of repo.files || []) {
    const text = trustedText(file.text || '')
    for (const skill of skills) {
      const found = findSkill(text, skill)
      if (!found) continue
      const quote = redactSecrets(lineAround(text, found.index))
      if (!quote) continue
      snippets.push({ path: file.path, quote, verified: true })
      if (snippets.length >= 4) return snippets
    }
  }
  return snippets
}

function measure(repo, skills, requiredNames) {
  const parts = repoParts(repo)
  const demonstrated = []
  let evidence = 0
  let requiredEvidence = 0
  for (const skill of skills) {
    const inFile = findSkill(parts.fileText, skill)
    const inReadme = findSkill(parts.readme, skill)
    const inMeta = findSkill(parts.meta, skill)
    if (!inFile && !inReadme && !inMeta) continue
    const weight = inFile ? 100 : inReadme ? 70 : 40
    demonstrated.push(skill.canonical)
    evidence = Math.max(evidence, weight)
    if (requiredNames.has(skill.canonical)) requiredEvidence = Math.max(requiredEvidence, weight)
  }
  const relevance = skills.length === 0 ? 0 : Math.round((100 * demonstrated.length) / skills.length)
  return { demonstrated, evidence, relevance, requiredEvidence }
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

function recommendation({ relevance, evidence, score, readmeWords, requiredEvidence }) {
  if (requiredEvidence >= 70) return 'highlight'
  if (requiredEvidence > 0) return 'keep'
  if (relevance < 35 && readmeWords >= 150) return 'shorten'
  if (evidence >= 70 && relevance > 0 && score >= 55) return 'highlight'
  if (score >= 45 && relevance > 0) return 'keep'
  return 'remove'
}

function rankProjects(repos, jobDescription, { now = new Date() } = {}) {
  const parsed = parseJobDescription(jobDescription || '')
  const skills = [...parsed.required, ...parsed.preferred]
  const requiredNames = new Set(parsed.required.map((skill) => skill.canonical))
  const projects = (repos || []).map((repo) => {
    const measured = measure(repo, skills, requiredNames)
    const depth = depthScore(repo)
    const recency = recencyScore(repo.pushedAt, now)
    const score = Math.round((0.45 * measured.relevance) + (0.25 * measured.evidence) + (0.15 * depth) + (0.15 * recency))
    const readmeWords = words(repo.readme).length
    const label = recommendation({
      relevance: measured.relevance,
      evidence: measured.evidence,
      score,
      readmeWords,
      requiredEvidence: measured.requiredEvidence,
    })
    const parts = repoParts(repo)
    const technologies = classifyTechnologies(parts)
    const found = new Set([...technologies.verified, ...technologies.declared])
    let missingRequirements = skills.map((skill) => skill.canonical).filter((name) => !found.has(name))
    if (skills.some((skill) => skill.canonical === 'node.js') && !/\bjavascript\b/i.test(jobDescription || '')) {
      missingRequirements = missingRequirements.filter((name) => name !== 'javascript')
    }
    return {
      name: repo.name,
      githubId: repo.githubId || repo.id || null,
      htmlUrl: repo.htmlUrl || '',
      defaultBranch: repo.defaultBranch || '',
      structure: Array.isArray(repo.structure) ? repo.structure.slice(0, 40) : [],
      description: repo.description || '',
      rubricVersion: RUBRIC_VERSION,
      score,
      relevance: measured.relevance,
      evidence: measured.evidence,
      depth,
      recency,
      recommendation: label,
      demonstratedSkills: measured.demonstrated,
      verifiedTechnologies: technologies.verified,
      declaredTechnologies: technologies.declared,
      features: readmeFeatures(repo.readme),
      evidenceSnippets: evidenceSnippets(repo, technologies.verified),
      statedAchievements: statedAchievements(`${parts.readme}\n${parts.fileText}`),
      unverifiedClaims: technologies.declared,
      missingRequirements,
      reasons: [
        technologies.verified.length
          ? `Source files show ${technologies.verified.join(', ')}.`
          : technologies.declared.length
            ? `The description mentions ${technologies.declared.join(', ')}. Those skills were not found in a source file.`
            : 'No required or preferred skill from the job description appears in this project.',
        label === 'shorten' ? 'The write-up is long for how little it matches this role.' : null,
        label === 'highlight' ? 'A required skill appears in a source file or in the project description.' : null,
      ].filter(Boolean),
    }
  })
  projects.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
  return { rubricVersion: RUBRIC_VERSION, projects }
}

module.exports = {
  RUBRIC_VERSION,
  rankProjects,
  targetSkills,
  trustedText,
  SKILL_DICTIONARY,
}
