const crypto = require('crypto')
const { ValidationError, AppError } = require('../../utils/errors')
const { evaluateAnswer } = require('./evaluate')
const { coachPlan } = require('./coach')

const FOLLOW_UP = 'Could you go one step deeper? Name a specific decision you made.'

function createPracticeSession({ role, company = null, questions, now, ttlHours = 24, retentionDays = 30 }) {
  return {
    token: crypto.randomBytes(24).toString('hex'),
    role,
    company,
    questions: questions || [],
    status: 'created',
    expiresAt: new Date(now.getTime() + ttlHours * 60 * 60 * 1000),
    retainUntil: new Date(now.getTime() + retentionDays * 86400000),
    revoked: false,
    consent: {
      microphone: false,
      camera: false,
      storeTranscript: false,
      videoAnalysis: false,
    },
    questionIndex: 0,
    followUpPending: null,
    followUpsAsked: [],
    answers: [],
    connection: 'idle',
    report: null,
  }
}

function assertOpen(session, now) {
  if (session.revoked || session.status === 'revoked') {
    throw new AppError('This interview link has been revoked.', 410, 'LINK_REVOKED')
  }
  if (new Date(session.expiresAt).getTime() <= new Date(now).getTime()) {
    throw new AppError('This interview link has expired.', 410, 'LINK_EXPIRED')
  }
}

function grantConsent(session, consent, now) {
  assertOpen(session, now)
  if (!consent || consent.microphone !== true) {
    throw new ValidationError('Allow the microphone before the interview starts.')
  }
  if (consent.videoAnalysis && !consent.camera) {
    throw new ValidationError('Video analysis requires the camera, and it stays off unless you allow both.')
  }
  return {
    ...session,
    status: 'ready',
    consent: {
      microphone: true,
      camera: Boolean(consent.camera),
      storeTranscript: Boolean(consent.storeTranscript),
      videoAnalysis: Boolean(consent.videoAnalysis && consent.camera),
    },
  }
}

function beginSession(session, now) {
  assertOpen(session, now)
  if (!session.consent?.microphone || session.status !== 'ready') {
    throw new ValidationError('Allow the microphone before the interview starts.')
  }
  return { ...session, status: 'in_progress', connection: 'connected', startedAt: now }
}

function wordCount(text) {
  return String(text || '').trim().split(/\s+/).filter(Boolean).length
}

function stripStoredQuotes(evaluation) {
  const dimensions = {}
  for (const [key, value] of Object.entries(evaluation.dimensions)) {
    dimensions[key] = { score: value.score, why: String(value.why || '').replace(/"[^"]*"/g, '').trim() }
  }
  return { ...evaluation, dimensions }
}

function submitAnswer(session, body, now) {
  assertOpen(session, now)
  if (session.status === 'interrupted') throw new ValidationError('Resume the session before answering.')
  if (session.status !== 'in_progress') throw new ValidationError('Start the session before answering.')
  const transcript = String(body?.transcript || '').trim()
  if (!transcript) throw new ValidationError('The answer was empty.')
  const asked = new Set(session.followUpsAsked || [])
  if (wordCount(transcript) < 8 && !asked.has(session.questionIndex)) {
    const followUp = FOLLOW_UP
    return {
      session: {
        ...session,
        followUpPending: followUp,
        followUpsAsked: [...asked, session.questionIndex],
      },
      evaluation: null,
      followUp,
    }
  }

  const question = session.questions[session.questionIndex]
  if (!question) throw new ValidationError('This interview has no further questions.')
  const evaluation = evaluateAnswer({
    question,
    transcript,
    durationSeconds: body.durationSeconds,
    video: session.consent.videoAnalysis ? body.video : null,
    videoAnalysis: session.consent.videoAnalysis === true,
  })
  const stored = session.consent.storeTranscript === true
  const answer = {
    questionIndex: session.questionIndex,
    questionText: question.text,
    transcript: stored ? transcript.slice(0, 8000) : '',
    stored,
    durationSeconds: body.durationSeconds ?? null,
    evaluation: stored ? evaluation : stripStoredQuotes(evaluation),
  }
  return {
    session: {
      ...session,
      answers: [...session.answers, answer],
      questionIndex: session.questionIndex + 1,
      followUpPending: null,
    },
    evaluation,
    followUp: null,
  }
}

function interruptSession(session, reason) {
  return {
    ...session,
    status: 'interrupted',
    connection: 'disconnected',
    interruptReason: reason || 'connection lost',
  }
}

function resumeSession(session, now) {
  assertOpen(session, now)
  if (session.status !== 'interrupted') throw new ValidationError('The session is not paused.')
  return { ...session, status: 'in_progress', connection: 'connected' }
}

function revokeSession(session, now) {
  return { ...session, status: 'revoked', revoked: true, revokedAt: now, connection: 'closed' }
}

function finishSession(session, now) {
  assertOpen(session, now)
  const evaluations = (session.answers || []).map((answer) => answer.evaluation).filter(Boolean)
  return {
    ...session,
    status: 'completed',
    completedAt: now,
    connection: 'closed',
    report: {
      evaluations,
      coachPlan: coachPlan(evaluations),
      strongerShape: 'Situation you were in. The decision you made. The result you observed. Fill every part with your own work. Do not memorize a script.',
    },
  }
}

function publicView(session) {
  const showing = session.status === 'in_progress' || session.status === 'interrupted'
  const question = showing ? session.questions[session.questionIndex] || null : null
  return {
    role: session.role,
    company: session.company,
    status: session.status,
    expiresAt: session.expiresAt,
    connection: session.connection,
    consent: session.consent,
    progress: {
      current: Math.min(session.questionIndex + 1, session.questions.length),
      total: session.questions.length,
    },
    question: question ? {
      text: question.text,
      round: question.round,
      origin: question.origin,
      sourceUrl: question.sourceUrl,
      sourceDate: question.sourceDate,
      difficulty: question.difficulty,
    } : null,
    followUp: session.followUpPending || null,
  }
}

module.exports = {
  createPracticeSession,
  grantConsent,
  beginSession,
  submitAnswer,
  interruptSession,
  resumeSession,
  finishSession,
  revokeSession,
  publicView,
}
