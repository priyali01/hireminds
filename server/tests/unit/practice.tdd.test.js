/**
 * H03–H08 — interview link, research questions, answer review, and coaching.
 * Questions are practice questions unless a supplied source supports them.
 * Video counts an observable event. It does not score confidence or emotion.
 */

const { ValidationError, AppError } = require('../../utils/errors')
const { buildQuestionPlan } = require('../../services/practice/questions')
const {
  createPracticeSession,
  grantConsent,
  beginSession,
  submitAnswer,
  interruptSession,
  resumeSession,
  finishSession,
  revokeSession,
  publicView,
} = require('../../services/practice/session')
const { evaluateAnswer } = require('../../services/practice/evaluate')
const { coachPlan, compareProgress } = require('../../services/practice/coach')

const NOW = new Date('2026-10-23T00:00:00Z')

function plan(sources = []) {
  return buildQuestionPlan({
    role: 'Backend intern',
    company: 'Razorpay',
    jobDescription: 'Requirements\nRequired: Node.js and SQL\n',
    resumeText: 'Projects\nCampus API\nBuilt a small service.\n',
    sources,
    now: NOW,
  })
}

describe('company research questions', () => {
  it('uses role questions when no source is available and does not invent a company question', () => {
    const result = plan([])
    expect(result.questions.length).toBeGreaterThanOrEqual(4)
    expect(result.questions.every((question) => question.origin === 'practice')).toBe(true)
    expect(result.questions.map((question) => question.text).join('\n')).not.toMatch(/candidates report|past interviews they asked|they asked/i)
    expect(result.questions.some((question) => question.round === 'technical' && /node\.js/i.test(question.text))).toBe(true)
    expect(result.questions.some((question) => question.round === 'project' && /Campus API/.test(question.text))).toBe(true)
    expect(result.questions.some((question) => question.round === 'hr')).toBe(true)
    expect(result.questions.every((question) => question.difficulty === 'easy')).toBe(true)
  })

  it('keeps a reported question attached to its source and drops old or skill-free notes', () => {
    const result = plan([
      {
        title: 'Razorpay interview notes',
        url: 'https://example.com/razorpay',
        publishedAt: '2024-06-01',
        kind: 'reported',
        excerpt: 'They discussed SQL joins and indexing.',
      },
      {
        title: 'Old note',
        url: 'https://example.com/old',
        publishedAt: '2018-01-01',
        kind: 'reported',
        excerpt: 'They discussed SQL joins and indexing.',
      },
      {
        title: 'Duplicate',
        url: 'https://example.com/dup',
        publishedAt: '2024-07-01',
        kind: 'reported',
        excerpt: 'They discussed SQL joins and indexing.',
      },
      {
        title: 'Cafeteria',
        url: 'https://example.com/cafe',
        publishedAt: '2025-01-01',
        kind: 'verified',
        excerpt: 'The office cafeteria is nice.',
      },
    ])
    const sourced = result.questions.filter((question) => question.origin === 'reported')
    expect(sourced).toHaveLength(1)
    expect(sourced[0].sourceUrl).toBe('https://example.com/razorpay')
    expect(sourced[0].sourceDate).toBe('2024-06-01')
    expect(sourced[0].text.toLowerCase()).toMatch(/sql/)
    expect(result.questions.map((question) => question.text).join('\n')).not.toMatch(/UPI/)
  })
})

describe('answer evaluation', () => {
  const question = { text: 'Walk through how you have used node.js as a Backend intern.', round: 'technical' }

  it('explains each content score from the transcript and keeps video out of the rating', () => {
    const calm = evaluateAnswer({
      question,
      transcript: 'I used node.js because the service needed a small API. First I defined the routes, then I checked the result.',
      durationSeconds: 30,
      video: [{ type: 'look_away' }, { type: 'look_away' }],
      videoAnalysis: false,
    })
    const lookingAway = evaluateAnswer({
      question,
      transcript: 'I used node.js because the service needed a small API. First I defined the routes, then I checked the result.',
      durationSeconds: 30,
      video: [{ type: 'look_away' }, { type: 'look_away' }],
      videoAnalysis: true,
    })
    expect(calm.dimensions.relevance.why).toMatch(/node\.js/i)
    expect(calm.overall).toBe(lookingAway.overall)
    expect(calm.video).toBeNull()
    expect(lookingAway.video.lookAwayCount).toBe(2)
    expect(lookingAway.video.confidence).toBeUndefined()
    expect(lookingAway.video.emotion).toBeUndefined()
    expect(lookingAway.video.personality).toBeUndefined()
    expect(calm.speech.fillerCount).toBe(0)
    expect(calm.speech.wpm).toBeGreaterThan(0)
  })

  it('counts filler words and leaves pace empty when the duration is missing', () => {
    const speech = evaluateAnswer({
      question,
      transcript: 'I um think the um API uses node.js',
      durationSeconds: 30,
    })
    expect(speech.speech.fillerCount).toBe(2)
    expect(speech.speech.wpm).toBe(16)
    const unsized = evaluateAnswer({ question, transcript: 'I used node.js', durationSeconds: null })
    expect(unsized.speech.wpm).toBeNull()
  })
})

