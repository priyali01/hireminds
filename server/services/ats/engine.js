const { ATS_CONFIG, assertWeights } = require('../../config/ats.config')
const { SKILL_DICTIONARY, SOFT_SKILLS } = require('./dictionary')
const { findSkill, findAlias, lineAround } = require('./match')
const { splitResume } = require('./sections')
const { parseJobDescription } = require('./jdParser')
const { weightedScore, round1, scoreCompatibility } = require('./compatibility')
const { classifyDegree, classifyYears, groupEligibility } = require('./eligibility')

/**
 * Job match assumptions for rubric h02:
 * - A technical skill is scored once, in required skills or in preferred keywords, never both.
 * - Evidence strength depends on how the skill is used, not how many times it appears.
 *   A work bullet scores 100, a bare name in that section scores 70, a skills-list
 *   mention scores 60, and any other mention scores 40. The strongest line wins.
 * - Project and experience points measure overlap with the job's responsibility domain.
 *   Dated, described work does not score 100 when that domain is absent. Skill names are not added again.
 * - Responsibility points use the remaining words after skill names and stopwords are removed.
 * - Soft skills are their own 5% category.
 * - Degree and stated years are eligibility. Unverified conditions are left out of the average and do not fail the gate.
 * - Keyword coverage and evidence confidence are reported and are not added to this score.
 * - Semantic matching is off unless a future local model is explicitly configured. No external API is called.
 */

const STOPWORDS = new Set([
  'about', 'after', 'again', 'their', 'there', 'these', 'those', 'which', 'while',
  'would', 'could', 'should', 'using', 'build', 'built', 'other', 'under', 'where',
  'being', 'been', 'have', 'from', 'with', 'that', 'this', 'your', 'will', 'into',
  'such', 'than', 'them', 'they', 'each', 'across', 'within', 'team', 'role', 'work',
  'working', 'including', 'based', 'ability', 'strong', 'design', 'designing',
  'develop', 'developing', 'maintain', 'maintaining', 'write', 'writing',
])

function combineScores(categoryScores, weights = ATS_CONFIG.jobMatchWeights, threshold = ATS_CONFIG.gateThreshold) {
  assertWeights(weights)
  const scoreExact = weightedScore(categoryScores, weights)
  return {
    scoreExact,
    scoreDisplay: scoreExact == null ? null : round1(scoreExact),
    passesThreshold: scoreExact != null && scoreExact >= threshold,
    threshold,
  }
}

function skillToken(word, dictionaries) {
  const stem = word.toLowerCase().replace(/s$/, '')
  return dictionaries.some((skill) => skill.aliases.some((alias) => {
    return alias.toLowerCase().split(/\s+/).some((part) => part.replace(/s$/, '') === stem)
  }))
}

