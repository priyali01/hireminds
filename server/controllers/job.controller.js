const JobApplication = require('../models/job.model')
const JobInsight = require('../models/insight.model')
const { createJobSchema, updateJobStatusSchema, matchJDSchema, jobInsightSchema } = require('../validators/job.validators')
const { awardPoints } = require('../services/gamification.service')
const { NotFoundError, QuotaError } = require('../utils/errors')

// --- Application Tracker (Kanban) ---

async function getJobs(req, res, next) {
  try {
    const jobs = await JobApplication.find({ userId: req.user.userId }).sort({ updatedAt: -1 })
    res.json({ success: true, jobs })
  } catch (err) {
    next(err)
  }
}

async function createJob(req, res, next) {
  try {
    const data = createJobSchema.parse(req.body)
    const job = await JobApplication.create({
      userId: req.user.userId,
      ...data,
      appliedDate: data.status === 'applied' ? new Date() : undefined
    })

    // Award gamification points
    await awardPoints(req.user.userId, 'JOB_APPLICATION')

    res.status(201).json({ success: true, job })
  } catch (err) {
    next(err)
  }
}

async function updateJobStatus(req, res, next) {
  try {
    const { status } = updateJobStatusSchema.parse(req.body)
    
    const updateData = { status }
    if (status === 'applied') {
      updateData.appliedDate = new Date()
    }

    const job = await JobApplication.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      updateData,
      { new: true }
    )
    
    if (!job) throw new NotFoundError('Job Application')

    res.json({ success: true, job })
  } catch (err) {
    next(err)
  }
}

async function deleteJob(req, res, next) {
  try {
    const job = await JobApplication.findOneAndDelete({ _id: req.params.id, userId: req.user.userId })
    if (!job) throw new NotFoundError('Job Application')
    
    res.json({ success: true, message: 'Job deleted' })
  } catch (err) {
    next(err)
  }
}

const User = require('../models/user.model')
const Resume = require('../models/resume.model')
const { matchResumeToJD, generateJobInsight } = require('../services/job.service')

// --- AI Tools ---

async function matchJD(req, res, next) {
  try {
    const data = matchJDSchema.parse(req.body)
    
    // Check quota (same as interview quota for AI tools)
    if (req.user.plan === 'free' && req.user.aiUsageToday >= 5) {
      throw new QuotaError(req.user.lastQuotaReset)
    }

    // Determine which resume to use
    let resume
    if (data.resumeId) {
      resume = await Resume.findOne({ _id: data.resumeId, userId: req.user.userId })
    } else {
      resume = await Resume.findOne({ userId: req.user.userId }).sort({ createdAt: -1 })
    }

    if (!resume || !resume.rawText) {
      throw new NotFoundError('Resume (Please upload a resume first)')
    }

    // Call service
    const match = await matchResumeToJD(resume.rawText, data.jobDescription)
    
    // Increment daily AI usage
    await User.findByIdAndUpdate(req.user.userId, { $inc: { aiUsageToday: 1 } })

    res.json({ success: true, match })
  } catch (err) {
    next(err)
  }
}

async function getJobInsight(req, res, next) {
  try {
    const { roleTitle } = jobInsightSchema.parse(req.query)
    
    const insight = await generateJobInsight(roleTitle)
    
    res.json({ success: true, insight })
  } catch (err) {
    next(err)
  }
}

module.exports = {
  getJobs,
  createJob,
  updateJobStatus,
  deleteJob,
  matchJD,
  getJobInsight
}
