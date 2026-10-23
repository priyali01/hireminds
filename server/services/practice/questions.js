const { SKILL_DICTIONARY } = require('../ats/dictionary')
const { skillsPresent } = require('../ats/match')
const { splitResume } = require('../ats/sections')
const { parseJobDescription } = require('../ats/jdParser')

function difficultyFrom(role, jobDescription) {
  const roleText = String(role || '')
  if (/\b(intern|fresher|junior)\b/i.test(roleText)) return 'easy'
  const years = String(jobDescription || '').match(/(\d+)\+?\s*(?:years|yrs)/i)
  if (/\b(senior|staff|principal|lead)\b/i.test(roleText) || (years && Number(years[1]) >= 4)) return 'hard'
  return 'medium'
}

function firstProjectName(resumeText) {
  const projects = splitResume(resumeText || '').sections.projects || ''
  const line = projects.split('\n').map((item) => item.trim()).find((item) => item.length >= 3 && item.length <= 60)
  return line || null
}

function practiceQuestion(fields) {
  return {
    sourceUrl: null,
    sourceDate: null,
    sourceTitle: null,
    ...fields,
  }
}

function buildQuestionPlan({ role, company, jobDescription, resumeText, sources = [], now = new Date() }) {
  const parsed = parseJobDescription(jobDescription || '')
  const difficulty = difficultyFrom(role, jobDescription)
  const questions = []
  const required = (parsed.required || []).filter((skill) => {
    if (skill.canonical !== 'javascript') return true
    const hasNode = (parsed.required || []).some((other) => other.canonical === 'node.js')
    return !(hasNode && /node\.js|nodejs/i.test(jobDescription || ''))
  })
  const source = String(jobDescription || '').toLowerCase()
  const skills = required
    .slice()
    .sort((a, b) => {
      const aIndex = source.indexOf(a.canonical)
      const bIndex = source.indexOf(b.canonical)
      return (aIndex < 0 ? 9999 : aIndex) - (bIndex < 0 ? 9999 : bIndex)
    })
    .slice(0, 2)

  if (skills.length === 0) {
    questions.push(practiceQuestion({
      text: `What technical work have you done that matches a ${role} role? Stay with work you actually did.`,
      round: 'technical',
      origin: 'practice',
      difficulty,
    }))
  }
  for (const skill of skills) {
    questions.push(practiceQuestion({
      text: `Walk through how you have used ${skill.canonical} as a ${role}. Stay with work you actually did.`,
      round: 'technical',
      origin: 'practice',
      difficulty,
    }))
  }

  const project = firstProjectName(resumeText)
  if (project) {
    questions.push(practiceQuestion({
      text: `Tell me about ${project}. What did you implement yourself?`,
      round: 'project',
      origin: 'practice',
      difficulty,
    }))
  }

  questions.push(practiceQuestion({
    text: 'Tell me about a time you had to explain a technical decision. What was the situation, what did you do, and what happened?',
    round: 'behavioral',
    origin: 'practice',
    difficulty,
  }))
  questions.push(practiceQuestion({
    text: company
      ? `Why are you applying for this ${role} role at ${company}?`
      : `Why are you applying for this ${role} role?`,
    round: 'hr',
    origin: 'practice',
    difficulty,
  }))

  const cutoff = new Date(now)
  cutoff.setFullYear(cutoff.getFullYear() - 4)
  const seen = new Set()
  for (const source of sources || []) {
    if (!source || !source.url || !source.excerpt) continue
    if (source.kind !== 'verified' && source.kind !== 'reported') continue
    if (source.publishedAt && new Date(source.publishedAt) < cutoff) continue
    const key = source.excerpt.trim().toLowerCase()
    if (seen.has(key)) continue
    const mentioned = skillsPresent(source.excerpt, SKILL_DICTIONARY)
    if (mentioned.length === 0) continue
    seen.add(key)
    const sentence = source.excerpt
      .split(/(?<=[.!?])\s+/)
      .find((part) => skillsPresent(part, SKILL_DICTIONARY).length) || source.excerpt.trim()
    questions.push({
      text: `A ${source.kind} source mentions this topic: ${sentence.trim()} How would you answer it from your own experience?`,
      round: 'technical',
      origin: source.kind,
      sourceUrl: source.url,
      sourceDate: source.publishedAt || null,
      sourceTitle: source.title || null,
      difficulty,
    })
  }

  return { questions, difficulty }
}

module.exports = { buildQuestionPlan }
