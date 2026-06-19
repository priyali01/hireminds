const Experience = require('../models/experience.model')
const User = require('../models/user.model')
const { createExperienceSchema, moderateExperienceSchema } = require('../validators/community.validators')
const { NotFoundError, ValidationError } = require('../utils/errors')

// --- Public / User Endpoints ---

/**
 * GET /community/experiences
 * Fetches approved experiences for the feed.
 */
async function getFeed(req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const company = req.query.company

    const filter = { status: 'approved' }
    if (company) filter.company = new RegExp(company, 'i')

    const experiences = await Experience.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('authorId', 'fullName level badges')

    // Clean up anonymous posts
    const cleanedExperiences = experiences.map(exp => {
      const e = exp.toObject()
      if (e.isAnonymous) {
        e.authorId = { fullName: 'Anonymous Candidate', level: 'hidden' }
      }
      e.upvotesCount = e.upvotes ? e.upvotes.length : 0
      e.hasUpvoted = e.upvotes && req.user ? e.upvotes.some(id => id.toString() === req.user.userId) : false
      delete e.upvotes // Don't send full array of objectIds to client
      return e
    })

    const total = await Experience.countDocuments(filter)

    res.json({
      success: true,
      experiences: cleanedExperiences,
      page,
      totalPages: Math.ceil(total / limit)
    })
  } catch (err) {
    next(err)
  }
}

/**
 * POST /community/experiences
 * Submit a new interview experience. Defaults to 'pending' status.
 */
async function submitExperience(req, res, next) {
  try {
    const data = createExperienceSchema.parse(req.body)
    
    const exp = await Experience.create({
      authorId: req.user.userId,
      ...data,
      status: 'pending' // Goes to admin queue
    })

    res.status(201).json({ 
      success: true, 
      message: 'Experience submitted successfully. It will appear on the feed after moderation.',
      experienceId: exp._id 
    })
  } catch (err) {
    next(err)
  }
}

/**
 * POST /community/experiences/:id/upvote
 * Toggle an upvote on an experience
 */
async function toggleUpvote(req, res, next) {
  try {
    const exp = await Experience.findById(req.params.id)
    if (!exp) throw new NotFoundError('Experience')

    const hasUpvoted = exp.upvotes.includes(req.user.userId)
    if (hasUpvoted) {
      exp.upvotes.pull(req.user.userId)
    } else {
      exp.upvotes.push(req.user.userId)
    }
    
    await exp.save()
    res.json({ success: true, upvotesCount: exp.upvotes.length, hasUpvoted: !hasUpvoted })
  } catch (err) {
    next(err)
  }
}

// --- Admin Moderation Endpoints ---

/**
 * GET /community/admin/pending
 */
async function getPendingQueue(req, res, next) {
  try {
    const experiences = await Experience.find({ status: 'pending' })
      .sort({ createdAt: 1 })
      .populate('authorId', 'email fullName')

    res.json({ success: true, count: experiences.length, queue: experiences })
  } catch (err) {
    next(err)
  }
}

/**
 * PATCH /community/admin/moderate/:id
 */
async function moderateExperience(req, res, next) {
  try {
    const { status } = moderateExperienceSchema.parse(req.body)
    
    const exp = await Experience.findByIdAndUpdate(
      req.params.id, 
      { status }, 
      { new: true }
    )
    if (!exp) throw new NotFoundError('Experience')

    res.json({ success: true, experience: exp })
  } catch (err) {
    next(err)
  }
}

module.exports = {
  getFeed,
  submitExperience,
  toggleUpvote,
  getPendingQueue,
  moderateExperience
}
