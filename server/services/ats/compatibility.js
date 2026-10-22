const { ATS_CONFIG } = require('../../config/ats.config')
const { splitResume } = require('./sections')

const EMAIL_RE = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i
const PHONE_RE = /(?:\+?\d{1,3}[\s-]?)?[6-9]\d{9}\b/
const DEGREE_RE = /\b(bachelor(?:'s)?|master(?:'s)?|b\.?\s?tech|m\.?\s?tech|b\.?\s?e\b|m\.?\s?e\b|b\.?\s?sc|b\.?\s?a\b|ph\.?d|degree)\b/i
const YEAR_RE = /\b(19|20)\d{2}\b/
const BULLET_RE = /^\s*(?:[-•*▪]|\d+[.)])/

/**
 * A = 100 × sum(weight × normalized) / sum(available weights).
 * Component scores are 0–100, so this is sum(weight × score) / sum(available weights).
 * A null component is not observed and is left out of both sums.
 */
function weightedScore(components, weights) {
  const available = Object.entries(weights).filter(([key, weight]) => {
    return weight > 0 && components[key] != null && Number.isFinite(components[key])
  })
  const denom = available.reduce((sum, [, weight]) => sum + weight, 0)
  if (!denom) return null
  const total = available.reduce((sum, [key, weight]) => sum + (weight * components[key]), 0)
  return total / denom
}

function round1(value) {
  return Math.round((value + Number.EPSILON) * 10) / 10
}

function letterCount(text) {
  return (text.match(/\p{L}/gu) || []).length
}

function linesOf(text) {
  return text.split('\n').map((line) => line.trim()).filter(Boolean)
}

function median(values) {
  if (!values.length) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

function component(key, score, weight, reasons) {
  return {
    key,
    score: score == null ? null : Math.max(0, Math.min(100, score)),
    weight,
    available: score != null,
    reasons,
  }
}

/**
 * Document-processing score. It does not look at a job description.
 * Visual columns, fonts, margins and images are not measured: only the text
 * the extractor already produced, in the line order it produced.
 */
function scoreCompatibility(resumeText, weights = ATS_CONFIG.compatibilityWeights) {
  const text = String(resumeText || '').replace(/\r\n/g, '\n').trim()
  const letters = letterCount(text)
  const odd = text.match(/[^\p{L}\p{N}\s@.,:;+|()\-/&%#'’"“”•·▪–—_]/gu) || []
  const oddRatio = text.length ? odd.length / text.length : 1

  if (letters < 40 || oddRatio > 0.4) {
    return {
      status: 'inconclusive',
      scoreExact: null,
      scoreDisplay: null,
      weights,
      components: {},
      reasons: [
        letters < 40
          ? 'Not enough text was extracted to score document compatibility. This is an extraction failure, not a zero score.'
          : 'The extracted text is too garbled to score document compatibility. Re-export a text PDF or DOCX.',
      ],
    }
  }

  const lines = linesOf(text)
  const wordLines = lines.filter((line) => /\p{L}{3,}/u.test(line)).length
  const lineRatio = lines.length ? wordLines / lines.length : 0
  let extraction = 0
  const extractionReasons = [
    'Reading order is the line order from the extractor. Multi-column reordering is not measured.',
  ]
  extraction += letters >= 400 ? 40 : letters >= 150 ? 25 : 10
  extractionReasons.push(`${letters} letters were extracted.`)
  extraction += lines.length >= 8 ? 30 : lines.length >= 4 ? 15 : 0
  extractionReasons.push(`${lines.length} non-empty lines.`)
  extraction += lineRatio >= 0.6 ? 30 : 10
  extractionReasons.push(`${wordLines} of those lines contain a word.`)

  const resume = splitResume(text)
  const hasWork = resume.detected.includes('projects') || resume.detected.includes('experience')
  const sectionHits = [
    resume.detected.includes('education'),
    resume.detected.includes('skills'),
    hasWork,
  ].filter(Boolean).length
  const sectionReasons = [
    sectionHits === 3
      ? 'Education, Skills, and Projects or Experience headings were found.'
      : 'Use Education, Skills, and Projects or Experience as their own lines. Only headings the parser recognises are counted.',
  ]

  const hasEmail = EMAIL_RE.test(text)
  const hasPhone = PHONE_RE.test(text)
  const contact = (hasEmail ? 50 : 0) + (hasPhone ? 50 : 0)
  const contactReasons = [
    hasEmail ? 'An email address was parsed.' : 'No email address was parsed.',
    hasPhone ? 'A phone number was parsed.' : 'No phone number was parsed.',
    'A person\'s name is not scored, because the parser cannot reliably separate a name from a heading.',
  ]

  const educationText = resume.sections.education || ''
  const workText = `${resume.sections.experience || ''}\n${resume.sections.projects || ''}`
  const educationDated = DEGREE_RE.test(educationText) || YEAR_RE.test(educationText)
  const workDated = YEAR_RE.test(workText)
  const chronology = (educationDated ? 50 : 0) + (workDated ? 50 : 0)
  const chronologyReasons = [
    educationDated
      ? 'Education contains a degree word or a year.'
      : 'No degree word or year was parsed under Education.',
    workDated
      ? 'Projects or Experience contains a year.'
      : 'No year was parsed under Projects or Experience.',
    'Only explicit years and degree words are used. A missing date is not turned into an estimated career length here.',
  ]

  const bullets = lines.filter((line) => BULLET_RE.test(line)).length
  const med = median(lines.map((line) => line.length))
  let layout = 0
  const layoutReasons = [
    'Columns, fonts, margins and graphics are not measured. This check is line breaks, bullets and heading lines only.',
  ]
  layout += bullets >= 3 ? 40 : bullets >= 1 ? 20 : 0
  layoutReasons.push(`${bullets} bullet lines.`)
  layout += resume.detected.length >= 2 ? 30 : 0
  layoutReasons.push(resume.detected.length >= 2
    ? 'At least two section headings are on their own lines.'
    : 'Fewer than two section headings were found on their own lines.')
  layout += med >= 20 && med <= 110 ? 30 : 10
  layoutReasons.push(`Typical line length is ${Math.round(med)} characters.`)

  const components = {
    extraction: component('extraction', extraction, weights.extraction, extractionReasons),
    sections: component('sections', (sectionHits / 3) * 100, weights.sections, sectionReasons),
    contact: component('contact', contact, weights.contact, contactReasons),
    chronology: component('chronology', chronology, weights.chronology, chronologyReasons),
    layout: component('layout', layout, weights.layout, layoutReasons),
  }

  const scores = Object.fromEntries(Object.entries(components).map(([key, value]) => [key, value.score]))
  const scoreExact = weightedScore(scores, weights)

  return {
    status: 'scored',
    scoreExact,
    scoreDisplay: round1(scoreExact),
    weights,
    components,
    reasons: ['Document compatibility uses only the text the parser could read. It is not added to the job match.'],
    signals: {
      letters,
      lines: lines.length,
      email: hasEmail,
      phone: hasPhone,
      sections: resume.detected,
    },
  }
}

module.exports = {
  weightedScore,
  round1,
  scoreCompatibility,
}
