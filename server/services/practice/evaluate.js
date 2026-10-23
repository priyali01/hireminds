const { SKILL_DICTIONARY } = require('../ats/dictionary')
const { findSkill, skillsPresent } = require('../ats/match')

const FILLER_RE = /\b(um+|uh+|er+|hmm+|basically|you know)\b/gi

function wordCount(text) {
  return String(text || '').trim().split(/\s+/).filter(Boolean).length
}

function speechStats(transcript, durationSeconds) {
  const text = String(transcript || '')
  const words = wordCount(text)
  const fillers = text.match(FILLER_RE) || []
  const duration = Number(durationSeconds)
  return {
    wordCount: words,
    fillerCount: fillers.length,
    fillers: fillers.map((item) => item.toLowerCase()),
    wpm: Number.isFinite(duration) && duration > 0 ? Math.round(words / (duration / 60)) : null,
  }
}

function evaluateAnswer({ question, transcript, durationSeconds = null, video = null, videoAnalysis = false }) {
  const text = String(transcript || '').trim()
  const expected = skillsPresent(question?.text || '', SKILL_DICTIONARY)
  const hit = expected.filter((skill) => findSkill(text, skill)).map((skill) => skill.canonical)
  const missing = expected.map((skill) => skill.canonical).filter((name) => !hit.includes(name))
  const words = wordCount(text)
  const relevance = expected.length === 0 ? (words >= 20 ? 70 : 40) : Math.round((100 * hit.length) / expected.length)
  const depth = /\b(because|trade-?off|so that|instead)\b/i.test(text) ? 90 : words >= 40 ? 70 : words >= 15 ? 45 : 20
  const sentences = text.split(/[.!?]+/).filter((part) => part.trim()).length
  const structured = (/\bsituation\b/i.test(text) && /\bresult\b/i.test(text)) || (/\bfirst\b/i.test(text) && /\bthen\b/i.test(text))
  const structure = structured ? 90 : sentences >= 2 ? 60 : 30
  const completeness = expected.length === 0 ? (words >= 25 ? 70 : 40) : Math.round((100 * hit.length) / expected.length)
  const overall = Math.round((0.4 * relevance) + (0.3 * depth) + (0.2 * structure) + (0.1 * completeness))
  const quote = text.slice(0, 80)
  const dimensions = {
    relevance: {
      score: relevance,
      why: missing.length
        ? `The answer does not mention ${missing.join(', ')}.`
        : `The answer mentions ${hit.join(', ') || 'the question'}. "${quote}"`,
    },
    depth: {
      score: depth,
      why: depth >= 90 ? `The answer gives a reason. "${quote}"` : `The answer stays short. "${quote}"`,
    },
    structure: {
      score: structure,
      why: structure >= 90 ? `The answer has a sequence. "${quote}"` : `The answer is ${sentences} sentence(s). "${quote}"`,
    },
    completeness: {
      score: completeness,
      why: missing.length ? `Still missing ${missing.join(', ')}.` : `The points in the question are covered. "${quote}"`,
    },
  }
  let videoResult = null
  if (videoAnalysis) {
    const events = Array.isArray(video) ? video : []
    videoResult = {
      lookAwayCount: events.filter((event) => event && event.type === 'look_away').length,
      note: 'This counts times the page recorded looking away from the camera. It is not a reading of confidence, personality, or emotion.',
    }
  }
  return {
    dimensions,
    overall,
    speech: speechStats(text, durationSeconds),
    video: videoResult,
  }
}

module.exports = { evaluateAnswer, speechStats }
