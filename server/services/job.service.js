const crypto = require('crypto')
const axios = require('axios')
const JobInsight = require('../models/insight.model')
const { buildJDMatchPrompt, buildInsightExtractionPrompt } = require('./job.prompts')
const { aiJDMatchSchema, aiJobInsightSchema } = require('../validators/job.ai-schemas')
const { callGeminiWithFallback } = require('./interview.service') // Re-using the fallback chain logic
const logger = require('../utils/logger')

/**
 * Compares a resume against a job description using Gemini.
 */
async function matchResumeToJD(resumeText, jobDescription) {
  const prompt = buildJDMatchPrompt(resumeText.substring(0, 3000), jobDescription.substring(0, 3000))
  const { parsed } = await callGeminiWithFallback(prompt, aiJDMatchSchema)
  return parsed
}

/**
 * Retrieves job insights using SerpAPI to gather data, then Gemini to structure it.
 * Uses MongoDB TTL collections for 24hr caching based on the role string.
 */
async function generateJobInsight(roleTitle) {
  // 1. Check cache (case-insensitive hash)
  const normalizedRole = roleTitle.trim().toLowerCase()
  const queryHash = crypto.createHash('sha256').update(normalizedRole).digest('hex')
  
  let cachedInsight = await JobInsight.findOne({ queryHash })
  
  if (cachedInsight) {
    logger.info(`Cache hit for job insight: ${roleTitle}`)
    return {
      role: cachedInsight.role,
      requiredSkills: cachedInsight.requiredSkills,
      salaryTrends: cachedInsight.salaryTrends,
      interviewProcess: cachedInsight.interviewProcess,
      topCompanies: cachedInsight.topCompanies,
      growthOutlook: cachedInsight.growthOutlook,
      cached: true
    }
  }

  logger.info(`Cache miss for job insight: ${roleTitle}. Fetching from SerpAPI...`)

  // 2. Fetch data from SerpAPI (Google Search)
  let searchResultsText = ''
  try {
    const response = await axios.get('https://serpapi.com/search', {
      params: {
        engine: 'google',
        q: `${roleTitle} software job requirements salary interview process India top companies`,
        api_key: process.env.SERPAPI_KEY,
        gl: 'in', // India
        hl: 'en'
      }
    })

    const organicResults = response.data?.organic_results || []
    
    // Concatenate snippets to form a knowledge base for Gemini
    searchResultsText = organicResults
      .slice(0, 5)
      .map(r => `${r.title}\n${r.snippet}`)
      .join('\n\n')

  } catch (err) {
    logger.error('SerpAPI search failed:', err.message)
    // We'll proceed with an empty search result text, Gemini can hallucinate based on its internal knowledge
    // as a graceful fallback.
    searchResultsText = 'No live search data available. Rely on internal knowledge for the Indian tech market.'
  }

  // 3. Extract and structure using Gemini
  const prompt = buildInsightExtractionPrompt(roleTitle, searchResultsText)
  const { parsed } = await callGeminiWithFallback(prompt, aiJobInsightSchema)

  // 4. Save to MongoDB (TTL index will expire it in 24 hours)
  try {
    await JobInsight.create({
      queryHash,
      role: parsed.role,
      requiredSkills: parsed.requiredSkills,
      salaryTrends: parsed.salaryTrends,
      interviewProcess: parsed.interviewProcess,
      topCompanies: parsed.topCompanies,
      growthOutlook: parsed.growthOutlook
    })
  } catch (err) {
    // Ignore duplicate key errors if a concurrent request already cached it
    if (err.code !== 11000) {
      logger.warn('Failed to cache job insight:', err)
    }
  }

  return { ...parsed, cached: false }
}

module.exports = {
  matchResumeToJD,
  generateJobInsight
}
