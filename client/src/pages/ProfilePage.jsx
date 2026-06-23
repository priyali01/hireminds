import { useSelector } from 'react-redux'
import { selectCurrentUser } from '../store/authSlice'
import { motion } from 'framer-motion'
import '../styles/dashboard.css'

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 15 } }
}

export default function ProfilePage() {
  const user = useSelector(selectCurrentUser)

  if (!user) return null

  return (
    <motion.div className="dashboard-page" style={{ padding: '2rem' }} initial="hidden" animate="show" variants={containerVariants}>
      <div className="dashboard-layout" style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', margin: '0 0 0.5rem 0', fontWeight: 700 }}>
              Your <span className="gradient-text">Profile</span>✨
            </h1>
            <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>Manage your personal details and preferences</p>
          </div>
          <button className="btn btn-primary" onClick={() => alert('Edit profile functionality coming soon!')}>
            Edit Profile
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
          
          {/* Left Column - User Identity */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <motion.div variants={itemVariants} className="glass-card" style={{ padding: '2rem', borderRadius: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div style={{ 
                width: '120px', height: '120px', borderRadius: '50%', 
                background: 'linear-gradient(135deg, rgba(45, 212, 191, 0.1) 0%, rgba(16, 185, 129, 0.2) 100%)', 
                border: '2px solid rgba(45, 212, 191, 0.4)', 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '3rem', fontWeight: 700, color: 'var(--color-primary-light)',
                marginBottom: '1.5rem', boxShadow: '0 0 30px rgba(45, 212, 191, 0.2)'
              }}>
                {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
              </div>
              <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem' }}>{user.fullName}</h2>
              <p style={{ color: 'var(--color-text-muted)', margin: '0 0 1rem 0' }}>{user.email}</p>
              
              <span style={{ 
                background: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6', 
                padding: '0.5rem 1rem', borderRadius: '2rem', fontSize: '0.875rem', fontWeight: 600,
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem'
              }}>
                👑 {user.plan.charAt(0).toUpperCase() + user.plan.slice(1)} Plan
              </span>
            </motion.div>

            {/* Gamification Stats */}
            <motion.div variants={itemVariants} className="glass-card" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
              <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.125rem' }}>Achievements</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>🏆 Total Points</span>
                <span style={{ fontWeight: 700, color: 'var(--color-primary-light)' }}>{user.points || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>🔥 Current Streak</span>
                <span style={{ fontWeight: 700, color: '#f59e0b' }}>{user.currentStreak || 0} Days</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>⚡ Longest Streak</span>
                <span style={{ fontWeight: 700, color: '#f59e0b' }}>{user.longestStreak || 0} Days</span>
              </div>
            </motion.div>
          </div>

          {/* Right Column - Professional Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <motion.div variants={itemVariants} className="glass-card" style={{ padding: '2rem', borderRadius: '1rem' }}>
              <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1rem' }}>Professional Info</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>Experience Level</div>
                  <div style={{ fontSize: '1.125rem', fontWeight: 500 }}>{user.level ? user.level.charAt(0).toUpperCase() + user.level.slice(1) : 'Not specified'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>College / University</div>
                  <div style={{ fontSize: '1.125rem', fontWeight: 500 }}>{user.college || 'Not specified'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>Branch / Major</div>
                  <div style={{ fontSize: '1.125rem', fontWeight: 500 }}>{user.branch || 'Not specified'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>Graduation Year</div>
                  <div style={{ fontSize: '1.125rem', fontWeight: 500 }}>{user.graduationYear || 'Not specified'}</div>
                </div>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="glass-card" style={{ padding: '2rem', borderRadius: '1rem' }}>
              <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1rem' }}>Target Roles & Skills</h3>
              
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>Target Roles</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {user.targetRoles?.length > 0 ? user.targetRoles.map(role => (
                    <span key={role} style={{ padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '0.5rem', fontSize: '0.875rem' }}>{role}</span>
                  )) : <span style={{ color: 'var(--color-text-faint)' }}>No roles specified</span>}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>Top Skills</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {user.skills?.length > 0 ? user.skills.map(skill => (
                    <span key={skill} style={{ padding: '0.5rem 1rem', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-primary-light)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '0.5rem', fontSize: '0.875rem' }}>{skill}</span>
                  )) : <span style={{ color: 'var(--color-text-faint)' }}>No skills specified</span>}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
