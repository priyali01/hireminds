/**
 * Mandatory eligibility is separate from the job-match total.
 * A condition is confirmed only when the resume states the fact.
 * Silence is unverified, not a failure.
 */

const DEGREE_LEVELS = [
  { rank: 1, name: 'doctorate', re: /\b(ph\.?d|doctorate)\b/i },
  { rank: 2, name: 'master', re: /\b(master(?:'s)?|m\.?\s?tech|m\.?\s?e\b|m\.?\s?sc|mba)\b/i },
  { rank: 3, name: 'bachelor', re: /\b(bachelor(?:'s)?|b\.?\s?tech|b\.?\s?e\b|b\.?\s?sc|b\.?\s?a\b)\b/i },
]

const SECONDARY_RE = /\b(high school|higher secondary|class 12|12th|hsc)\b/i
const STATED_YEARS_RE = /(\d+(?:\.\d+)?)\+?\s*(?:years|yrs)\b/i

function requiredDegree(source) {
  if (!source) return null
  return DEGREE_LEVELS.find((level) => level.re.test(source)) || null
}

function resumeDegree(educationText) {
  if (!educationText) return null
  return DEGREE_LEVELS.find((level) => level.re.test(educationText)) || null
}

function classifyDegree(jdEducation, educationText) {
  const required = requiredDegree(jdEducation)
  if (!required) return null

  const found = resumeDegree(educationText)
  const snippet = (educationText || '').trim().split('\n').find((line) => line.trim()) || ''

  if (found && found.rank <= required.rank) {
    return {
      name: `${required.name}'s degree`,
      status: 'meets',
      score: 100,
      snippet: snippet.slice(0, 180),
      reason: `The job asks for a ${required.name}'s degree, and Education states a ${found.name}'s degree or higher.`,
    }
  }

  if (found && found.rank > required.rank) {
    return {
      name: `${required.name}'s degree`,
      status: 'unmet',
      score: 0,
      snippet: snippet.slice(0, 180),
      reason: `The job asks for a ${required.name}'s degree. Education states a ${found.name}'s degree, which is below that requirement.`,
    }
  }

  if (educationText && SECONDARY_RE.test(educationText) && !found) {
    return {
      name: `${required.name}'s degree`,
      status: 'unmet',
      score: 0,
      snippet: snippet.slice(0, 180),
      reason: `The job asks for a ${required.name}'s degree. Education names secondary school and no degree at that level.`,
    }
  }

  return {
    name: `${required.name}'s degree`,
    status: 'unverified',
    score: null,
    snippet: snippet.slice(0, 180),
    reason: `The job asks for a ${required.name}'s degree. Education does not state enough to confirm or deny it, so this is unverified rather than a failure.`,
  }
}

function classifyYears(minYears, experienceText) {
  if (minYears == null) return null
  const match = String(experienceText || '').match(STATED_YEARS_RE)
  if (!match) {
    return {
      name: `${minYears} years of experience`,
      status: 'unverified',
      score: null,
      snippet: '',
      reason: `The job asks for ${minYears} years. The resume does not state a number of years. Date ranges were not converted into a total, and this was not treated as a failure.`,
    }
  }

  const years = Number(match[1])
  const line = (experienceText || '').split('\n').find((item) => STATED_YEARS_RE.test(item)) || ''
  if (years >= minYears) {
    return {
      name: `${minYears} years of experience`,
      status: 'meets',
      score: 100,
      snippet: line.trim().slice(0, 180),
      reason: `The resume states ${years} years. The job asks for ${minYears}.`,
    }
  }

  return {
    name: `${minYears} years of experience`,
    status: 'unmet',
    score: 0,
    snippet: line.trim().slice(0, 180),
    reason: `The resume states ${years} years. The job asks for ${minYears}. This is a confirmed gap, not an estimate.`,
  }
}

function groupEligibility(conditions) {
  const present = conditions.filter(Boolean)
  return {
    meets: present.filter((item) => item.status === 'meets'),
    unmet: present.filter((item) => item.status === 'unmet'),
    unverified: present.filter((item) => item.status === 'unverified'),
  }
}

module.exports = {
  classifyDegree,
  classifyYears,
  groupEligibility,
}
