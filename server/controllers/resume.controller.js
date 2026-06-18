const multer = require('multer')
const pdfParse = require('pdf-parse-fork')
const Resume = require('../models/resume.model')
const User = require('../models/user.model')
const { analyseResume } = require('../services/ats.service')
const { resumeAnalyzeSchema, resumeFeedbackSchema } = require('../validators')
const { NotFoundError, ValidationError } = require('../utils/errors')

// Memory storage: file is never written to disk — only processed in RAM
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    // Check MIME type — not just file extension
    if (file.mimetype !== 'application/pdf') {
      return cb(new ValidationError('Only PDF files are accepted', [
        { field: 'resume', message: 'File must be a PDF (application/pdf)' },
      ]))
    }
    cb(null, true)
  },
})

/**
 * POST /resumes/analyze
 * Body: { resumeText: string, level: 'fresher'|'intermediate'|'experienced' }
 * Analyses raw text resume and returns level-aware ATS score.
 * Saves the result to MongoDB.
 */
async function analyzeText(req, res, next) {
  try {
    const { resumeText, level } = resumeAnalyzeSchema.parse(req.body)

    const userLevel = level || req.user?.level || 'fresher'

    const atsResult = await analyseResume(resumeText, userLevel)

    const resume = await Resume.create({
      userId: req.user.userId,
      source: 'manual',
      rawText: resumeText,
      level: userLevel,
      atsScore: {
        overall: atsResult.overall,
        breakdown: atsResult.breakdown,
        feedback: atsResult.feedback,
        strengths: atsResult.strengths,
        missingKeywords: atsResult.missingKeywords,
        oneWeekFixPlan: atsResult.oneWeekFixPlan,
        promptVersion: atsResult.promptVersion,
        modelUsed: atsResult.modelUsed,
        analysedAt: atsResult.analysedAt,
      },
    })

    // Increment monthly analysis counter for quota tracking
    await User.findByIdAndUpdate(req.user.userId, {
      $inc: { analysesThisMonth: 1, aiUsageToday: 1 },
    })

    res.json({
      success: true,
      resumeId: resume._id,
      score: atsResult,
    })
  } catch (err) {
    next(err)
  }
}

/**
 * POST /resumes/upload-and-analyze
 * Form data: resume (PDF file), level (optional)
 * Extracts PDF text, analyses, and returns ATS score.
 */
async function uploadAndAnalyze(req, res, next) {
  try {
    if (!req.file) {
      throw new ValidationError('No file uploaded', [
        { field: 'resume', message: 'A PDF file is required' },
      ])
    }

    const level = req.body.level || req.user?.level || 'fresher'

    // Extract text from PDF buffer
    const pdfData = await pdfParse(req.file.buffer)
    const resumeText = pdfData.text?.trim()

    if (!resumeText || resumeText.length < 50) {
      throw new ValidationError('Could not extract text from PDF', [
        { field: 'resume', message: 'The PDF appears to have no extractable text. Try a text-based PDF.' },
      ])
    }

    const atsResult = await analyseResume(resumeText, level)

    const resume = await Resume.create({
      userId: req.user.userId,
      source: 'pdf_upload',
      rawText: resumeText,
      level,
      pdfMeta: {
        originalFilename: req.file.originalname,
        sizeBytes: req.file.size,
      },
      atsScore: {
        overall: atsResult.overall,
        breakdown: atsResult.breakdown,
        feedback: atsResult.feedback,
        strengths: atsResult.strengths,
        missingKeywords: atsResult.missingKeywords,
        oneWeekFixPlan: atsResult.oneWeekFixPlan,
        promptVersion: atsResult.promptVersion,
        modelUsed: atsResult.modelUsed,
        analysedAt: atsResult.analysedAt,
      },
    })

    await User.findByIdAndUpdate(req.user.userId, {
      $inc: { analysesThisMonth: 1, aiUsageToday: 1 },
    })

    res.json({
      success: true,
      resumeId: resume._id,
      score: atsResult,
      preview: resumeText.slice(0, 300),
    })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /resumes/history
 * Returns the authenticated user's resume analysis history (latest 10).
 */
async function getHistory(req, res, next) {
  try {
    const resumes = await Resume.find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('-rawText') // rawText can be large — don't include in list view

    res.json({
      success: true,
      count: resumes.length,
      resumes,
    })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /resumes/:id
 * Returns a single resume with full details.
 */
async function getResume(req, res, next) {
  try {
    const resume = await Resume.findOne({
      _id: req.params.id,
      userId: req.user.userId, // Ensure user can only access their own resumes
    })

    if (!resume) {
      throw new NotFoundError('Resume')
    }

    res.json({ success: true, resume })
  } catch (err) {
    next(err)
  }
}

/**
 * POST /resumes/feedback
 * Body: { resumeId, thumbsUp: boolean, comment?: string }
 * Records the user's thumbs up/down feedback on an AI analysis.
 */
async function submitFeedback(req, res, next) {
  try {
    const { resumeId, thumbsUp, comment } = resumeFeedbackSchema.parse(req.body)

    const resume = await Resume.findOneAndUpdate(
      { _id: resumeId, userId: req.user.userId },
      {
        'feedback.thumbsUp': thumbsUp,
        'feedback.comment': comment || '',
        'feedback.givenAt': new Date(),
      },
      { new: true }
    )

    if (!resume) {
      throw new NotFoundError('Resume')
    }

    res.json({ success: true, message: 'Feedback recorded. Thank you!' })
  } catch (err) {
    next(err)
  }
}

module.exports = {
  upload,
  analyzeText,
  uploadAndAnalyze,
  getHistory,
  getResume,
  submitFeedback,
}
