const { ATS_CONFIG, assertWeights } = require('../../config/ats.config')
const { SKILL_DICTIONARY } = require('./dictionary')
const { findSkill, lineAround } = require('./match')
const { splitResume } = require('./sections')
const { parseJobDescription } = require('./jdParser')

const DEGREE_RE = /\b(bachelor(?:'s)?|master(?:'s)?|b\.?\s?tech|m\.?\s?tech|b\.?\s?e\b|m\.?\s?e\b|b\.?\s?sc|b\.?\s?a\b|degree)\b/i
const STATED_YEARS_RE = /(\d+(?:\.\d+)?)\+?\s*(?:years|yrs)\b/i
const RANGE_RE = /(19\d{2}|20\d{2})\s*(?:-|–|to)\s*(present|current|now|19\d{2}|20\d{2})/gi

function round1(value) {
  return Math.round((value + Number.EPSILON) * 10) / 10
}

function combineScores(categoryScores, weights = ATS_CONFIG.weights, threshold = ATS_CONFIG.gateThreshold) {
  assertWeights(weights)
  const scoreExact = Object.entries(weights).reduce((sum, [key, weight]) => {
    return sum + weight * (categoryScores[key] / 100)
  }, 0)
  return {
    scoreExact,
    scoreDisplay: round1(scoreExact),
    passesThreshold: scoreExact >= threshold,
    threshold,
  }
}

function evidenceFor(skill, resume) {
  const buckets = [
    ['projects', resume.sections.projects || '', 100],
    ['experience', resume.sections.experience || '', 100],
    ['skills', resume.sections.skills || '', 60],
    ['other', resume.text, 40],
  ]

  for (const [section, text, credit] of buckets) {
    const found = findSkill(text, skill)
    if (!found) continue
    if (section === 'other') {
      const inKnown = ['projects', 'experience', 'skills', 'education'].some((name) => {
        return findSkill(resume.sections[name] || '', skill)
      })
      if (inKnown) continue
    }
    return {
      section,
      credit,
      snippet: lineAround(text, found.index),
      matchedAlias: found.alias,
    }
  }

  return null
}

function scoreRequired(resume, jd) {
  if (!jd.required.length) {
    return category('requiredSkills', null, {
      uncertain: [{
        name: 'required skills',
        reason: 'The job description does not name required skills in a way the parser can verify. No score was invented for this category.',
      }],
      reasons: ['Required skills could not be verified from the job description.'],
      suggestions: ['Paste a job description with a Requirements section that names the tools, for example JavaScript, Node.js, MongoDB.'],
    })
  }

  const matched = []
  const missing = []
  let total = 0

  for (const requirement of jd.required) {
    const skill = { canonical: requirement.canonical, aliases: requirement.aliases }
    const evidence = evidenceFor(skill, resume)
    if (!evidence) {
      missing.push({
        name: requirement.canonical,
        importance: 'required',
        reason: 'Not found in projects, experience, the skills list, or the rest of the resume.',
      })
      continue
    }
    total += evidence.credit
    matched.push({
      name: requirement.canonical,
      importance: 'required',
      section: evidence.section,
      credit: evidence.credit,
      snippet: evidence.snippet,
      matchedAlias: evidence.matchedAlias,
      reason: evidence.credit === 100
        ? `Found in ${evidence.section}, which counts as evidence of use.`
        : evidence.section === 'skills'
          ? 'Found only in the skills list. That is partial credit until a project or experience bullet shows it.'
          : 'Found outside the skills, project, and experience sections. Partial credit.',
    })
  }

  const score = total / jd.required.length
  const suggestions = missing.slice(0, 4).map((item) => {
    return `Show ${item.name} in a project or experience bullet. Listing it only under skills, or omitting it, leaves a required gap.`
  })

  return category('requiredSkills', score, {
    matched,
    missing,
    reasons: [`${matched.length} of ${jd.required.length} required skills have some evidence. Skills with only a list mention get 60, and skills shown in a project or a job get 100.`],
    suggestions,
  })
}

function statedYears(text) {
  const match = String(text || '').match(STATED_YEARS_RE)
  return match ? Number(match[1]) : null
}

