const { GoogleGenerativeAI } = require('@google/generative-ai')
const { aiQuestionSchema, aiEvaluationSchema } = require('../validators/interview.ai-schemas')
const {
  buildTechnicalPrompt,
  buildHRPrompt,
  buildBehavioralPrompt,
  buildEvaluationPrompt
} = require('./interview.prompts')
const { AIError } = require('../utils/errors')
const logger = require('../utils/logger')

const MODEL_CHAIN = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-1.5-pro']
const PROMPT_VERSION = 'int-v1.0'

async function callGeminiWithFallback(prompt, schema) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

  for (const modelName of MODEL_CHAIN) {
    try {
      logger.info(`Calling Gemini model for interview: ${modelName}`)
      const model = genAI.getGenerativeModel({ model: modelName })
      const result = await model.generateContent(prompt)
      const text = result.response.text()

      const clean = text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim()

      let parsed
      try {
        parsed = JSON.parse(clean)
      } catch {
        logger.warn(`Model ${modelName} returned invalid JSON. Trying next model.`)
        continue
      }

      const validated = schema.safeParse(parsed)
      if (!validated.success) {
        logger.warn(`Model ${modelName} response failed Zod validation.`, { errors: validated.error.errors })
        continue
      }

      return { parsed: validated.data, modelUsed: modelName }
    } catch (err) {
      const status = err?.status || err?.code
      const isRetryable = [503, 429, 'ETIMEDOUT', 'ECONNRESET'].includes(status)
      if (isRetryable) continue
      throw new AIError(`AI model error: ${err.message}`)
    }
  }

  throw new AIError('All AI models failed to produce a valid response.')
}

/**
 * Generates interview questions based on type and role.
 */
async function generateQuestions(type, role, resumeText = '', count = 5) {
  let prompt
  
  if (type === 'technical') {
    const context = resumeText ? resumeText.substring(0, 2000) : ''
    prompt = buildTechnicalPrompt(role, context, count)
  } else if (type === 'hr') {
    prompt = buildHRPrompt(role, count)
  } else if (type === 'behavioral') {
    prompt = buildBehavioralPrompt(role, count)
  } else {
    // Default fallback
    prompt = buildHRPrompt(role, count)
  }

  const { parsed, modelUsed } = await callGeminiWithFallback(prompt, aiQuestionSchema)
  
  return {
    questions: parsed.questions.map(q => ({ ...q, aiGenerated: true })),
    modelUsed,
    promptVersion: PROMPT_VERSION,
  }
}

/**
 * Evaluates a user's answer to an interview question.
 */
async function evaluateAnswer(question, userAnswer, role, roundType) {
  const prompt = buildEvaluationPrompt(question, userAnswer, role, roundType)
  const { parsed, modelUsed } = await callGeminiWithFallback(prompt, aiEvaluationSchema)

  return {
    evaluation: parsed,
    modelUsed,
    promptVersion: PROMPT_VERSION,
  }
}

module.exports = {
  generateQuestions,
  evaluateAnswer,
}