function contentWords(phrase) {
  const tokens = String(phrase || '').toLowerCase().match(/[a-z][a-z0-9+#.]{3,}/g) || []
  return [...new Set(tokens)].filter((word) => !STOPWORDS.has(word) && !skillToken(word, SKILL_DICTIONARY.concat(SOFT_SKILLS)))
}

function demonstratedUse(line) {
  const words = line.match(/[A-Za-z0-9+.#]+/g) || []
  const bullet = /^\s*(?:[-•*]|\d+[.)])/.test(line)
  return words.length >= 6 || (bullet && words.length >= 4)
}

function bestLine(text, skill, fullCredit, bareCredit) {
  let best = null
  for (const line of String(text || '').split('\n')) {
    const found = findSkill(line, skill)
    if (!found) continue
    const credit = demonstratedUse(line) ? fullCredit : bareCredit
    if (best && best.credit >= credit) continue
    best = {
      credit,
      snippet: line.trim().slice(0, 180),
      matchedAlias: found.alias,
    }
  }
  return best
}

function evidenceFor(skill, resume) {
  // One skill, one score: the strongest line in projects or experience.
  // A later bullet beats an earlier bare name. Repeats do not add credit.
  let best = null
  for (const section of ['projects', 'experience']) {
    const found = bestLine(resume.sections[section] || '', skill, 100, 70)
    if (!found) continue
    if (best && best.credit >= found.credit) continue
    best = { section, ...found }
  }
  if (best) {
    return {
      ...best,
      reason: best.credit === 100
        ? `Used in a ${best.section} bullet. One demonstration is enough, and repeating the name does not raise this.`
        : `Named under ${best.section} without a bullet that shows the work. That is stronger than a skills-list mention and weaker than a demonstration.`,
    }
  }

  const listed = bestLine(resume.sections.skills || '', skill, 60, 60)
  if (listed) {
    return {
      section: 'skills',
      credit: 60,
      snippet: listed.snippet,
      matchedAlias: listed.matchedAlias,
      reason: 'Found only in the skills list, so the evidence is partial. Repeating it would not raise this.',
    }
  }

  const elsewhere = bestLine(resume.text, skill, 40, 40)
  if (!elsewhere) return null
  const inKnown = ['projects', 'experience', 'skills', 'education'].some((name) => {
    return findSkill(resume.sections[name] || '', skill)
  })
  if (inKnown) return null
  return {
    section: 'other',
    credit: 40,
    snippet: elsewhere.snippet,
    matchedAlias: elsewhere.matchedAlias,
    reason: 'Found outside projects, experience and the skills list, so the evidence is partial.',
  }
}

function scoreSkillList(resume, items, key, label) {
  if (!items.length) {
    return category(key, null, {
      reasons: [`The job description does not name ${label}, so this category was left out of the job match instead of being scored as 100.`],
    })
  }

  const matched = []
  const missing = []
  let total = 0
  for (const requirement of items) {
    const evidence = evidenceFor(requirement, resume)
    if (!evidence) {
      missing.push({
        name: requirement.canonical,
        importance: requirement.importance,
        credit: 0,
        reason: 'Not found in projects, experience, the skills list, or the rest of the resume.',
      })
      continue
    }
    total += evidence.credit
    matched.push({
      name: requirement.canonical,
      importance: requirement.importance,
      section: evidence.section,
      credit: evidence.credit,
      snippet: evidence.snippet,
      matchedAlias: evidence.matchedAlias,
      reason: evidence.reason,
    })
  }

  const suggestions = missing.slice(0, 3).map((item) => {
    return `Show ${item.name} in a project or experience bullet if you have used it. Listing it only under skills is partial evidence.`
  })
  return category(key, total / items.length, {
    matched,
    missing,
    reasons: [`${matched.length} of ${items.length} ${label} have evidence. A bullet that uses the skill scores 100, a bare name in that section scores 70, a skills-list mention scores 60, and another mention scores 40. Repeating a name does not raise the credit.`],
    suggestions,
  })
}

function substantiveLines(text) {
  return String(text || '').split('\n').map((line) => line.trim()).filter((line) => {
    return (line.match(/[A-Za-z0-9']+/g) || []).length >= 8
  })
}

function domainTerms(jd) {
  const seen = new Set()
  const terms = []
  for (const line of jd.responsibilities || []) {
    for (const word of contentWords(line)) {
      if (word.length < 5 || seen.has(word)) continue
      seen.add(word)
      terms.push(word)
    }
  }
  return terms
}

function scoreProjectsExperience(resume, jd) {
  const workText = `${resume.sections.projects || ''}\n${resume.sections.experience || ''}`
  const lines = substantiveLines(workText)
  const terms = domainTerms(jd)

  if (!terms.length) {
    return category('projectsExperience', null, {
      reasons: ['The job description does not state responsibilities this category can compare, so project relevance was left out instead of treating described work as a full match.'],
    })
  }

  if (!lines.length) {
    return category('projectsExperience', 0, {
      missing: [{
        name: 'described work',
        credit: 0,
        reason: 'Projects and Experience do not describe work, so domain alignment is 0.',
      }],
      reasons: ['Project relevance needs described work that shares the job domain. A date alone does not raise this score.'],
      suggestions: ['Add project or experience bullets that use the words of this role, not only a year.'],
    })
  }

  const matched = []
  const missing = []
  for (const term of terms) {
    const found = findAlias(workText, term)
    if (!found) {
      missing.push({
        name: term,
        credit: 0,
        reason: `The responsibility word “${term}” does not appear in projects or experience.`,
      })
      continue
    }
    matched.push({
      name: term,
      section: 'projects',
      credit: 100,
      snippet: lineAround(workText, found.index),
      reason: `The responsibility word “${term}” appears in projects or experience.`,
    })
  }

  return category('projectsExperience', (matched.length / terms.length) * 100, {
    matched,
    missing,
    reasons: [`${matched.length} of ${terms.length} domain words from the job responsibilities appear in projects or experience. Described, dated work does not raise this score when the domain does not match. Required skills are not added again here.`],
    suggestions: missing.length
      ? ['Rewrite a project or experience bullet so it covers the responsibilities of this role, using work you actually did.']
      : [],
  })
}

function responsibilityEvidence(resume, line) {
  const words = contentWords(line)
  if (!words.length) return null
  const haystack = `${resume.sections.projects || ''}\n${resume.sections.experience || ''}`
  const hits = words.filter((word) => findAlias(haystack, word))
  const score = (hits.length / words.length) * 100
  const sample = hits.length ? lineAround(haystack, findAlias(haystack, hits[0]).index) : ''
  return {
    name: line.slice(0, 80),
    credit: Math.round(score),
    section: sample ? 'experience' : undefined,
    snippet: sample,
    reason: hits.length
      ? `${hits.length} of ${words.length} non-skill words from this responsibility appear in projects or experience.`
      : 'None of the non-skill words from this responsibility appear in projects or experience.',
  }
}

function scoreResponsibilities(resume, jd) {
  const assessed = []
  for (const line of jd.responsibilities) {
    const evidence = responsibilityEvidence(resume, line)
    if (evidence) assessed.push(evidence)
  }
  if (!assessed.length) {
    return category('responsibilities', null, {
      reasons: ['No responsibility line had words left after skill names were removed, so this category was left out rather than scoring the same skills again.'],
    })
  }
  const matched = assessed.filter((item) => item.credit > 0)
  const missing = assessed.filter((item) => item.credit === 0)
  const score = assessed.reduce((sum, item) => sum + item.credit, 0) / assessed.length
  return category('responsibilities', score, {
    matched,
    missing,
    reasons: [`${matched.length} of ${assessed.length} responsibilities share non-skill words with the resume. Skill names were removed first so they are not counted twice.`],
    suggestions: missing.slice(0, 2).map((item) => `Rewrite a bullet so it covers “${item.name}” with a tool and an outcome.`),
  })
}

function scoreEducationEligibility(resume, jd) {
  const degree = classifyDegree(jd.educationRequired, resume.sections.education || '')
  const years = classifyYears(jd.minYears, `${resume.sections.experience || ''}\n${resume.sections.summary || ''}`)
  const conditions = [degree, years].filter(Boolean)
  if (!conditions.length) {
    return category('educationEligibility', null, {
      reasons: ['The job does not state a degree or a number of years, so eligibility was left out of the job match.'],
    })
  }

  const scored = conditions.filter((item) => item.score != null)
  const matched = conditions.filter((item) => item.status === 'meets').map(asEvidence)
  const missing = conditions.filter((item) => item.status === 'unmet').map(asEvidence)
  const uncertain = conditions.filter((item) => item.status === 'unverified').map(asEvidence)
  const score = scored.length
    ? scored.reduce((sum, item) => sum + item.score, 0) / scored.length
    : null
  return category('educationEligibility', score, {
    matched,
    missing,
    uncertain,
    reasons: [
      score == null
        ? 'Every eligibility condition is unverified, so this category was left out of the total.'
        : 'Confirmed eligibility conditions are averaged. Unverified conditions are shown and are not treated as zeros.',
    ],
    suggestions: missing.slice(0, 2).map((item) => item.reason),
  })
}

function asEvidence(item) {
  return {
    name: item.name,
    credit: item.score,
    snippet: item.snippet,
    reason: item.reason,
    status: item.status,
  }
}

function category(key, score, extras = {}) {
  return {
    key,
    score: score == null ? null : Math.max(0, Math.min(100, score)),
    included: score != null,
    matched: extras.matched || [],
    missing: extras.missing || [],
    uncertain: extras.uncertain || [],
    reasons: extras.reasons || [],
    suggestions: extras.suggestions || [],
  }
}

function keywordCoverage(categories) {
  const rows = ['requiredSkills', 'preferred', 'softSkills'].flatMap((key) => {
    const category = categories[key]
    if (!category) return []
    return [...category.matched, ...category.missing]
  })
  const unique = []
  const seen = new Set()
  for (const row of rows) {
    if (!row.name || seen.has(row.name)) continue
    seen.add(row.name)
    unique.push(row)
  }
  const matched = unique.filter((row) => (row.credit || 0) > 0)
  const total = unique.length
  return {
    found: matched.length,
    total,
    percent: total ? round1((matched.length / total) * 100) : null,
    matched: matched.map((row) => row.name),
    missing: unique.filter((row) => !(row.credit > 0)).map((row) => row.name),
    note: 'Keyword coverage counts each requirement once. It is not added to the job match, because that score already uses the same evidence.',
  }
}

function evidenceConfidence(categories) {
  const rows = Object.values(categories).flatMap((item) => [...item.matched, ...item.missing])
  const assessed = rows.filter((row) => row.credit != null)
  const located = assessed.filter((row) => row.snippet)
  const score = assessed.length ? (located.length / assessed.length) * 100 : null
  return {
    score: score == null ? null : round1(score),
    located: located.length,
    assessed: assessed.length,
    reason: 'Evidence confidence is the share of assessed rows that include a located snippet. It is not added to document compatibility or the job match.',
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

function publicRequirements(jd, eligibility) {
  return {
    required: jd.required.map(publicRequirement),
    preferred: jd.preferred.map(publicRequirement),
    softSkills: jd.softSkills.map(publicRequirement),
    minYears: jd.minYears,
    educationRequired: jd.educationRequired,
    responsibilities: jd.responsibilities,
    sectionsDetected: jd.sectionsDetected,
    extraction: jd.extraction,
    eligibility,
  }
}

function publicRequirement(item) {
  return {
    canonical: item.canonical,
    importance: item.importance,
    sourceText: item.sourceText,
  }
}

function scoreResumeAgainstJob(resumeText, jobDescription, options = {}) {
  const weights = options.weights || ATS_CONFIG.jobMatchWeights
  const threshold = options.threshold == null ? ATS_CONFIG.gateThreshold : options.threshold
  assertWeights(weights)

  const compatibility = scoreCompatibility(resumeText, options.compatibilityWeights || ATS_CONFIG.compatibilityWeights)
  const semanticMatching = {
    enabled: ATS_CONFIG.semanticMatching,
    applied: false,
    note: 'Semantic matching is off. Scores use exact phrases and the skill dictionary only. No external API is called.',
  }
  const semanticWarning = options.semanticMatching === true
    ? 'Semantic matching was requested, but no local model is configured. The numbers did not change, and no external API was called.'
    : null

  if (compatibility.status !== 'scored') {
    return {
      status: 'incomplete',
      scoreExact: null,
      scoreDisplay: null,
      passesThreshold: false,
      gateEligible: false,
      threshold,
      weights,
      compatibilityWeights: compatibility.weights,
      rubricVersion: ATS_CONFIG.rubricVersion,
      disclaimer: ATS_CONFIG.disclaimer,
      categories: {},
      requirements: null,
      compatibility,
      keywordCoverage: null,
      eligibility: { meets: [], unmet: [], unverified: [] },
      evidenceConfidence: null,
      semanticMatching,
      warnings: compatibility.reasons.concat(semanticWarning ? [semanticWarning] : []),
      recommendations: ['Upload a text PDF or DOCX. A scan cannot be scored, and OCR is not implemented.'],
      sectionsDetected: [],
    }
  }

  const resume = splitResume(resumeText)
  const jd = parseJobDescription(jobDescription, options.dictionary || SKILL_DICTIONARY)
  const eligibility = groupEligibility([
    classifyDegree(jd.educationRequired, resume.sections.education || ''),
    classifyYears(jd.minYears, `${resume.sections.experience || ''}\n${resume.sections.summary || ''}`),
  ])

  if (jd.extraction.status === 'failed') {
    return {
      status: 'incomplete',
      scoreExact: null,
      scoreDisplay: null,
      passesThreshold: false,
      gateEligible: false,
      threshold,
      weights,
      compatibilityWeights: compatibility.weights,
      rubricVersion: ATS_CONFIG.rubricVersion,
      disclaimer: ATS_CONFIG.disclaimer,
      categories: {},
      requirements: publicRequirements(jd, eligibility),
      compatibility,
      keywordCoverage: null,
      eligibility,
      evidenceConfidence: null,
      semanticMatching,
      warnings: [jd.extraction.reason].concat(semanticWarning ? [semanticWarning] : []),
      recommendations: ['Paste the full job description, including the requirements or responsibilities.'],
      sectionsDetected: resume.detected,
    }
  }

  const categories = {
    requiredSkills: scoreSkillList(resume, jd.required, 'requiredSkills', 'required technical skills'),
    projectsExperience: scoreProjectsExperience(resume, jd),
    responsibilities: scoreResponsibilities(resume, jd),
    educationEligibility: scoreEducationEligibility(resume, jd),
    preferred: scoreSkillList(resume, jd.preferred, 'preferred', 'preferred keywords'),
    softSkills: scoreSkillList(resume, jd.softSkills, 'softSkills', 'soft skills'),
  }

  const warnings = []
  if (jd.extraction.status === 'none_stated') warnings.push(jd.extraction.reason)
  warnings.push(...Object.values(categories).flatMap((item) => item.uncertain.map((entry) => entry.reason)))
  if (semanticWarning) warnings.push(semanticWarning)

  const coverage = keywordCoverage(categories)
  const confidence = evidenceConfidence(categories)
  const labeled = withWeights(categories, weights)
  const recommendations = Object.values(categories).flatMap((item) => item.suggestions).slice(0, 8)
  const combined = combineScores({
    requiredSkills: categories.requiredSkills.score,
    projectsExperience: categories.projectsExperience.score,
    responsibilities: categories.responsibilities.score,
    educationEligibility: categories.educationEligibility.score,
    preferred: categories.preferred.score,
    softSkills: categories.softSkills.score,
  }, weights, threshold)

  if (combined.scoreExact == null) {
    return {
      status: 'incomplete',
      scoreExact: null,
      scoreDisplay: null,
      passesThreshold: false,
      gateEligible: false,
      threshold,
      weights,
      compatibilityWeights: compatibility.weights,
      rubricVersion: ATS_CONFIG.rubricVersion,
      disclaimer: ATS_CONFIG.disclaimer,
      categories: labeled,
      requirements: publicRequirements(jd, eligibility),
      compatibility,
      keywordCoverage: coverage,
      eligibility,
      evidenceConfidence: confidence,
      semanticMatching,
      warnings: warnings.concat(['No requirement in this job description could be scored, so no job-match score was invented.']),
      recommendations,
      sectionsDetected: resume.detected,
    }
  }

  const blockedByEligibility = eligibility.unmet.length > 0
  return {
    status: 'completed',
    scoreExact: combined.scoreExact,
    scoreDisplay: combined.scoreDisplay,
    passesThreshold: combined.passesThreshold && !blockedByEligibility,
    gateEligible: true,
    threshold,
    weights,
    compatibilityWeights: compatibility.weights,
    rubricVersion: ATS_CONFIG.rubricVersion,
    disclaimer: ATS_CONFIG.disclaimer,
    categories: labeled,
    requirements: publicRequirements(jd, eligibility),
    compatibility,
    keywordCoverage: coverage,
    eligibility,
    evidenceConfidence: confidence,
    semanticMatching,
    warnings,
    recommendations,
    sectionsDetected: resume.detected,
  }
}

module.exports = {
  combineScores,
  round1,
  scoreResumeAgainstJob,
  evidenceFor,
  contentWords,
}
