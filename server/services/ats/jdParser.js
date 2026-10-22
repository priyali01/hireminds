const { SKILL_DICTIONARY } = require('./dictionary')
const { findSkill, skillsPresent } = require('./match')
const { splitJobDescription } = require('./sections')

const DEGREE_RE = /\b(bachelor(?:'s)?|master(?:'s)?|b\.?\s?tech|m\.?\s?tech|b\.?\s?e\b|m\.?\s?e\b|b\.?\s?sc|degree|graduate)\b/i
const MIN_YEARS_RE = /(?:minimum|at least|min\.?)\s+(\d+(?:\.\d+)?)\+?\s*(?:years|yrs)\b|(\d+(?:\.\d+)?)\+?\s*(?:years|yrs)\s+(?:of\s+)?(?:relevant\s+|professional\s+|hands-on\s+)?experience\b/i

function uniqueSkills(skills) {
  const seen = new Set()
  const result = []
  for (const skill of skills) {
    if (seen.has(skill.canonical)) continue
    seen.add(skill.canonical)
    result.push(skill)
  }
  return result
}

function lineImportance(line) {
  if (/\b(preferred|nice to have|good to have|bonus|optional)\b/i.test(line)) return 'preferred'
  if (/\b(required|must|mandatory|proficient)\b/i.test(line)) return 'required'
  return null
}

function skillsOnLine(line) {
  return skillsPresent(line, SKILL_DICTIONARY)
}

function parseJobDescription(jobDescription, dictionary = SKILL_DICTIONARY) {
  const { text, sections, detected } = splitJobDescription(jobDescription)
  const required = []
  const preferred = []

  for (const skill of skillsPresent(sections.required || '', dictionary)) {
    required.push(requirement(skill, 'required', 'requirements section'))
  }
  for (const skill of skillsPresent(sections.preferred || '', dictionary)) {
    preferred.push(requirement(skill, 'preferred', 'preferred section'))
  }

  for (const line of text.split('\n')) {
    const importance = lineImportance(line)
    if (!importance) continue
    const bucket = importance === 'required' ? required : preferred
    for (const skill of skillsOnLine(line)) {
      bucket.push(requirement(skill, importance, line.trim().slice(0, 180)))
    }
  }

  const experienceWith = /experience with ([^\n.]{0,80})/gi
  let experienceMatch
  while ((experienceMatch = experienceWith.exec(text))) {
    for (const skill of skillsPresent(experienceMatch[1], dictionary)) {
      required.push(requirement(skill, 'required', experienceMatch[0].trim()))
    }
  }

  const requiredSkills = uniqueSkills(required)
  const requiredNames = new Set(requiredSkills.map((item) => item.canonical))
  const preferredSkills = uniqueSkills(preferred).filter((item) => !requiredNames.has(item.canonical))

  const yearsMatch = text.match(MIN_YEARS_RE)
  const minYears = yearsMatch ? Number(yearsMatch[1] || yearsMatch[2]) : null

  const responsibilities = (sections.responsibilities || '')
    .split('\n')
    .map((line) => line.replace(/^[\s\-•*]+/, '').trim())
    .filter((line) => line.length >= 12)

  const educationSource = `${sections.education || ''}\n${sections.required || ''}`
  let educationRequired = (educationSource.match(DEGREE_RE) || [null])[0]
  if (!educationRequired) {
    for (const line of text.split('\n')) {
      if (lineImportance(line) === 'required' && DEGREE_RE.test(line)) {
        educationRequired = (line.match(DEGREE_RE) || [null])[0]
        break
      }
    }
  }

  return {
    text,
    sectionsDetected: detected,
    required: requiredSkills,
    preferred: preferredSkills,
    minYears: Number.isFinite(minYears) ? minYears : null,
    responsibilities,
    educationRequired,
    dictionarySize: dictionary.length,
  }
}

function requirement(skill, importance, sourceText) {
  return {
    canonical: skill.canonical,
    importance,
    sourceText,
    aliases: skill.aliases,
  }
}

function skillByName(canonical, dictionary = SKILL_DICTIONARY) {
  return dictionary.find((skill) => skill.canonical === canonical) || null
}

module.exports = {
  parseJobDescription,
  skillByName,
  findSkill,
}
