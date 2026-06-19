const axios = require('axios')
const { GoogleGenerativeAI } = require('@google/generative-ai')
const NewsArticle = require('../models/news.model')
const logger = require('../utils/logger')

const NEWS_QUERIES = [
  'Indian IT hiring news',
  'software engineering jobs India',
  'tech layoffs startups India',
  'TCS Infosys Wipro hiring news'
]

/**
 * Fetches news from SerpAPI (Google News), tags it using Gemini, and caches it in MongoDB.
 * Normally invoked via node-cron every 6 hours.
 */
async function fetchAndCacheNews() {
  logger.info('Starting scheduled news fetch...')
  
  try {
    for (const query of NEWS_QUERIES) {
      const response = await axios.get('https://serpapi.com/search', {
        params: {
          engine: 'google_news',
          q: query,
          gl: 'in',
          hl: 'en',
          api_key: process.env.SERPAPI_KEY
        }
      })

      const articles = response.data?.news_results || []
      
      // Process top 5 articles per query
      for (const article of articles.slice(0, 5)) {
        // Skip if already exists
        const exists = await NewsArticle.exists({ link: article.link })
        if (exists) continue

        // Quick AI tagging (using flash for speed and cost)
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
        
        let tags = ['General Tech']
        try {
          const prompt = `Categorize this news article into 1-3 tags relevant to an Indian software engineering job seeker. 
          Article Title: ${article.title}
          Snippet: ${article.snippet || ''}
          
          Return ONLY a JSON array of strings. Example: ["Hiring", "Startups", "Layoffs", "AI", "MNC"]`
          
          const aiResult = await model.generateContent(prompt)
          const text = aiResult.response.text().replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim()
          const parsedTags = JSON.parse(text)
          if (Array.isArray(parsedTags)) tags = parsedTags
        } catch (e) {
          logger.warn(`Failed to tag article ${article.title}: ${e.message}`)
        }

        await NewsArticle.create({
          title: article.title,
          link: article.link,
          source: article.source?.name || 'News',
          snippet: article.snippet || '',
          date: article.date || new Date().toISOString(),
          thumbnail: article.thumbnail || '',
          tags
        })
      }
    }
    logger.info('News fetch and cache complete.')
  } catch (err) {
    logger.error('Failed to fetch news from SerpAPI:', err.message)
  }
}

/**
 * Retrieves personalized news for a user based on their target roles.
 */
async function getPersonalizedNews(targetRoles = []) {
  // If no specific roles, just get latest
  if (!targetRoles || targetRoles.length === 0) {
    return await NewsArticle.find().sort({ createdAt: -1 }).limit(10)
  }

  // Very naive personalization: Extract simple keywords from target roles
  const keywords = targetRoles.join(' ').split(' ').filter(w => w.length > 3)
  
  if (keywords.length === 0) {
    return await NewsArticle.find().sort({ createdAt: -1 }).limit(10)
  }

  // Find articles where tags match any of the keywords (case insensitive regex)
  const regexes = keywords.map(kw => new RegExp(kw, 'i'))
  const articles = await NewsArticle.find({
    tags: { $in: regexes }
  }).sort({ createdAt: -1 }).limit(10)

  // Fallback if no personalized matches
  if (articles.length === 0) {
    return await NewsArticle.find().sort({ createdAt: -1 }).limit(10)
  }

  return articles
}

module.exports = {
  fetchAndCacheNews,
  getPersonalizedNews
}
