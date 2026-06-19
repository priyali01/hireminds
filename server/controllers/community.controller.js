const Experience = require('../models/experience.model')
const ReviewRequest = require('../models/reviewRequest.model')
const User = require('../models/user.model')
const { createExperienceSchema, moderateExperienceSchema, createReviewRequestSchema, submitReviewSchema } = require('../validators/community.validators')
const { awardPoints } = require('../services/gamification.service')
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

// --- Peer Resume Reviews Endpoints ---

/**
 * POST /community/reviews/request
 * Request a peer review for a resume
 */
async function requestReview(req, res, next) {
  try {
    const data = createReviewRequestSchema.parse(req.body)
    
    // Check if user already has an open request for this resume
    const existing = await ReviewRequest.findOne({ 
      requesterId: req.user.userId, 
      resumeId: data.resumeId,
      status: { $in: ['open', 'in_review'] }
    })
    
    if (existing) {
      throw new ValidationError('You already have an active review request for this resume')
    }

    const request = await ReviewRequest.create({
      requesterId: req.user.userId,
      ...data
    })

    res.status(201).json({ success: true, request })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /community/reviews/open
 * Fetch open review requests matching user's target role/level
 */
async function getOpenReviews(req, res, next) {
  try {
    const user = await User.findById(req.user.userId)
    
    // Suggest resumes matching their target roles, excluding their own
    const filter = {
      status: 'open',
      requesterId: { $ne: req.user.userId }
    }
    
    // If they have target roles, prioritize matching those
    if (user.targetRoles && user.targetRoles.length > 0) {
      // Basic text search approximation for MVP
      filter.targetRole = { $in: user.targetRoles.map(r => new RegExp(r, 'i')) }
    }

    let openRequests = await ReviewRequest.find(filter)
      .sort({ createdAt: 1 }) // oldest first (needs review most)
      .limit(10)
      .populate('resumeId', 'rawText') // Only fetch the text, not full analysis
      
    // If no exact matches, just return any open requests
    if (openRequests.length === 0) {
      openRequests = await ReviewRequest.find({
        status: 'open',
        requesterId: { $ne: req.user.userId }
      }).sort({ createdAt: 1 }).limit(10).populate('resumeId', 'rawText')
    }

    // Anonymize the requester info
    const sanitizedRequests = openRequests.map(r => ({
      _id: r._id,
      targetRole: r.targetRole,
      level: r.level,
      createdAt: r.createdAt,
      resumeText: r.resumeId?.rawText // Give reviewer the text to review
    }))

    res.json({ success: true, count: sanitizedRequests.length, requests: sanitizedRequests })
  } catch (err) {
    next(err)
  }
}

/**
 * POST /community/reviews/:id/submit
 * Submit a peer review and earn points
 */
async function submitReview(req, res, next) {
  try {
    const feedback = submitReviewSchema.parse(req.body)
    
    const request = await ReviewRequest.findOne({ 
      _id: req.params.id,
      status: 'open',
      requesterId: { $ne: req.user.userId } // Can't review your own
    })
    
    if (!request) {
      throw new NotFoundError('Open Review Request')
    }

    request.status = 'completed'
    request.reviewerId = req.user.userId
    request.feedback = feedback
    request.completedAt = new Date()
    
    await request.save()

    // Award Gamification points for helping a peer!
    await awardPoints(req.user.userId, 'PEER_REVIEW')

    res.json({ 
      success: true, 
      message: 'Review submitted! You earned +25 points.' 
    })
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
  requestReview,
  getOpenReviews,
  submitReview,
  getPendingQueue,
  moderateExperience
}
