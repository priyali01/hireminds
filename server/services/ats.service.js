const { GoogleGenerativeAI } = require('@google/generative-ai')
const { z } = require('zod')
const { AIError } = require('../utils/errors')
const logger = require('../utils/logger')

const PROMPT_VERSION = 'ats-v1.0'

// Models in fallback order
const MODEL_CHAIN = [
  'gemini-2.5-flash',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
]

/**
 * Level-aware ATS scoring weights.
 *
 * Freshers do not have work experience — scoring them on experience
 * would give a false low score. These weights reflect what freshers
 * actually have: projects, skills, education, certifications.
 */
const LEVEL_WEIGHTS = {
  fresher: {
    projects: 0.40,
    skills: 0.30,
    education: 0.20,
    certifications: 0.10,
    experience: 0,
  },
  intermediate: {
    experience: 0.30,
    skills: 0.30,
    projects: 0.25,
    education: 0.10,
    certifications: 0.05,
  },
  experienced: {
    experience: 0.40,
    skills: 0.30,
    projects: 0.15,
    education: 0.10,
    certifications: 0.05,
  },
}

/**
 * Zod schema for validating the AI response.
 * If Gemini returns malformed JSON, we catch it and throw AIError.
 */
const atsResponseSchema = z.object({
  overall_score: z.number().min(0).max(100),
  breakdown: z.object({
    skills: z.number().min(0).max(100),
    projects: z.number().min(0).max(100),
    education: z.number().min(0).max(100),
    experience: z.number().min(0).max(100).optional().default(0),
    certifications: z.number().min(0).max(100).optional().default(0),
  }),
  feedback: z.array(z.string()).min(1).max(10),
  strengths: z.array(z.string()).min(1).max(5),
  missing_keywords: z.array(z.string()).max(20),
  one_week_fix_plan: z.array(z.string()).max(7),
})

/**
 * Builds the ATS analysis prompt.
 * User content is injected after a clear delimiter so prompt injection
 * from the resume text cannot override the system instructions.
 *
 * @param {string} resumeText - The raw resume content
 * @param {string} level - fresher | intermediate | experienced
 * @returns {string} - The complete prompt
 */
function buildATSPrompt(resumeText, level) {
  const weights = LEVEL_WEIGHTS[level] || LEVEL_WEIGHTS.fresher

  return `You are an ATS (Applicant Tracking System) evaluator specialised in the Indian job market.
You evaluate resumes for ${level} candidates using LEVEL-AWARE scoring.

SCORING WEIGHTS FOR A ${level.toUpperCase()} CANDIDATE:
${Object.entries(weights)
  .filter(([, w]) => w > 0)
  .map(([k, v]) => `- ${k}: ${Math.round(v * 100)}%`)
  .join('\n')}

IMPORTANT INSTRUCTIONS:
- Score candidates against others at their SAME LEVEL, not against senior engineers.
- A fresher with strong projects, good skills, and a well-structured education section should score 70+.
- The feedback must be specific and actionable, not generic.
- The one_week_fix_plan must be tasks a student can realistically complete in one week.
- Return ONLY valid JSON. No markdown, no explanation, no extra text before or after the JSON.
- All scores are 0-100.
- Write in clear, encouraging English appropriate for Indian students.

OUTPUT FORMAT (strict JSON):
{
  "overall_score": <weighted composite 0-100>,
  "breakdown": {
    "skills": <0-100>,
    "projects": <0-100>,
    "education": <0-100>,
    "experience": <0-100>,
    "certifications": <0-100>
  },
  "feedback": ["specific improvement tip 1", "..."],
  "strengths": ["what this resume does well 1", "..."],
  "missing_keywords": ["keyword 1", "..."],
  "one_week_fix_plan": ["Day 1-2: task", "Day 3-4: task", "..."]
}

--- RESUME CONTENT BELOW THIS LINE ---
${resumeText}
--- END OF RESUME CONTENT ---`
}

/**
 * Calls the Gemini API with model fallback chain.
 * Retries through the model chain on 503, 429, or timeout.
 * Validates the response with Zod.
 *
 * @param {string} prompt
 * @returns {{ parsed: object, modelUsed: string }}
 */
async function callGeminiWithFallback(prompt) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

  for (const modelName of MODEL_CHAIN) {
    try {
      logger.info(`Calling Gemini model: ${modelName}`)
      const model = genAI.getGenerativeModel({ model: modelName })
      const result = await model.generateContent(prompt)
      const text = result.response.text()

      // Strip markdown code fences if Gemini adds them despite instructions
      const clean = text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim()

      let parsed
      try {
        parsed = JSON.parse(clean)
      } catch {
        logger.warn(`Model ${modelName} returned invalid JSON. Trying next model.`, { raw: clean.slice(0, 200) })
        continue // Try next model
      }

      // Validate shape with Zod
      const validated = atsResponseSchema.safeParse(parsed)
      if (!validated.success) {
        logger.warn(`Model ${modelName} response failed Zod validation. Trying next.`, {
          errors: validated.error.errors,
        })
        continue // Try next model
      }

      logger.info(`ATS analysis completed with model: ${modelName}`)
      return { parsed: validated.data, modelUsed: modelName }
    } catch (err) {
      const status = err?.status || err?.code
      const isRetryable = [503, 429, 'ETIMEDOUT', 'ECONNRESET'].includes(status)

      if (isRetryable) {
        logger.warn(`Model ${modelName} failed with retryable error. Trying next.`, {
          error: err.message,
          status,
        })
        continue
      }

      // Non-retryable error (e.g. 400 bad prompt) — don't try more models
      throw new AIError(`AI model error: ${err.message}`)
    }
  }

  // All models failed
  throw new AIError('All AI models failed to produce a valid response. Please try again.')
}

/**
 * Analyses a resume and returns a level-aware ATS score.
 *
 * @param {string} resumeText
 * @param {'fresher'|'intermediate'|'experienced'} level
 * @returns {{
 *   overall: number,
 *   breakdown: object,
 *   feedback: string[],
 *   strengths: string[],
 *   missingKeywords: string[],
 *   oneWeekFixPlan: string[],
 *   promptVersion: string,
 *   modelUsed: string,
 *   analysedAt: Date
 * }}
 */
async function analyseResume(resumeText, level = 'fresher') {
  const prompt = buildATSPrompt(resumeText, level)
  const { parsed, modelUsed } = await callGeminiWithFallback(prompt)

  return {
    overall: parsed.overall_score,
    breakdown: {
      skills: parsed.breakdown.skills,
      projects: parsed.breakdown.projects,
      education: parsed.breakdown.education,
      experience: parsed.breakdown.experience ?? 0,
      certifications: parsed.breakdown.certifications ?? 0,
    },
    feedback: parsed.feedback,
    strengths: parsed.strengths,
    missingKeywords: parsed.missing_keywords,
    oneWeekFixPlan: parsed.one_week_fix_plan,
    promptVersion: PROMPT_VERSION,
    modelUsed,
    analysedAt: new Date(),
  }
}

module.exports = {
  analyseResume,
  buildATSPrompt,
  LEVEL_WEIGHTS,
  PROMPT_VERSION,
}
