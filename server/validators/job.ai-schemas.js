const { z } = require('zod')

const aiJDMatchSchema = z.object({
  score: z.number().min(0).max(100),
  matchedKeywords: z.array(z.string()),
  missingKeywords: z.array(z.string()),
  suggestions: z.array(z.string()),
})

const aiJobInsightSchema = z.object({
  role: z.string(),
  requiredSkills: z.array(z.string()),
  salaryTrends: z.object({
    min: z.string(),
    max: z.string(),
    median: z.string()
  }),
  interviewProcess: z.array(z.string()),
  topCompanies: z.array(z.string()),
  growthOutlook: z.string()
})

module.exports = {
  aiJDMatchSchema,
  aiJobInsightSchema
}
