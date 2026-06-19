const { z } = require('zod')

const createSessionSchema = z.object({
  type: z.enum(['technical', 'hr', 'behavioral'], {
    errorMap: () => ({ message: 'Type must be technical, hr, or behavioral' }),
  }),
  role: z.string().min(2, 'Target role is required').max(100).trim(),
  roundType: z.string().max(100).optional(),
  company: z.string().max(100).optional(),
  resumeId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid resume ID').optional(),
})

const submitAnswerSchema = z.object({
  questionIndex: z.number().int().min(0, 'Invalid question index'),
  userAnswer: z.string().min(10, 'Answer is too short to evaluate').max(5000),
})

const setupDriveSchema = z.object({
  driveType: z.enum(['tcs_nqt', 'infosys_infytq', 'amcat', 'wipro_nlth', 'cognizant_genc'], {
    errorMap: () => ({ message: 'Invalid drive type specified' }),
  }),
})

module.exports = {
  createSessionSchema,
  submitAnswerSchema,
  setupDriveSchema,
}
