import { useSelector, useDispatch } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { selectCurrentUser } from '../store/authSlice'
import { clearCredentials } from '../store/authSlice'
import { useLogoutMutation, useGetResumeHistoryQuery } from '../store/api'
import '../styles/dashboard.css'

function StatCard({ label, value, icon, color }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ color }}>{icon}</div>
      <div className="stat-info">
        <p className="stat-value">{value ?? '—'}</p>
        <p className="stat-label">{label}</p>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const user = useSelector(selectCurrentUser)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [logout] = useLogoutMutation()
  const { data: historyData } = useGetResumeHistoryQuery()

  const latestResume = historyData?.resumes?.[0]
  const latestScore = latestResume?.atsScore?.overall

  const handleLogout = async () => {
    try {
      await logout().unwrap()
    } catch {
      // Even if server logout fails, clear client state
    }
    dispatch(clearCredentials())
    navigate('/login', { replace: true })
  }

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="dashboard-page">
      <nav className="nav">
        <div className="nav-brand">🧠 HireMinds</div>
        <div className="nav-links">
          <Link to="/dashboard" className="nav-link active">Dashboard</Link>
          <Link to="/resume" className="nav-link">Resume</Link>
        </div>
        <button onClick={handleLogout} className="btn btn-ghost btn-sm" id="logout-btn">
          Sign out
        </button>
      </nav>

      <div className="dashboard-layout">
        {/* Welcome */}
        <div className="welcome-section">
          <h1 className="welcome-title">
            {greeting()}, {user?.fullName?.split(' ')[0]} 👋
          </h1>
          <p className="welcome-subtitle">
            {user?.onboardingComplete
              ? `Targeting ${user.targetRoles?.[0] || 'your dream role'} · ${user.level || 'fresher'}`
              : 'Complete your profile to get personalised recommendations.'}
          </p>
        </div>

        {/* Quick stats */}
        <div className="stats-grid">
          <StatCard
            label="ATS Score"
            value={latestScore ? `${latestScore}/100` : null}
            icon="🎯"
            color="var(--color-primary-light)"
          />
          <StatCard
            label="Career level"
            value={user?.level ? user.level.charAt(0).toUpperCase() + user.level.slice(1) : null}
            icon="📈"
            color="var(--color-score-mid)"
          />
          <StatCard
            label="Skills added"
            value={user?.skills?.length || 0}
            icon="💡"
            color="var(--color-info)"
          />
          <StatCard
            label="Analyses done"
            value={historyData?.count || 0}
            icon="📄"
            color="var(--color-score-high)"
          />
        </div>

        {/* Main action cards */}
        <div className="action-grid">
          <Link to="/resume" className="action-card" id="action-resume">
            <div className="action-icon">📄</div>
            <h3 className="action-title">Analyse your resume</h3>
            <p className="action-desc">
              Get a level-aware ATS score, see missing keywords, and get a one-week fix plan.
            </p>
            <span className="action-cta">Get started →</span>
          </Link>

          <div className="action-card action-coming-soon" id="action-interview">
            <div className="action-icon">🎤</div>
            <h3 className="action-title">Mock Interview</h3>
            <p className="action-desc">
              Practice with AI-generated questions based on your resume. Coming in Phase 2.
            </p>
            <span className="badge badge-blue">Coming soon</span>
          </div>

          <div className="action-card action-coming-soon" id="action-trainer">
            <div className="action-icon">🏋️</div>
            <h3 className="action-title">Personal Trainer</h3>
            <p className="action-desc">
              Weekly AI-generated learning goals based on your readiness score.
            </p>
            <span className="badge badge-blue">Coming soon</span>
          </div>

          <div className="action-card action-coming-soon" id="action-jobs">
            <div className="action-icon">💼</div>
            <h3 className="action-title">Job Matcher</h3>
            <p className="action-desc">
              Paste any job description and see how well your resume matches.
            </p>
            <span className="badge badge-blue">Coming soon</span>
          </div>
        </div>

        {/* Recent analyses */}
        {historyData?.resumes?.length > 0 && (
          <div className="recent-section">
            <div className="section-header">
              <h2 className="section-title">Recent analyses</h2>
              <Link to="/resume" className="section-link">View all →</Link>
            </div>
            <div className="recent-list">
              {historyData.resumes.slice(0, 3).map((r) => {
                const score = r.atsScore?.overall
                const scoreColor = score >= 80 ? 'score-high' : score >= 50 ? 'score-mid' : 'score-low'
                return (
                  <div key={r._id} className="recent-item">
                    <div className="recent-meta">
                      <p className="recent-name">{r.pdfMeta?.originalFilename || 'Manual entry'}</p>
                      <p className="recent-date">{new Date(r.createdAt).toLocaleDateString('en-IN')}</p>
                    </div>
                    <div className="recent-score">
                      <span className={`score-big-sm ${scoreColor}`}>{score}</span>
                      <span className="score-denom-sm">/100</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Empty state if no analyses */}
        {!historyData?.resumes?.length && (
          <div className="dashboard-empty">
            <p className="empty-text">No resume analyses yet.</p>
            <Link to="/resume" className="btn btn-primary">
              Analyse your first resume →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
