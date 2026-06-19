const InterviewSession = require('../models/interview.model')
const User = require('../models/user.model')
const Resume = require('../models/resume.model')
const { createSessionSchema, submitAnswerSchema, setupDriveSchema } = require('../validators/interview.validators')
const { NotFoundError, QuotaError } = require('../utils/errors')
const { generateQuestions, evaluateAnswer } = require('../services/interview.service')
const { awardPoints } = require('../services/gamification.service')

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

    // Get optional resume text for context
    let resumeText = ''
    if (data.resumeId) {
      const resume = await Resume.findOne({ _id: data.resumeId, userId: req.user.userId })
      if (resume && resume.rawText) resumeText = resume.rawText
    }

    // Generate questions via AI
    const count = data.type === 'technical' ? 5 : 3
    const { questions, modelUsed, promptVersion } = await generateQuestions(data.type, data.role, resumeText, count)

    const session = await InterviewSession.create({
      userId: req.user.userId,
      ...data,
      status: 'in_progress',
      startedAt: new Date(),
      questions,
      modelUsed,
      promptVersion
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

    const question = session.questions[questionIndex]?.text
    if (!question) throw new NotFoundError('Question')

    // Evaluate via AI
    const { evaluation } = await evaluateAnswer(question, userAnswer, session.role, session.roundType)

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

    // Award Gamification Points
    await awardPoints(req.user.userId, 'MOCK_INTERVIEW')

    res.json({ success: true, session })
  } catch (err) {
    next(err)
  }
}

const { startDrive: startDriveService, evaluateDriveAnswer, completeDrive: completeDriveService } = require('../services/drive.service')

// STUBS for Drive endpoints (to be implemented in 2C)
async function startDrive(req, res, next) {
  try {
    const { driveType } = setupDriveSchema.parse(req.body)
    
    // Check quota
    if (req.user.plan === 'free' && req.user.interviewsThisWeek >= 1) {
      throw new QuotaError(req.user.lastQuotaReset)
    }

    const session = await startDriveService(req.user.userId, driveType)
    
    res.status(201).json({ success: true, session })
  } catch (err) {
    next(err)
  }
}

async function submitDriveSection(req, res, next) {
  try {
    const { questionIndex, userAnswer } = submitAnswerSchema.parse(req.body)
    
    const session = await InterviewSession.findOne({ _id: req.params.id, userId: req.user.userId })
    if (!session) throw new NotFoundError('Interview Session')

    const evaluation = await evaluateDriveAnswer(session, questionIndex, userAnswer)
    
    res.json({ success: true, evaluation })
  } catch (err) {
    next(err)
  }
}

async function completeDrive(req, res, next) {
  try {
    const session = await InterviewSession.findOne({ _id: req.params.id, userId: req.user.userId })
    if (!session) throw new NotFoundError('Interview Session')

    const completedSession = await completeDriveService(session)

    // Increment quota counter
    await User.findByIdAndUpdate(req.user.userId, { $inc: { interviewsThisWeek: 1 } })

    // Award Gamification Points
    await awardPoints(req.user.userId, 'MOCK_INTERVIEW')

    res.json({ success: true, session: completedSession })
  } catch (err) {
    next(err)
  }
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
