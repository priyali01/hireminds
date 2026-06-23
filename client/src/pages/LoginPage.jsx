import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { useForm } from 'react-hook-form'
import { useLoginMutation } from '../store/api'
import { setCredentials } from '../store/authSlice'
import '../styles/auth.css'

export default function LoginPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [login, { isLoading }] = useLoginMutation()
  const [serverError, setServerError] = useState(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm()

  const onSubmit = async (data) => {
    setServerError(null)
    try {
      const result = await login(data).unwrap()
      dispatch(setCredentials({ user: result.user, accessToken: result.accessToken }))
      navigate(result.user.onboardingComplete ? '/dashboard' : '/onboarding', { replace: true })
    } catch (err) {
      setServerError(err.data?.message || 'Login failed. Please try again.')
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card glass-card" style={{ borderRadius: '1.5rem', margin: 'auto' }}>
        <div className="auth-brand">
          <img src="/logo.png" alt="HireMinds Logo" className="auth-logo-img" />
          <p className="brand-tagline">Your AI career companion</p>
        </div>

        <h2 className="auth-title">Welcome <span className="gradient-text">back</span>✨</h2>
        <p className="auth-subtitle">Sign in to your account</p>

        <form onSubmit={handleSubmit(onSubmit)} className="auth-form" noValidate>
          <div className="form-group">
            <label htmlFor="email" className="form-label">Email</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              className={`form-input ${errors.email ? 'input-error' : ''}`}
              {...register('email', {
                required: 'Email is required',
                pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' },
              })}
            />
            {errors.email && <p className="field-error">{errors.email.message}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">Password</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              className={`form-input ${errors.password ? 'input-error' : ''}`}
              {...register('password', { required: 'Password is required' })}
            />
            {errors.password && <p className="field-error">{errors.password.message}</p>}
          </div>

          {serverError && (
            <div className="server-error" role="alert">
              {serverError}
            </div>
          )}

          <button
            id="login-submit"
            type="submit"
            disabled={isLoading}
            className="btn btn-primary btn-full"
          >
            {isLoading ? (
              <span className="btn-loading">
                <span className="spinner" />
                Signing in...
              </span>
            ) : 'Sign in'}
          </button>
        </form>

        <p className="auth-link">
          Don't have an account?{' '}
          <Link to="/register">Create one free</Link>
        </p>
      </div>

      <div className="auth-visual">
        <div className="visual-card">
          <div className="score-display">
            <span className="score-number">84</span>
            <span className="score-label">/100 ATS Score</span>
          </div>
          <p className="visual-caption">Level-aware scoring — finally fair for freshers</p>
        </div>
      </div>
    </div>
  )
}
