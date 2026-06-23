import { useState } from 'react'
import { motion } from 'framer-motion'
import { useGetGlobalLeaderboardQuery, useGetCampusLeaderboardQuery } from '../store/api'
import '../styles/dashboard.css'

function HexagonRank({ rank }) {
  return (
    <div style={{ position: 'relative', width: '100px', height: '115px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* Background glow */}
      <div style={{ position: 'absolute', width: '150%', height: '150%', background: 'radial-gradient(circle, rgba(16, 185, 129, 0.4) 0%, transparent 70%)', zIndex: 0 }} />
      
      {/* Hexagon Shape */}
      <div style={{
        position: 'absolute',
        width: '80px',
        height: '92px',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(16, 185, 129, 0.3) 100%)',
        clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
        zIndex: 1,
        border: '1px solid rgba(16, 185, 129, 0.5)' // Note: clip-path hides standard borders, so we rely on the inner background or shadow
      }} />
      <div style={{
        position: 'absolute',
        width: '76px',
        height: '88px',
        background: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
        clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
        zIndex: 2
      }} />

      {/* Content */}
      <div style={{ zIndex: 3, textAlign: 'center', marginTop: '10px' }}>
        <h1 style={{ margin: 0, fontSize: '2.5rem', color: '#FCD34D', textShadow: '0px 2px 10px rgba(252, 211, 77, 0.5)', lineHeight: 1 }}>{rank}</h1>
      </div>

      {/* Crown */}
      <div style={{ position: 'absolute', top: '-15px', zIndex: 4, fontSize: '2.5rem', filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.5))' }}>
        👑
      </div>
    </div>
  )
}

function FeatureBox({ icon, title, desc }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.9375rem', fontWeight: 600 }}>{title}</h4>
        <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>{desc}</p>
      </div>
    </div>
  )
}

