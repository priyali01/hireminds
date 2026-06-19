const InterviewSession = require('../models/interview.model')
const User = require('../models/user.model')
const { createSessionSchema, submitAnswerSchema, setupDriveSchema } = require('../validators/interview.validators')
const { NotFoundError, QuotaError } = require('../utils/errors')

/**
 * POST /interviews/sessions
 * Creates a new interview session and generates questions.
 */
async function createSession(req, res, next) {
  try {
    const data = createSessionSchema.parse(req.body)
    
    // Check quota
    if (req.user.plan === 'free' && req.user.interviewsThisWeek >= 1) {
      throw new QuotaError(req.user.lastQuotaReset)
    }

    // STUB: Will integrate with AI service in 2B
    const session = await InterviewSession.create({
      userId: req.user.userId,
      ...data,
      status: 'in_progress',
      startedAt: new Date(),
      questions: [
        { text: 'Could you introduce yourself?', category: 'intro', difficulty: 'easy' },
        { text: 'What is your greatest strength?', category: 'behavioral', difficulty: 'easy' }
      ]
    })

    res.status(201).json({ success: true, session })
  } catch (err) {
    next(err)
  }
}

/**
 * POST /interviews/sessions/:id/answer
 * Submits an answer for a question and evaluates it.
 */
async function submitAnswer(req, res, next) {
  try {
    const { questionIndex, userAnswer } = submitAnswerSchema.parse(req.body)
    
    const session = await InterviewSession.findOne({ _id: req.params.id, userId: req.user.userId })
    if (!session) throw new NotFoundError('Interview Session')

    // STUB: Will integrate with AI service in 2B
    const evaluation = {
      score: 8,
      feedback: 'Good answer, but could be more structured.',
      missingElements: ['STAR method context'],
      improvedAnswer: 'Here is a better structured answer...',
      toneAssessment: 'Professional and confident',
    }

    session.answers.push({
      questionIndex,
      userAnswer,
      evaluation
    })

    await session.save()

    // Also update daily AI usage
    await User.findByIdAndUpdate(req.user.userId, { $inc: { aiUsageToday: 1 } })

    res.json({ success: true, evaluation })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /interviews/sessions
 * Returns the authenticated user's session history.
 */
async function getHistory(req, res, next) {
  try {
    const sessions = await InterviewSession.find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .select('-questions -answers')

    res.json({ success: true, count: sessions.length, sessions })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /interviews/sessions/:id
 * Returns a single session with full details.
 */
async function getSession(req, res, next) {
  try {
    const session = await InterviewSession.findOne({ _id: req.params.id, userId: req.user.userId })
    if (!session) throw new NotFoundError('Interview Session')

    res.json({ success: true, session })
  } catch (err) {
    next(err)
  }
}

/**
 * PATCH /interviews/sessions/:id/complete
 * Marks the session as completed and calculates overall score.
 */
async function completeSession(req, res, next) {
  try {
    const session = await InterviewSession.findOne({ _id: req.params.id, userId: req.user.userId })
    if (!session) throw new NotFoundError('Interview Session')

    // Calculate average score
    const totalScore = session.answers.reduce((acc, ans) => acc + (ans.evaluation?.score || 0), 0)
    const overallScore = session.answers.length ? (totalScore / session.answers.length) : 0

    session.status = 'completed'
    session.completedAt = new Date()
    session.overallScore = overallScore
    session.sessionDurationSeconds = Math.floor((session.completedAt.getTime() - session.startedAt.getTime()) / 1000)

    await session.save()

    // Increment interviewsThisWeek quota counter
    await User.findByIdAndUpdate(req.user.userId, { $inc: { interviewsThisWeek: 1 } })

    res.json({ success: true, session })
  } catch (err) {
    next(err)
  }
}

// STUBS for Drive endpoints (to be implemented in 2C)
async function startDrive(req, res, next) {
  res.json({ success: true, message: 'Drive started stub' })
}

async function submitDriveSection(req, res, next) {
  res.json({ success: true, message: 'Drive section answered stub' })
}

async function completeDrive(req, res, next) {
  res.json({ success: true, message: 'Drive completed stub' })
}

module.exports = {
  createSession,
  submitAnswer,
  getHistory,
  getSession,
  completeSession,
  startDrive,
  submitDriveSection,
  completeDrive
}
