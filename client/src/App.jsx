import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { selectIsAuthenticated, selectCurrentUser } from './store/authSlice'
import { lazy, Suspense } from 'react'

// Lazy-loaded pages for code splitting
const LoginPage = lazy(() => import('./pages/LoginPage'))
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

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/resume"
            element={
              <ProtectedRoute>
                <ResumePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/interview"
            element={
              <ProtectedRoute>
                <InterviewPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/interview/setup"
            element={
              <ProtectedRoute>
                <InterviewSetupPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/interview/session/:id"
            element={
              <ProtectedRoute>
                <InterviewSessionPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/interview/results/:id"
            element={
              <ProtectedRoute>
                <InterviewResultsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/interview/drive/setup"
            element={
              <ProtectedRoute>
                <DriveSetupPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/interview/drive/:id"
            element={
              <ProtectedRoute>
                {/* Reusing InterviewSessionPage since it scales to handle sections */}
                <InterviewSessionPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/interview/drive/:id/results"
            element={
              <ProtectedRoute>
                <DriveResultsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/jobs"
            element={
              <ProtectedRoute>
                <JobsPage />
              </ProtectedRoute>
            }
          />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}