const { z } = require('zod')

// --- Auth validators ---

const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100).trim(),
  email: z.string().email('Enter a valid email address').toLowerCase().trim(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  consentGiven: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the privacy policy to register (DPDP Act 2023)' }),
  }),
})

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address').toLowerCase().trim(),
  password: z.string().min(1, 'Password is required'),
})

// --- Onboarding validators ---

const onboardingSchema = z.object({
  level: z.enum(['fresher', 'intermediate', 'experienced'], {
    errorMap: () => ({ message: 'Level must be fresher, intermediate, or experienced' }),
  }),
  targetRoles: z
    .array(z.string().trim().min(1))
    .min(1, 'Select at least one target role')
    .max(5, 'Select up to 5 target roles'),
  skills: z
    .array(z.string().trim().min(1))
    .min(1, 'Add at least one skill')
    .max(20, 'You can add up to 20 skills'),
  college: z.string().trim().min(2, 'College name is required').max(200),
  branch: z.string().trim().min(2, 'Branch is required').max(100),
  graduationYear: z
    .number()
    .int()
    .min(2000, 'Invalid graduation year')
    .max(2035, 'Invalid graduation year'),
})

// --- Resume validators ---

const resumeAnalyzeSchema = z.object({
  resumeText: z.string().min(50, 'Resume text is too short to analyse'),
  level: z.enum(['fresher', 'intermediate', 'experienced']).optional().default('fresher'),
})

const resumeFeedbackSchema = z.object({
  resumeId: z.string().min(1, 'Resume ID is required'),
  thumbsUp: z.boolean(),
  comment: z.string().max(500).optional().default(''),
})

module.exports = {
  registerSchema,
  loginSchema,
  onboardingSchema,
  resumeAnalyzeSchema,
  resumeFeedbackSchema,
}
