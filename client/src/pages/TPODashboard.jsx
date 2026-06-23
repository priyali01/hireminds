import { useGetTpoDashboardQuery } from '../store/api'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import '../styles/dashboard.css'

export default function TPODashboard() {
  const { data, isLoading } = useGetTpoDashboardQuery()

  return (
    <div className="dashboard-page">


      <div className="dashboard-layout">
        {isLoading ? (
          <div>Loading campus analytics...</div>
        ) : !data?.success ? (
          <div style={{ background: '#fef2f2', color: '#991b1b', padding: '1rem', borderRadius: '0.5rem' }}>
            {data?.error || 'Failed to load TPO Data. Make sure your role is set to TPO and you have a college assigned.'}
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h1 className="welcome-title gradient-text">{data.college} Analytics</h1>
            <p className="welcome-subtitle">Monitor student engagement and interview readiness.</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
              <div className="stat-card glass-card">
                <h3>Total Students</h3>
                <div className="stat-value gradient-text">{data.metrics.totalStudents}</div>
              </div>
              <div className="stat-card glass-card">
                <h3>Mock Interviews Taken</h3>
                <div className="stat-value gradient-text">{data.metrics.totalMockInterviews}</div>
              </div>
              <div className="stat-card glass-card">
                <h3>Average Score</h3>
                <div className="stat-value gradient-text">{data.metrics.averagePoints} pts</div>
              </div>
            </div>

            <div className="glass-card" style={{ marginTop: '3rem', padding: '2rem', borderRadius: '1rem' }}>
              <h2>Top Performers</h2>
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', marginTop: '1rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <th style={{ padding: '1rem 0' }}>Student Name</th>
                    <th style={{ padding: '1rem 0' }}>Email</th>
                    <th style={{ padding: '1rem 0' }}>Streak</th>
                    <th style={{ padding: '1rem 0' }}>Points</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topPerformers.map((student, i) => (
                    <tr key={student._id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '1rem 0' }}>{student.fullName} {i === 0 && '👑'}</td>
                      <td style={{ padding: '1rem 0', color: 'var(--color-text-muted)' }}>{student.email}</td>
                      <td style={{ padding: '1rem 0' }}>🔥 {student.currentStreak}</td>
                      <td style={{ padding: '1rem 0', fontWeight: 'bold', color: 'var(--color-primary)' }}>{student.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
