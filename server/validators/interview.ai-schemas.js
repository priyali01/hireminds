const { z } = require('zod')

const aiQuestionSchema = z.object({
  questions: z.array(z.object({
    text: z.string(),
    category: z.string(),
    difficulty: z.enum(['easy', 'medium', 'hard']),
  })).min(1).max(20),
})

const aiEvaluationSchema = z.object({
  score: z.number().min(1).max(10),
  feedback: z.string(),
  missingElements: z.array(z.string()),
  improvedAnswer: z.string(),
  toneAssessment: z.string().optional(),
})

module.exports = {
  aiQuestionSchema,
  aiEvaluationSchema,
}