export default function LeaderboardPage() {
  const [view, setView] = useState('global') // 'global' or 'campus'
  
  const { data: globalData, isLoading: isGlobalLoading } = useGetGlobalLeaderboardQuery()
  const { data: campusData, isLoading: isCampusLoading } = useGetCampusLeaderboardQuery()

  const data = view === 'global' ? globalData : campusData
  const isLoading = view === 'global' ? isGlobalLoading : isCampusLoading

  return (
    <div className="dashboard-page" style={{ padding: '2rem' }}>

      <div className="dashboard-layout" style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', color: 'var(--color-primary-light)' }}>
              🏆
            </div>
            <div>
              <h1 style={{ fontSize: '2.5rem', margin: '0 0 0.5rem 0', fontWeight: 700 }}>
                Top <span className="gradient-text">Achievers</span>
              </h1>
              <p style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: '0.9375rem' }}>Climb the ranks by practicing interviews and uploading resumes.</p>
            </div>
          </div>
          
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', padding: '0.25rem', borderRadius: '2rem', border: '1px solid rgba(255,255,255,0.05)' }}>
            <button 
              className={`btn`} 
              onClick={() => setView('global')}
              style={{ 
                margin: 0, padding: '0.5rem 1.25rem', borderRadius: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
                background: view === 'global' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                color: view === 'global' ? 'var(--color-primary-light)' : 'var(--color-text-muted)',
                fontWeight: view === 'global' ? 600 : 400
              }}
            >
              <span>🌐</span> Global
            </button>
            <button 
              className={`btn`} 
              onClick={() => setView('campus')}
              style={{ 
                margin: 0, padding: '0.5rem 1.25rem', borderRadius: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
                background: view === 'campus' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                color: view === 'campus' ? 'var(--color-primary-light)' : 'var(--color-text-muted)',
                fontWeight: view === 'campus' ? 600 : 400
              }}
            >
              <span>🏫</span> Campus
            </button>
          </div>
        </div>

        {/* Hero Rank Banner */}
        {!isLoading && data?.userStats && (
          <motion.div 
            style={{ 
              background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.05) 0%, rgba(16, 185, 129, 0.15) 100%)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              padding: '2rem 3rem',
              borderRadius: '1.5rem',
              marginBottom: '2rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              position: 'relative',
              overflow: 'hidden'
            }}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            {/* Soft decorative background glow */}
            <div style={{ position: 'absolute', right: '0', top: '0', width: '50%', height: '100%', background: 'linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.1))', pointerEvents: 'none' }} />

            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ color: 'var(--color-primary-light)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Your Rank</div>
              <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '2rem', fontWeight: 700 }}>
                You're Ranked <span style={{ color: 'var(--color-primary-light)' }}>#{data.userStats.rank || '--'}</span>
              </h2>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <span style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)', padding: '0.5rem 1rem', borderRadius: '2rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: '#FCD34D' }}>⭐</span> Points: {data.userStats.points}
                </span>
                <span style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)', padding: '0.5rem 1rem', borderRadius: '2rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: '#ef4444' }}>🔥</span> Streak: {data.userStats.streak} Days
                </span>
              </div>
            </div>
            
            <div style={{ position: 'relative', zIndex: 1, marginRight: '2rem' }}>
              <HexagonRank rank={data.userStats.rank || '--'} />
            </div>
          </motion.div>
        )}

        {/* Leaderboard Table */}
        <div className="glass-card" style={{ borderRadius: '1.5rem', overflow: 'hidden', marginBottom: '2rem' }}>
          {/* Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 100px', padding: '1rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <div>Rank</div>
            <div>User</div>
            <div style={{ textAlign: 'right' }}>Points</div>
          </div>

          {/* List */}
          {isLoading ? (
            <div style={{ padding: '4rem', display: 'flex', justifyContent: 'center' }}>
              <span className="spinner" />
            </div>
          ) : (
            <div>
              {data?.leaderboard?.map((user, index) => {
                // Determine rank styling
                let rankDisplay = index + 1
                if (index === 0) rankDisplay = <span style={{ fontSize: '1.5rem' }}>🥇</span>
                else if (index === 1) rankDisplay = <span style={{ fontSize: '1.5rem' }}>🥈</span>
                else if (index === 2) rankDisplay = <span style={{ fontSize: '1.5rem' }}>🥉</span>

                const isCurrentUser = user._id === data.userStats?.userId // Assuming API returns userId in userStats

                return (
                  <motion.div 
                    key={user._id}
                    style={{ 
                      display: 'grid', 
                      gridTemplateColumns: '80px 1fr 100px', 
                      alignItems: 'center', 
                      padding: '1rem 2rem', 
                      borderBottom: '1px solid rgba(255,255,255,0.02)',
                      background: isCurrentUser ? 'rgba(16, 185, 129, 0.05)' : 'transparent'
                    }}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="table-row-hover"
                  >
                    <div style={{ fontWeight: 600, fontSize: typeof rankDisplay === 'number' ? '1.1rem' : 'inherit', color: 'var(--color-text-muted)' }}>
                      {typeof rankDisplay === 'number' ? rankDisplay : rankDisplay}
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                         {/* Placeholder Avatar */}
                         <span style={{ fontSize: '1.25rem', color: '#fff' }}>👩🏽‍💼</span>
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{user.fullName}</span>
                          {index === 0 && <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--color-primary-light)', padding: '0.125rem 0.5rem', borderRadius: '1rem', fontSize: '0.625rem', fontWeight: 700 }}>You</span>}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.125rem' }}>{user.level || 'fresher'}</div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', fontWeight: 600, color: 'var(--color-primary-light)' }}>
                      {user.points} pts
                    </div>
                  </motion.div>
                )
              })}

              {data?.leaderboard?.length === 0 && (
                <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  No top users found yet.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Features Banner */}
        <div className="glass-card" style={{ padding: '2rem 3rem', borderRadius: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2rem' }}>
          <FeatureBox 
            icon="🎙️" 
            title="Practice Interviews" 
            desc="More practice, higher ranking" 
          />
          <FeatureBox 
            icon="📄" 
            title="Upload Resumes" 
            desc="Get AI feedback and improve" 
          />
          <FeatureBox 
            icon="🏆" 
            title="Climb the Ranks" 
            desc="Stay consistent and win" 
          />
        </div>

      </div>
    </div>
  )
}
