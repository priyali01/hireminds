import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { useForm } from 'react-hook-form'
import { useRegisterMutation } from '../store/api'
import { setCredentials } from '../store/authSlice'
import '../styles/auth.css'

export default function RegisterPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [register, { isLoading }] = useRegisterMutation()
  const [serverError, setServerError] = useState(null)

  const {
    register: registerField,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({ defaultValues: { consentGiven: false } })

  const consentChecked = watch('consentGiven')

  const onSubmit = async (data) => {
    setServerError(null)
    if (!data.consentGiven) {
      setServerError('You must accept the privacy policy to create an account.')
      return
    }
    try {
      const result = await register({
        fullName: data.fullName,
        email: data.email,
        password: data.password,
        consentGiven: true,
      }).unwrap()
      dispatch(setCredentials({ user: result.user, accessToken: result.accessToken }))
      navigate('/onboarding', { replace: true })
    } catch (err) {
      const detail = err.data?.details?.[0]?.message
      setServerError(detail || err.data?.message || 'Registration failed. Please try again.')
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card glass-card" style={{ borderRadius: '1.5rem', margin: 'auto' }}>
        <div className="auth-brand">
          <img src="/logo.png" alt="HireMinds Logo" className="auth-logo-img" />
          <p className="brand-tagline">Your AI career companion</p>
        </div>

        <h2 className="auth-title">Create your <span className="gradient-text">account</span>✨</h2>
        <p className="auth-subtitle">Free forever. No credit card needed.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="auth-form" noValidate>
          <div className="form-group">
            <label htmlFor="fullName" className="form-label">Full name</label>
            <input
              id="fullName"
              type="text"
              placeholder="Priya Sharma"
              autoComplete="name"
              className={`form-input ${errors.fullName ? 'input-error' : ''}`}
              {...registerField('fullName', {
                required: 'Full name is required',
                minLength: { value: 2, message: 'Name must be at least 2 characters' },
              })}
            />
            {errors.fullName && <p className="field-error">{errors.fullName.message}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="reg-email" className="form-label">Email</label>
            <input
              id="reg-email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              className={`form-input ${errors.email ? 'input-error' : ''}`}
              {...registerField('email', {
                required: 'Email is required',
                pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' },
              })}
            />
            {errors.email && <p className="field-error">{errors.email.message}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="reg-password" className="form-label">Password</label>
            <input
              id="reg-password"
              type="password"
              placeholder="Min. 8 chars, one uppercase, one number"
              autoComplete="new-password"
              className={`form-input ${errors.password ? 'input-error' : ''}`}
              {...registerField('password', {
                required: 'Password is required',
                minLength: { value: 8, message: 'Must be at least 8 characters' },
                pattern: {
                  value: /^(?=.*[A-Z])(?=.*[0-9])/,
                  message: 'Must contain at least one uppercase letter and one number',
                },
              })}
            />
            {errors.password && <p className="field-error">{errors.password.message}</p>}
          </div>

          {/* DPDP Act 2023 consent — non-negotiable, shown prominently */}
          <div className="consent-box">
            <label className="consent-label">
              <input
                id="consentGiven"
                type="checkbox"
                className="consent-checkbox"
                {...registerField('consentGiven')}
              />
              <span className="consent-text">
                I agree to HireMinds'{' '}
                <a href="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
                {' '}and consent to my data being processed for resume analysis and career
                recommendations per the{' '}
                <strong>DPDP Act 2023</strong>.
              </span>
            </label>
          </div>

          {serverError && (
            <div className="server-error" role="alert">
              {serverError}
            </div>
          )}

          <button
            id="register-submit"
            type="submit"
            disabled={isLoading || !consentChecked}
            className="btn btn-primary btn-full"
          >
            {isLoading ? (
              <span className="btn-loading">
                <span className="spinner" />
                Creating account...
              </span>
            ) : 'Create free account'}
          </button>
        </form>

        <p className="auth-link">
          Already have an account?{' '}
          <Link to="/login">Sign in</Link>
        </p>
      </div>

      <div className="auth-visual">
        <div className="visual-stats">
          <div className="stat-item">
            <span className="stat-number">10K+</span>
            <span className="stat-label">Students helped</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">3x</span>
            <span className="stat-label">Higher callback rate</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">Free</span>
            <span className="stat-label">To get started</span>
          </div>
        </div>
      </div>
    </div>
  )
}
