import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { selectIsAuthenticated, selectCurrentUser } from './store/authSlice'
import { lazy, Suspense } from 'react'

// Lazy-loaded pages for code splitting
const LoginPage = lazy(() => import('./pages/Auth/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const OnboardingPage = lazy(() => import('./pages/OnboardingPage'))
const ResumePage = lazy(() => import('./pages/ResumePage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const InterviewPage = lazy(() => import('./pages/InterviewPage'))
const InterviewSetupPage = lazy(() => import('./pages/InterviewSetupPage'))
const InterviewSessionPage = lazy(() => import('./pages/InterviewSessionPage'))
const InterviewResultsPage = lazy(() => import('./pages/InterviewResultsPage'))
const DriveSetupPage = lazy(() => import('./pages/DriveSetupPage'))
const DriveResultsPage = lazy(() => import('./pages/DriveResultsPage'))
const JobsPage = lazy(() => import('./pages/JobsPage'))
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage'))
const CommunityFeedPage = lazy(() => import('./pages/CommunityFeedPage'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const TPODashboard = lazy(() => import('./pages/TPODashboard'))
const PricingPage = lazy(() => import('./pages/PricingPage'))
const CareerAgentPage = lazy(() => import('./pages/CareerAgentPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
import MainLayout from './components/MainLayout'

// Loading fallback
function PageLoader() {
  return (
    <div className="page-loader">
      <div className="loader-ring" />
    </div>
  )
}

// Protected route — redirects to login if not authenticated
function ProtectedRoute({ children }) {
  const isAuthenticated = useSelector(selectIsAuthenticated)
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  return children
}

// Onboarding route — redirects away if onboarding already done
function OnboardingRoute({ children }) {
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const user = useSelector(selectCurrentUser)

  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user?.onboardingComplete) return <Navigate to="/dashboard" replace />
  return children
}

// Public route — redirects authenticated users away from login/register
function PublicRoute({ children }) {
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const user = useSelector(selectCurrentUser)

  if (isAuthenticated) {
    return <Navigate to={user?.onboardingComplete ? '/dashboard' : '/onboarding'} replace />
  }
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <RegisterPage />
              </PublicRoute>
            }
          />

          {/* Onboarding (authenticated but not onboarded) */}
          <Route
            path="/onboarding"
            element={
              <OnboardingRoute>
                <OnboardingPage />
              </OnboardingRoute>
            }
          />

          {/* Protected routes wrapped in MainLayout */}
          <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/resume" element={<ResumePage />} />
            <Route path="/interview" element={<InterviewPage />} />
            <Route path="/interview/setup" element={<InterviewSetupPage />} />
            <Route path="/interview/session/:id" element={<InterviewSessionPage />} />
            <Route path="/interview/results/:id" element={<InterviewResultsPage />} />
            <Route path="/interview/drive/setup" element={<DriveSetupPage />} />
            <Route path="/interview/drive/:id" element={<InterviewSessionPage />} />
            <Route path="/interview/drive/:id/results" element={<DriveResultsPage />} />
            <Route path="/jobs" element={<JobsPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/community" element={<CommunityFeedPage />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/tpo/dashboard" element={<TPODashboard />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/chat" element={<CareerAgentPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}