function estimatedYears(text, nowYear) {
  const ranges = []
  const source = String(text || '')
  for (const match of source.matchAll(RANGE_RE)) {
    const start = Number(match[1])
    const end = /present|current|now/i.test(match[2]) ? nowYear : Number(match[2])
    if (end >= start && end - start <= 40) ranges.push(end - start)
  }
  if (!ranges.length) return null
  return ranges.reduce((sum, value) => sum + value, 0)
}

function overlapScore(haystack, phrases) {
  const words = [...new Set(
    phrases.join(' ').toLowerCase().match(/[a-z][a-z0-9+#.]{4,}/g) || []
  )].filter((word) => !STOPWORDS.has(word))
  if (!words.length) return null
  const hits = words.filter((word) => findSkill(haystack, { canonical: word, aliases: [word] }))
  return (hits.length / words.length) * 100
}

const STOPWORDS = new Set([
  'about', 'after', 'again', 'their', 'there', 'these', 'those', 'which', 'while',
  'would', 'could', 'should', 'using', 'build', 'built', 'other', 'under', 'where',
  'being', 'been', 'have', 'from', 'with', 'that', 'this', 'your', 'will', 'into',
  'such', 'than', 'them', 'they', 'each', 'across', 'within', 'team', 'role', 'work',
  'working', 'including', 'based', 'ability', 'strong',
])

function scoreExperience(resume, jd, nowYear) {
  const experienceText = resume.sections.experience || ''
  const yearsFound = experienceText ? (statedYears(experienceText) ?? estimatedYears(experienceText, nowYear)) : null
  const yearsAreEstimate = experienceText && statedYears(experienceText) == null && yearsFound != null
  const responsibilityScore = jd.responsibilities.length ? overlapScore(experienceText, jd.responsibilities) : null

  if (jd.minYears == null && responsibilityScore == null) {
    return category('experience', 100, {
      reasons: ['The job description does not state a minimum number of years or a responsibility list, so experience was not penalised.'],
    })
  }

  if (jd.minYears != null && yearsFound == null && responsibilityScore == null) {
    return category('experience', null, {
      uncertain: [{
        name: 'years of experience',
        reason: `The job asks for ${jd.minYears} years, and the resume does not state years or dates that can be checked. This was not scored as zero.`,
      }],
      reasons: ['Experience could not be verified.'],
      suggestions: ['Add dates or a stated duration under Experience or Internships.'],
    })
  }

  const parts = []
  const reasons = []
  const uncertain = []
  const suggestions = []

  if (jd.minYears != null && yearsFound == null) {
    uncertain.push({
      name: 'years of experience',
      reason: `The job asks for ${jd.minYears} years. The resume does not state a duration, so years were left unverified instead of being treated as zero.`,
    })
    suggestions.push('Add role dates or a phrase such as "6 month internship" under Experience.')
  } else if (jd.minYears != null) {
    const yearsScore = Math.max(0, Math.min(100, (yearsFound / jd.minYears) * 100))
    parts.push(yearsScore)
    reasons.push(yearsAreEstimate
      ? `About ${yearsFound} years were estimated from date ranges. The job asks for ${jd.minYears}. Date ranges can overlap, so this is an estimate, not a claimed total.`
      : `The resume states about ${yearsFound} years. The job asks for ${jd.minYears}.`)
    if (yearsFound < jd.minYears) {
      suggestions.push(`The job asks for ${jd.minYears} years and the resume supports about ${yearsFound}. Do not add years you did not work. Describe the relevant work you do have.`)
    }
  }

  if (responsibilityScore != null) {
    parts.push(responsibilityScore)
    reasons.push('Responsibility lines from the job were compared with the experience section using whole words.')
    if (responsibilityScore < 50) {
      suggestions.push('Rewrite an experience bullet so it uses the responsibilities named in the job, with a tool and an outcome.')
    }
  }

  const score = parts.length ? parts.reduce((sum, value) => sum + value, 0) / parts.length : null
  return category('experience', score, { reasons, uncertain, suggestions })
}

function scoreProjects(resume, jd) {
  if (!jd.required.length) {
    return category('projects', null, {
      uncertain: [{ name: 'project relevance', reason: 'Project relevance needs required skills from the job description.' }],
      reasons: ['Projects were not scored because required skills were not verified.'],
    })
  }

  const projectText = resume.sections.projects || ''
  let shown = 0
  const matched = []
  const missing = []

  for (const requirement of jd.required) {
    const skill = { canonical: requirement.canonical, aliases: requirement.aliases }
    const found = findSkill(projectText, skill)
    if (found) {
      shown += 1
      matched.push({
        name: requirement.canonical,
        section: 'projects',
        snippet: lineAround(projectText, found.index),
        matchedAlias: found.alias,
        reason: 'This required skill appears in a project description.',
      })
    } else {
      missing.push({
        name: requirement.canonical,
        reason: 'Not found in the projects section.',
      })
    }
  }

  const skillScore = (shown / jd.required.length) * 100
  const descriptionScore = jd.responsibilities.length && projectText
    ? overlapScore(projectText, jd.responsibilities)
    : null
  const score = descriptionScore == null ? skillScore : (skillScore * 0.75) + (descriptionScore * 0.25)
  const suggestions = missing.slice(0, 3).map((item) => {
    return `If you have built something with ${item.name}, add that project and name ${item.name} in a bullet. A skills-list mention does not count here.`
  })

  return category('projects', score, {
    matched,
    missing,
    reasons: [`${shown} of ${jd.required.length} required skills are written in Projects.`],
    suggestions,
  })
}

function scorePreferred(resume, jd) {
  const items = jd.preferred
  if (!items.length) {
    return category('preferred', 100, {
      reasons: ['The job description does not list preferred skills, so this category was not used to penalise the resume.'],
    })
  }

  const matched = []
  const missing = []
  for (const requirement of items) {
    const skill = { canonical: requirement.canonical, aliases: requirement.aliases }
    const evidence = evidenceFor(skill, resume)
    if (!evidence) {
      missing.push({ name: requirement.canonical, importance: 'preferred', reason: 'Preferred skill not found.' })
      continue
    }
    matched.push({
      name: requirement.canonical,
      importance: 'preferred',
      section: evidence.section,
      snippet: evidence.snippet,
      matchedAlias: evidence.matchedAlias,
      reason: 'Preferred skill found. It is not required, and it is not counted again inside required skills.',
    })
  }

  const score = (matched.length / items.length) * 100
  return category('preferred', score, {
    matched,
    missing,
    reasons: [`${matched.length} of ${items.length} preferred skills were found.`],
    suggestions: missing.slice(0, 3).map((item) => `Add ${item.name} only if you have used it. Preferred skills are not mandatory.`),
  })
}

function readabilityScore(resume) {
  const words = (resume.text.match(/[A-Za-z0-9][A-Za-z0-9+.#/]*/g) || []).length
  let score = 0
  const reasons = []
  if (words >= 150 && words <= 1200) {
    score += 40
    reasons.push(`${words} words, which is a readable length.`)
  } else if (words >= 80) {
    score += 20
    reasons.push(`${words} words. A full one-page resume is usually 150 to 900 words.`)
  } else {
    reasons.push(`${words} words. The text is very short, so a parser may have missed most of the page.`)
  }

  const headings = ['education', 'skills'].filter((name) => resume.detected.includes(name))
  const workHeading = resume.detected.includes('projects') || resume.detected.includes('experience')
  if (headings.length === 2 && workHeading) {
    score += 40
    reasons.push('Education, Skills, and Projects or Experience headings were found.')
  } else {
    score += headings.length * 10
    reasons.push('Some standard headings are missing. Use Education, Skills, and Projects or Experience on their own lines.')
  }

  const odd = resume.text.match(/[^\p{L}\p{N}\s@.,:;+|()\-/&%#'’"“”•·▪–—_]/gu) || []
  if (!resume.text || odd.length / resume.text.length < 0.05) {
    score += 20
    reasons.push('The extracted characters look like normal resume text.')
  } else {
    reasons.push('A lot of unusual characters were extracted. Re-export the file as a text PDF or DOCX.')
  }

  return { score: Math.min(100, score), reasons }
}

function scoreEducation(resume, jd) {
  const educationText = resume.sections.education || ''
  const readable = readabilityScore(resume)
  let educationScore = 100
  const reasons = []
  const missing = []
  const matched = []
  const suggestions = []

  if (jd.educationRequired) {
    if (DEGREE_RE.test(educationText)) {
      educationScore = 100
      matched.push({
        name: jd.educationRequired,
        section: 'education',
        snippet: educationText.trim().split('\n').find((line) => DEGREE_RE.test(line)) || '',
        reason: 'A degree is written under Education.',
      })
      reasons.push(`The job mentions ${jd.educationRequired}, and Education contains a degree.`)
    } else if (resume.detected.includes('education')) {
      educationScore = 40
      missing.push({
        name: jd.educationRequired,
        reason: 'Education exists, but the degree wording was not found.',
      })
      suggestions.push(`Write the degree explicitly, such as B.Tech or Bachelor, because the job mentions ${jd.educationRequired}.`)
    } else {
      educationScore = 0
      missing.push({
        name: jd.educationRequired,
        reason: 'No Education section was found.',
      })
      suggestions.push('Add an Education heading and the degree line.')
    }
  } else {
    reasons.push('The job does not state a degree requirement, so education was not penalised.')
  }

  const score = (educationScore * 0.6) + (readable.score * 0.4)
  return category('educationReadability', score, {
    matched,
    missing,
    reasons: reasons.concat(readable.reasons),
    suggestions,
  })
}

function category(key, score, extras = {}) {
  return {
    key,
    score: score == null ? null : Math.max(0, Math.min(100, score)),
    matched: extras.matched || [],
    missing: extras.missing || [],
    uncertain: extras.uncertain || [],
    reasons: extras.reasons || [],
    suggestions: extras.suggestions || [],
  }
}

function scoreResumeAgainstJob(resumeText, jobDescription, options = {}) {
  const weights = options.weights || ATS_CONFIG.weights
  const threshold = options.threshold == null ? ATS_CONFIG.gateThreshold : options.threshold
  const nowYear = options.nowYear || new Date().getFullYear()
  assertWeights(weights)

  const resume = splitResume(resumeText)
  const jd = parseJobDescription(jobDescription, options.dictionary || SKILL_DICTIONARY)
  const categories = {
    requiredSkills: scoreRequired(resume, jd),
    experience: scoreExperience(resume, jd, nowYear),
    projects: scoreProjects(resume, jd),
    preferred: scorePreferred(resume, jd),
    educationReadability: scoreEducation(resume, jd),
  }

  const blocking = Object.values(categories).filter((item) => item.score == null)
  const warnings = blocking.flatMap((item) => item.uncertain.map((entry) => entry.reason))
  const recommendations = Object.values(categories).flatMap((item) => item.suggestions).slice(0, 8)

  if (blocking.length) {
    return {
      status: 'incomplete',
      scoreExact: null,
      scoreDisplay: null,
      passesThreshold: false,
      gateEligible: false,
      threshold,
      weights,
      rubricVersion: ATS_CONFIG.rubricVersion,
      disclaimer: ATS_CONFIG.disclaimer,
      categories: withWeights(categories, weights),
      requirements: publicRequirements(jd),
      warnings,
      recommendations,
      sectionsDetected: resume.detected,
    }
  }

  const combined = combineScores({
    requiredSkills: categories.requiredSkills.score,
    experience: categories.experience.score,
    projects: categories.projects.score,
    preferred: categories.preferred.score,
    educationReadability: categories.educationReadability.score,
  }, weights, threshold)

  return {
    status: 'completed',
    ...combined,
    gateEligible: true,
    weights,
    rubricVersion: ATS_CONFIG.rubricVersion,
    disclaimer: ATS_CONFIG.disclaimer,
    categories: withWeights(categories, weights),
    requirements: publicRequirements(jd),
    warnings: Object.values(categories).flatMap((item) => item.uncertain.map((entry) => entry.reason)),
    recommendations,
    sectionsDetected: resume.detected,
  }
}

function withWeights(categories, weights) {
  const labeled = {}
  for (const [key, value] of Object.entries(categories)) {
    labeled[key] = {
      ...value,
      weight: weights[key],
      scoreDisplay: value.score == null ? null : round1(value.score),
    }
  }
  return labeled
}

function publicRequirements(jd) {
  return {
    required: jd.required.map(publicRequirement),
    preferred: jd.preferred.map(publicRequirement),
    minYears: jd.minYears,
    educationRequired: jd.educationRequired,
    responsibilities: jd.responsibilities,
    sectionsDetected: jd.sectionsDetected,
  }
}

function publicRequirement(item) {
  return {
    canonical: item.canonical,
    importance: item.importance,
    sourceText: item.sourceText,
  }
}

module.exports = {
  combineScores,
  round1,
  scoreResumeAgainstJob,
  evidenceFor,
}
