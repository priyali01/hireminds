import { motion } from 'framer-motion'
import { useGetDashboardNewsQuery } from '../store/api'
import '../styles/dashboard.css' // We'll add some styles here or inline

export default function DashboardNewsFeed() {
  const { data, isLoading } = useGetDashboardNewsQuery()

  if (isLoading) {
    return <div className="skeleton" style={{ height: '200px', borderRadius: '1rem' }} />
  }

  const articles = data?.articles || []

  if (articles.length === 0) {
    return (
      <div className="news-feed-empty">
        <p>No news available right now.</p>
      </div>
    )
  }

  return (
    <div className="news-feed-widget">
      <h3 className="widget-title">Trending Tech News</h3>
      <div className="news-feed-list">
        {articles.slice(0, 3).map((article, i) => (
          <motion.a 
            href={article.link}
            target="_blank"
            rel="noopener noreferrer"
            key={article._id || i}
            className="news-item"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            {article.thumbnail && (
              <img src={article.thumbnail} alt="" className="news-thumbnail" />
            )}
            <div className="news-content">
              <h4 className="news-title">{article.title}</h4>
              <p className="news-meta">
                <span className="news-source">{article.source}</span>
                <span className="news-date">{article.date}</span>
              </p>
              {article.tags && article.tags.length > 0 && (
                <div className="news-tags">
                  {article.tags.map(tag => (
                    <span key={tag} className="news-tag">{tag}</span>
                  ))}
                </div>
              )}
            </div>
          </motion.a>
        ))}
      </div>
    </div>
  )
}
