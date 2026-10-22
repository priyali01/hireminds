const crypto = require('crypto')
const multer = require('multer')
const { z } = require('zod')
const Assessment = require('../models/assessment.model')
const { ATS_CONFIG } = require('../config/ats.config')
const { extractResumeText } = require('../services/ats/extract')
const { scoreResumeAgainstJob } = require('../services/ats/engine')
const { decideGate } = require('../services/ats/gate')
const { NotFoundError, ValidationError } = require('../utils/errors')

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: ATS_CONFIG.maxFileBytes },
})

const jdSchema = z.object({
  jobDescription: z.string().trim().min(40, 'Paste a job description of at least 40 characters').max(20000),
})

function hashText(text) {
  return crypto.createHash('sha256').update(text).digest('hex')
}

function present(assessment, gate) {
  return {
    id: assessment._id,
    status: assessment.status,
    scoreExact: assessment.scoreExact,
    scoreDisplay: assessment.scoreDisplay,
    passesThreshold: assessment.passesThreshold,
    gateEligible: assessment.gateEligible,
    threshold: assessment.threshold,
    weights: assessment.weights,
    compatibilityWeights: assessment.compatibilityWeights,
    categories: assessment.categories,
    compatibility: assessment.compatibility,
    keywordCoverage: assessment.keywordCoverage,
    eligibility: assessment.eligibility,
    evidenceConfidence: assessment.evidenceConfidence,
    semanticMatching: assessment.semanticMatching,
    requirements: assessment.requirements,
    warnings: assessment.warnings,
    recommendations: assessment.recommendations,
    sectionsDetected: assessment.sectionsDetected,
    disclaimer: assessment.disclaimer,
    superseded: assessment.superseded,
    rubricVersion: assessment.rubricVersion,
    resumeFileName: assessment.resumeFileName,
    createdAt: assessment.createdAt,
    gate,
  }
}

async function latestFor(userId) {
  return Assessment.findOne({ userId, superseded: false }).sort({ createdAt: -1 })
}

async function createAssessment(req, res, next) {
  try {
    const { jobDescription } = jdSchema.parse(req.body)
    const extracted = await extractResumeText(req.file)
    const result = scoreResumeAgainstJob(extracted.text, jobDescription)
    const userId = req.user.userId

    const assessment = await Assessment.create({
      userId,
      rubricVersion: result.rubricVersion,
      resumeFileName: String(req.file.originalname || 'resume').slice(0, 180),
      resumeHash: hashText(extracted.text),
      jdHash: hashText(jobDescription),
      jobDescription,
      resumeText: extracted.text,
      status: result.status,
      scoreExact: result.scoreExact,
      scoreDisplay: result.scoreDisplay,
      passesThreshold: result.passesThreshold,
      gateEligible: result.gateEligible,
      threshold: result.threshold,
      weights: result.weights,
      compatibilityWeights: result.compatibilityWeights,
      categories: result.categories,
      compatibility: result.compatibility,
      keywordCoverage: result.keywordCoverage,
      eligibility: result.eligibility,
      evidenceConfidence: result.evidenceConfidence,
      semanticMatching: result.semanticMatching,
      requirements: result.requirements,
      warnings: result.warnings,
      recommendations: result.recommendations,
      sectionsDetected: result.sectionsDetected,
      disclaimer: result.disclaimer,
    })

    await Assessment.updateMany(
      { userId, _id: { $ne: assessment._id }, superseded: false },
      { superseded: true, supersededBy: assessment._id }
    )

    const gate = decideGate(assessment, { isOwner: true, isLatest: true })
    res.status(201).json({
      success: true,
      assessment: present(assessment, gate),
    })
  } catch (err) {
    next(err)
  }
}

async function listAssessments(req, res, next) {
  try {
    const assessments = await Assessment.find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .select('-resumeText -jobDescription')

    res.json({
      success: true,
      count: assessments.length,
      assessments: assessments.map((item) => present(item, null)),
    })
  } catch (err) {
    next(err)
  }
}

async function getAssessment(req, res, next) {
  try {
    const assessment = await Assessment.findOne({
      _id: req.params.id,
      userId: req.user.userId,
    })
    if (!assessment) throw new NotFoundError('Assessment')
    const latest = await latestFor(req.user.userId)
    const gate = decideGate(assessment, {
      isOwner: true,
      isLatest: latest && String(latest._id) === String(assessment._id),
    })
    res.json({ success: true, assessment: present(assessment, gate) })
  } catch (err) {
    next(err)
  }
}

async function getGate(req, res, next) {
  try {
    const assessment = await latestFor(req.user.userId)
    if (!assessment) {
      return res.json({
        success: true,
        gate: {
          unlocked: false,
          reason: 'missing',
          threshold: ATS_CONFIG.gateThreshold,
          message: 'Upload a resume and a job description before the practice gate can open.',
        },
      })
    }
    const gate = decideGate(assessment, { isOwner: true, isLatest: true })
    res.json({ success: true, assessmentId: assessment._id, gate })
  } catch (err) {
    next(err)
  }
}

async function advance(req, res, next) {
  try {
    const assessment = req.body.assessmentId
      ? await Assessment.findOne({ _id: req.body.assessmentId, userId: req.user.userId })
      : await latestFor(req.user.userId)

    if (!assessment) throw new NotFoundError('Assessment')

    const latest = await latestFor(req.user.userId)
    const gate = decideGate(assessment, {
      isOwner: true,
      isLatest: latest && String(latest._id) === String(assessment._id),
    })

    res.json({
      success: true,
      gate,
      ignoredClientScore: Object.prototype.hasOwnProperty.call(req.body, 'score'),
    })
  } catch (err) {
    next(err)
  }
}

function uploadResume(req, res, next) {
  upload.single('resume')(req, res, (err) => {
    if (err && err.code === 'LIMIT_FILE_SIZE') {
      return next(new ValidationError('The file must be 5 MB or smaller.', [
        { field: 'resume', message: 'The file must be 5 MB or smaller.' },
      ]))
    }
    return next(err)
  })
}

module.exports = {
  uploadResume,
  createAssessment,
  listAssessments,
  getAssessment,
  getGate,
  advance,
}
