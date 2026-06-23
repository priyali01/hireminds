import { Link, useNavigate, Outlet } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { clearCredentials } from '../store/authSlice'
import { useLogoutMutation } from '../store/api'

export default function MainLayout() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [logout] = useLogoutMutation()

  const handleLogout = async () => {
    try {
      await logout().unwrap()
    } catch {
      // Even if server logout fails, clear client state
    }
    dispatch(clearCredentials())
    navigate('/login', { replace: true })
  }

  return (
    <div className="main-layout">
      <nav className="nav glass-nav">
        <div className="nav-brand">
          <img src="/logo.png" alt="HireMinds" className="nav-logo-img" />
        </div>
        <div className="nav-links">
          <Link to="/dashboard" className="nav-link">Dashboard</Link>
          <Link to="/resume" className="nav-link">Resume</Link>
          <Link to="/jobs" className="nav-link">Jobs</Link>
          <Link to="/interview" className="nav-link">Interviews</Link>
          <Link to="/leaderboard" className="nav-link">Leaderboard</Link>
          <Link to="/community" className="nav-link">Community</Link>
          <Link to="/chat" className="nav-link" style={{ color: '#8b5cf6', fontWeight: 'bold' }}>🤖 AI Coach</Link>
          <Link to="/pricing" className="nav-link" style={{ color: '#f59e0b', fontWeight: 'bold' }}>⭐ Upgrade</Link>
        </div>
        <button onClick={handleLogout} className="btn btn-ghost btn-sm" id="logout-btn">
          Sign out
        </button>
      </nav>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
