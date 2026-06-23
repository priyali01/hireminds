import { Link, useNavigate, Outlet, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { clearCredentials, selectCurrentUser } from '../store/authSlice'
import { useLogoutMutation } from '../store/api'

export default function MainLayout() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const user = useSelector(selectCurrentUser)
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

  const getLinkStyle = (path, isSpecial = false, specialColor = '') => {
    const isActive = location.pathname.startsWith(path)
    if (isActive) {
      return {
        color: 'var(--color-primary-light)',
        fontWeight: 700,
        borderBottom: '2px solid var(--color-primary-light)',
        paddingBottom: '4px',
        textShadow: '0 0 15px rgba(45, 212, 191, 0.6)',
        letterSpacing: '0.5px'
      }
    }
    return isSpecial ? { color: specialColor, fontWeight: 'bold' } : {}
  }

  return (
    <div className="main-layout">
      <nav className="nav glass-nav">
        <div className="nav-brand">
          <img src="/logo.png" alt="HireMinds" className="nav-logo-img" />
        </div>
        <div className="nav-links" style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <Link to="/dashboard" className="nav-link" style={getLinkStyle('/dashboard')}>Dashboard</Link>
          <Link to="/resume" className="nav-link" style={getLinkStyle('/resume')}>Resume</Link>
          <Link to="/jobs" className="nav-link" style={getLinkStyle('/jobs')}>Jobs</Link>
          <Link to="/interview" className="nav-link" style={getLinkStyle('/interview')}>Interviews</Link>
          <Link to="/leaderboard" className="nav-link" style={getLinkStyle('/leaderboard')}>Leaderboard</Link>
          <Link to="/community" className="nav-link" style={getLinkStyle('/community')}>Community</Link>
          <Link to="/chat" className="nav-link" style={getLinkStyle('/chat', true, '#8b5cf6')}>🤖 AI Coach</Link>
          <Link to="/pricing" className="nav-link" style={getLinkStyle('/pricing', true, '#f59e0b')}>⭐ Upgrade</Link>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <button onClick={handleLogout} className="btn btn-ghost btn-sm" id="logout-btn">
            Sign out
          </button>
          <Link to="/profile" style={{ 
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            width: '40px', height: '40px', borderRadius: '50%', 
            background: 'linear-gradient(135deg, rgba(45, 212, 191, 0.1) 0%, rgba(16, 185, 129, 0.2) 100%)', 
            border: '1px solid rgba(45, 212, 191, 0.4)', 
            color: 'var(--color-primary-light)', fontWeight: 700, textDecoration: 'none',
            boxShadow: location.pathname === '/profile' ? '0 0 15px rgba(45, 212, 191, 0.5)' : 'none'
          }}>
            {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
          </Link>
        </div>
      </nav>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
