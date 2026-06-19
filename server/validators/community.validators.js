const { z } = require('zod')

const createExperienceSchema = z.object({
  company: z.string().min(1).max(100),
  role: z.string().min(1).max(100),
  outcome: z.enum(['offer', 'rejected', 'ghosted', 'awaiting']),
  dateOfInterview: z.coerce.date(),
  content: z.string().min(10).max(5000),
  questionsAsked: z.array(z.string()).max(50).optional(),
  isAnonymous: z.boolean().optional().default(true)
})

const moderateExperienceSchema = z.object({
  status: z.enum(['approved', 'rejected'])
})

const createReviewRequestSchema = z.object({
  resumeId: z.string().min(1),
  targetRole: z.string().min(1).max(100),
  level: z.enum(['fresher', 'junior', 'mid', 'senior'])
})

const submitReviewSchema = z.object({
  overallRating: z.number().min(1).max(5),
  comments: z.string().min(10).max(2000),
  sectionFeedback: z.array(z.object({
    section: z.string(),
    comment: z.string()
  })).optional()
})

module.exports = {
  createExperienceSchema,
  moderateExperienceSchema,
  createReviewRequestSchema,
  submitReviewSchema
}
