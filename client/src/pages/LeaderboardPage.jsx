import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useGetGlobalLeaderboardQuery, useGetCampusLeaderboardQuery } from '../store/api'
import '../styles/dashboard.css' // Reusing layouts

export default function LeaderboardPage() {
  const [view, setView] = useState('global') // 'global' or 'campus'
  
  const { data: globalData, isLoading: isGlobalLoading } = useGetGlobalLeaderboardQuery()
  const { data: campusData, isLoading: isCampusLoading } = useGetCampusLeaderboardQuery()

  const data = view === 'global' ? globalData : campusData
  const isLoading = view === 'global' ? isGlobalLoading : isCampusLoading

  return (
    <div className="dashboard-page">
      <nav className="nav">
        <div className="nav-brand">🧠 HireMinds</div>
        <div className="nav-links">
          <Link to="/dashboard" className="nav-link">Dashboard</Link>
          <Link to="/resume" className="nav-link">Resume</Link>
          <Link to="/jobs" className="nav-link">Jobs</Link>
          <Link to="/leaderboard" className="nav-link active">Leaderboard</Link>
        </div>
      </nav>

      <div className="dashboard-layout" style={{ maxWidth: '800px' }}>
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 className="welcome-title">Top Achievers 🏆</h1>
            <p className="welcome-subtitle">Climb the ranks by practicing interviews and uploading resumes.</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--color-surface-2)', padding: '0.25rem', borderRadius: '0.5rem' }}>
            <button 
              className={`btn ${view === 'global' ? 'btn-primary' : 'btn-ghost'}`} 
              onClick={() => setView('global')}
              style={{ margin: 0 }}
            >
              Global
            </button>
            <button 
              className={`btn ${view === 'campus' ? 'btn-primary' : 'btn-ghost'}`} 
              onClick={() => setView('campus')}
              style={{ margin: 0 }}
            >
              Campus
            </button>
          </div>
        </div>

        {!isLoading && data?.userStats && (
          <motion.div 
            className="user-rank-card"
            style={{ 
              background: 'linear-gradient(135deg, var(--color-primary-light), var(--color-primary))',
              color: 'white',
              padding: '1.5rem',
              borderRadius: '1rem',
              marginBottom: '2rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Your Rank: #{data.userStats.rank || '--'}</h2>
              <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9 }}>Points: {data.userStats.points} | 🔥 Streak: {data.userStats.streak} Days</p>
            </div>
            {data.userStats.badges && data.userStats.badges.length > 0 && (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {data.userStats.badges.map(b => (
                  <span key={b} title={b} style={{ fontSize: '2rem' }}>🏅</span>
                ))}
              </div>
            )}
          </motion.div>
        )}

        <div className="leaderboard-list" style={{ background: 'var(--color-surface)', borderRadius: '1rem', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
          {isLoading ? (
            <div style={{ padding: '2rem', textAlign: 'center' }}>Loading ranks...</div>
          ) : (
            data?.leaderboard?.map((user, index) => (
              <motion.div 
                key={user._id}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  padding: '1rem 1.5rem', 
                  borderBottom: '1px solid var(--color-border)',
                  background: index < 3 ? 'var(--color-surface-2)' : 'transparent'
                }}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <div style={{ width: '40px', fontWeight: 'bold', fontSize: index < 3 ? '1.5rem' : '1.1rem', color: index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : 'var(--color-text-muted)' }}>
                  #{index + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{user.fullName}</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{user.level || 'Fresher'} {user.currentStreak > 2 ? `· 🔥 ${user.currentStreak}` : ''}</div>
                </div>
                <div style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                  {user.points} pts
                </div>
              </motion.div>
            ))
          )}
          
          {data?.leaderboard?.length === 0 && (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              No top users found yet.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
