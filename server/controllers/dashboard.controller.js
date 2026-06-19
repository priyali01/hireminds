const { getPersonalizedNews, fetchAndCacheNews } = require('../services/news.service')
const { getUpcomingEvents } = require('../services/calendar.service')

async function getNews(req, res, next) {
  try {
    const targetRoles = req.user?.targetRoles || []
    const news = await getPersonalizedNews(targetRoles)
    res.json({ success: true, articles: news })
  } catch (err) {
    next(err)
  }
}

async function triggerNewsFetch(req, res, next) {
  try {
    // Hidden endpoint just for manual triggering during dev
    fetchAndCacheNews() // run async
    res.json({ success: true, message: 'News fetch job triggered in background' })
  } catch (err) {
    next(err)
  }
}

async function getEvents(req, res, next) {
  try {
    const events = await getUpcomingEvents()
    res.json({ success: true, events })
  } catch (err) {
    next(err)
  }
}

module.exports = {
  getNews,
  triggerNewsFetch,
  getEvents
}
