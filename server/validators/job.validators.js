const { z } = require('zod')

const createJobSchema = z.object({
  company: z.string().min(1, 'Company is required'),
  role: z.string().min(1, 'Role is required'),
  status: z.enum(['saved', 'applied', 'interview', 'offer', 'rejected']).default('saved'),
  location: z.string().optional(),
  url: z.string().url().optional().or(z.literal('')),
  salary: z.string().optional(),
  notes: z.string().optional()
})

const updateJobStatusSchema = z.object({
  status: z.enum(['saved', 'applied', 'interview', 'offer', 'rejected'])
})

const matchJDSchema = z.object({
  jobDescription: z.string().min(50, 'Job description must be at least 50 characters'),
  resumeId: z.string().optional() // Can be omitted to use latest resume
})

const jobInsightSchema = z.object({
  roleTitle: z.string().min(2, 'Role title is required')
})

module.exports = {
  createJobSchema,
  updateJobStatusSchema,
  matchJDSchema,
  jobInsightSchema
}
