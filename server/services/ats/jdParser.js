const { SKILL_DICTIONARY, SOFT_SKILLS } = require('./dictionary')
const { findSkill, skillsPresent } = require('./match')
const { splitJobDescription, sectionForLine } = require('./sections')

const REQUIRED_CUE = /\b(required|must|mandatory|proficient|experience with|experience in|knowledge of|skilled in|expertise in|hands-on|you(?:'|’)ll need|you will need|looking for|we need)\b/i
const PREFERRED_CUE = /\b(preferred|nice to have|nice-to-have|good to have|bonus|optional|familiar with)\b/i
const HARD_REQUIRED_CUE = /\b(required|must|mandatory)\b/i

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

function letterCount(text) {
  return (String(text || '').match(/\p{L}/gu) || []).length
}

function isShortSkillLine(line) {
  const body = String(line || '').trim().replace(/^(?:[-•*▪]|\d+[.)])\s*/, '')
  const words = body.split(/\s+/).filter(Boolean)
  return words.length > 0 && words.length <= 6
}

function lineBucket(line, section) {
  if (section === 'preferred') return 'preferred'
  if (section !== 'responsibilities' && PREFERRED_CUE.test(line) && !HARD_REQUIRED_CUE.test(line)) return 'preferred'
  if (section === 'required') return 'required'
  if (section === 'responsibilities') return isShortSkillLine(line) ? 'required' : null
  if (REQUIRED_CUE.test(line)) return 'required'
  if (isShortSkillLine(line)) return 'required'
  return null
}

function collectListedSkills(text, dictionary) {
  const required = []
  const preferred = []
  let section = null
  for (const rawLine of String(text || '').split('\n')) {
    const heading = sectionForLine(rawLine)
    if (heading) {
      section = heading
      continue
    }
    const bucket = lineBucket(rawLine, section)
    if (!bucket) continue
    const target = bucket === 'preferred' ? preferred : required
    for (const skill of skillsPresent(rawLine, dictionary)) {
      target.push(requirement(skill, bucket, rawLine.trim().slice(0, 180)))
    }
  }
  return { required, preferred }
}

function parseJobDescription(jobDescription, dictionary = SKILL_DICTIONARY) {
  const { text, sections, detected } = splitJobDescription(jobDescription)
  const readableLetters = letterCount(text)
  const odd = text.match(/[^\p{L}\p{N}\s@.,:;+|()\-/&%#'’"“”•·▪–—_\n]/gu) || []
  const garbled = text.length > 0 && odd.length / text.length > 0.4
  const listed = collectListedSkills(text, dictionary)
  const required = listed.required
  const preferred = listed.preferred

  const requiredSkills = uniqueSkills(required)
  const requiredNames = new Set(requiredSkills.map((item) => item.canonical))
  const preferredSkills = uniqueSkills(preferred).filter((item) => !requiredNames.has(item.canonical))

  const soft = []
  soft.push(...skillsPresent(sections.required || '', SOFT_SKILLS).map((skill) => requirement(skill, 'required', 'requirements section')))
  soft.push(...skillsPresent(sections.preferred || '', SOFT_SKILLS).map((skill) => requirement(skill, 'preferred', 'preferred section')))
  for (const skill of skillsPresent(text, SOFT_SKILLS)) {
    soft.push(requirement(skill, 'mentioned', 'job description'))
  }
  const softSkills = uniqueSkills(soft)

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
    softSkills,
    minYears: Number.isFinite(minYears) ? minYears : null,
    responsibilities,
    educationRequired,
    dictionarySize: dictionary.length,
    extraction: requiredSkills.length
      ? { status: 'found', reason: 'Required skills were read from the job description.' }
      : (readableLetters < 40 || garbled)
        ? {
          status: 'failed',
          reason: 'The job description is too short or too garbled to extract skills. This is an extraction failure, not a finding that the job has no required skills.',
        }
        : {
          status: 'none_stated',
          reason: 'No required technical skills were stated in the job description. This category was left out of the job match.',
        },
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
