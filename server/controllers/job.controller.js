const JobApplication = require('../models/job.model')
const JobInsight = require('../models/insight.model')
const { createJobSchema, updateJobStatusSchema, matchJDSchema, jobInsightSchema } = require('../validators/job.validators')
const { NotFoundError } = require('../utils/errors')

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

// --- AI Tools (Stubs for 3B) ---

async function matchJD(req, res, next) {
  try {
    // STUB: Will implement AI matching in 3B
    const data = matchJDSchema.parse(req.body)
    
    res.json({ 
      success: true, 
      match: {
        score: 75,
        matchedKeywords: ['React', 'Node.js', 'MongoDB'],
        missingKeywords: ['Docker', 'AWS'],
        suggestions: ['Add a project showcasing AWS deployment']
      }
    })
  } catch (err) {
    next(err)
  }
}

async function getJobInsight(req, res, next) {
  try {
    // STUB: Will implement SerpAPI + Gemini insight in 3B
    const { roleTitle } = jobInsightSchema.parse(req.query)
    
    res.json({
      success: true,
      insight: {
        role: roleTitle,
        requiredSkills: ['JavaScript', 'React', 'Node.js'],
        salaryTrends: { min: '₹6L', max: '₹12L', median: '₹8L' },
        interviewProcess: ['OA Round', 'Technical 1', 'Technical 2', 'HR'],
        topCompanies: ['TCS', 'Infosys', 'Startup Inc'],
        growthOutlook: 'High demand over next 5 years'
      }
    })
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
