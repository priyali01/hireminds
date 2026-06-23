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
      <div className="news-feed-empty glass-card" style={{ padding: '2rem', borderRadius: '1rem', textAlign: 'center' }}>
        <p className="text-muted" style={{ margin: 0 }}>No news available right now.</p>
      </div>
    )
  }

  return (
    <div className="news-feed-widget glass-card" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
      <h3 className="widget-title gradient-text" style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Trending Tech News</h3>
      <div className="news-feed-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {articles.slice(0, 3).map((article, i) => (
          <motion.a 
            href={article.link}
            target="_blank"
            rel="noopener noreferrer"
            key={article._id || i}
            className="news-item"
            style={{ display: 'flex', gap: '1rem', alignItems: 'center', paddingBottom: '1rem', borderBottom: i < 2 ? '1px solid var(--color-border)' : 'none', textDecoration: 'none', color: 'inherit' }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            {article.thumbnail && (
              <img src={article.thumbnail} alt="" className="news-thumbnail" style={{ width: '80px', height: '60px', objectFit: 'cover', borderRadius: '0.5rem' }} />
            )}
            <div className="news-content" style={{ flex: 1 }}>
              <h4 className="news-title" style={{ margin: '0 0 0.25rem 0', fontSize: '1rem' }}>{article.title}</h4>
              <p className="news-meta" style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: 'var(--color-text-muted)', display: 'flex', gap: '0.5rem' }}>
                <span className="news-source">{article.source}</span>
                <span>•</span>
                <span className="news-date">{article.date}</span>
              </p>
              {article.tags && article.tags.length > 0 && (
                <div className="news-tags" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {article.tags.map(tag => (
                    <span key={tag} className="news-tag" style={{ fontSize: '0.75rem', background: 'var(--color-surface-2)', padding: '0.125rem 0.5rem', borderRadius: '1rem' }}>{tag}</span>
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