describe('coach plan', () => {
  it('names three weaknesses and refuses a script to memorize', () => {
    const evaluation = evaluateAnswer({
      question: { text: 'Walk through how you have used node.js.' },
      transcript: 'yes',
      durationSeconds: 10,
    })
    const planResult = coachPlan([evaluation])
    expect(planResult.weaknesses).toHaveLength(3)
    expect(planResult.weaknesses[0].dimension).toBe('relevance')
    for (const item of planResult.weaknesses) {
      expect(item.exercise).toMatch(/do not memorize/i)
      expect(item.exercise).toMatch(/your own/i)
    }
  })

  it('compares two rounds on the same dimensions', () => {
    const weak = coachPlan([evaluateAnswer({
      question: { text: 'Walk through how you have used node.js.' },
      transcript: 'yes',
    })])
    const strong = coachPlan([evaluateAnswer({
      question: { text: 'Walk through how you have used node.js.' },
      transcript: 'I used node.js because the API was small. First I wrote the route, then I checked the result.',
    })])
    const compared = compareProgress(weak, strong)
    expect(compared.deltas.relevance).toBeGreaterThan(0)
    expect(compared.improved).toContain('relevance')
  })
})

describe('interview session link', () => {
  function session() {
    return createPracticeSession({
      role: 'Backend intern',
      company: 'Razorpay',
      questions: plan().questions,
      now: NOW,
    })
  }

  it('creates an unguessable expiring link and shows one question at a time', () => {
    const created = session()
    expect(created.token).toMatch(/^[a-f0-9]{48}$/)
    expect(created.expiresAt.getTime() - NOW.getTime()).toBe(24 * 60 * 60 * 1000)
    expect(created.status).toBe('created')
    const view = publicView(created)
    expect(view.email).toBeUndefined()
    expect(view.userId).toBeUndefined()
    expect(view.resumeText).toBeUndefined()
    expect(view.question).toBeNull()
  })

  it('requires a microphone and refuses video analysis without the camera', () => {
    expect(() => grantConsent(session(), { microphone: false }, NOW)).toThrow(ValidationError)
    expect(() => grantConsent(session(), { microphone: true, camera: false, videoAnalysis: true }, NOW)).toThrow(/camera/i)
    const ready = grantConsent(session(), { microphone: true, camera: false, storeTranscript: true, videoAnalysis: false }, NOW)
    expect(ready.consent.camera).toBe(false)
    expect(ready.consent.videoAnalysis).toBe(false)
  })

  it('asks a follow-up once when the answer is thin, then moves on', () => {
    let current = beginSession(grantConsent(session(), { microphone: true, storeTranscript: true }, NOW), NOW)
    const first = submitAnswer(current, { transcript: 'too short', durationSeconds: 8 }, NOW)
    expect(first.followUp).toMatch(/deeper|specific/i)
    expect(first.session.questionIndex).toBe(0)
    const second = submitAnswer(first.session, { transcript: 'still short', durationSeconds: 8 }, NOW)
    expect(second.followUp).toBeNull()
    expect(second.session.questionIndex).toBe(1)
  })

  it('stores a transcript only after consent, and never stores audio', () => {
    let current = beginSession(grantConsent(session(), { microphone: true, storeTranscript: false }, NOW), NOW)
    const answered = submitAnswer(current, { transcript: 'I used node.js because the route was small.', durationSeconds: 20, audioBase64: 'secret-audio' }, NOW)
    expect(answered.evaluation.dimensions.relevance.score).toBeGreaterThan(0)
    expect(answered.session.answers[0].transcript).toBe('')
    expect(JSON.stringify(answered.session)).not.toContain('secret-audio')
  })

  it('pauses on a dropped connection and rejects an expired or revoked link', () => {
    let current = beginSession(grantConsent(session(), { microphone: true, storeTranscript: true }, NOW), NOW)
    current = interruptSession(current, 'connection lost')
    expect(current.status).toBe('interrupted')
    expect(() => submitAnswer(current, { transcript: 'I used node.js for the API route and the database.', durationSeconds: 20 }, NOW)).toThrow(/resume/i)
    current = resumeSession(current, NOW)
    expect(current.status).toBe('in_progress')

    const expired = { ...current, expiresAt: new Date('2026-10-22T00:00:00Z') }
    expect(() => submitAnswer(expired, { transcript: 'I used node.js for the API route and the database.', durationSeconds: 20 }, NOW)).toThrow(AppError)

    const revoked = revokeSession(current, NOW)
    expect(() => submitAnswer(revoked, { transcript: 'I used node.js for the API route and the database.', durationSeconds: 20 }, NOW)).toThrow(/revoked/i)
  })

  it('finishes with a report and a coach plan', () => {
    let current = beginSession(grantConsent(session(), { microphone: true, storeTranscript: true }, NOW), NOW)
    current = submitAnswer(current, {
      transcript: 'I used node.js because the campus API needed a small service. First I wrote the route, then I checked the result.',
      durationSeconds: 40,
    }, NOW).session
    const done = finishSession(current, NOW)
    expect(done.status).toBe('completed')
    expect(done.report.evaluations.length).toBe(1)
    expect(done.report.coachPlan.weaknesses.length).toBe(3)
    expect(done.report.strongerShape).toMatch(/your own/i)
  })
})
