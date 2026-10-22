import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { useCompleteOnboardingMutation } from '../store/api'
import { updateUser } from '../store/authSlice'
import '../styles/onboarding.css'

const STEPS = ['Stage', 'Role']

const TARGET_ROLES = [
  'Software Engineer', 'Frontend Developer', 'Backend Developer',
  'Full Stack Developer', 'Data Analyst', 'Data Scientist',
  'DevOps Engineer', 'Mobile Developer', 'UI/UX Designer', 'Product Manager',
]

export default function OnboardingPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [completeOnboarding, { isLoading }] = useCompleteOnboardingMutation()

  const [step, setStep] = useState(0)
  const [error, setError] = useState(null)
  const [form, setForm] = useState({
    level: '',
    targetRoles: [],
    customRole: '',
  })

  const chosenRoles = () => {
    const extra = form.customRole.trim()
    const roles = [...form.targetRoles]
    if (extra && !roles.includes(extra) && roles.length < 5) roles.push(extra)
    return roles
  }

  const toggleRole = (role) => {
    setForm((current) => ({
      ...current,
      targetRoles: current.targetRoles.includes(role)
        ? current.targetRoles.filter((item) => item !== role)
        : current.targetRoles.length < 5
          ? [...current.targetRoles, role]
          : current.targetRoles,
    }))
  }

  const canNext = () => {
    if (step === 0) return !!form.level
    return chosenRoles().length > 0
  }

  const handleFinish = async () => {
    setError(null)
    try {
      const result = await completeOnboarding({
        level: form.level,
        targetRoles: chosenRoles(),
      }).unwrap()
      dispatch(updateUser(result.user))
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.data?.details?.[0]?.message || err.data?.message || 'Something went wrong. Please try again.')
    }
  }

  return (
    <div className="onboarding-page">
      <div className="onboarding-card glass-card">
        <div className="step-bar">
          {STEPS.map((label, i) => (
            <div key={label} className={`step-item ${i <= step ? 'active' : ''} ${i < step ? 'done' : ''}`}>
              <div className="step-dot">{i < step ? '✓' : i + 1}</div>
              <span className="step-label">{label}</span>
              {i < STEPS.length - 1 && <div className="step-line" />}
            </div>
          ))}
        </div>

        <div className="onboarding-content">
          {step === 0 && (
            <div className="step-panel">
              <h2>Where are you in your career?</h2>
              <p>This is the only background the first resume score needs. Freshers are not compared with senior engineers.</p>
              <div className="level-grid">
                {[
                  { value: 'fresher', label: 'Fresher', desc: 'Student or under a year of work', emoji: '🌱' },
                  { value: 'intermediate', label: 'Intermediate', desc: 'About 1–3 years', emoji: '📈' },
                  { value: 'experienced', label: 'Experienced', desc: '3 or more years', emoji: '🚀' },
                ].map((level) => (
                  <button
                    key={level.value}
                    id={`level-${level.value}`}
                    type="button"
                    onClick={() => setForm((current) => ({ ...current, level: level.value }))}
                    className={`level-card ${form.level === level.value ? 'selected' : ''}`}
                  >
                    <span className="level-emoji">{level.emoji}</span>
                    <span className="level-name">{level.label}</span>
                    <span className="level-desc">{level.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="step-panel">
              <h2>What role are you aiming for?</h2>
              <p>Pick one, or up to five. Skills, college, and graduation year can be added later on your profile when you want a closer analysis.</p>
              <div className="chip-grid">
                {TARGET_ROLES.map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => toggleRole(role)}
                    className={`chip ${form.targetRoles.includes(role) ? 'chip-active' : ''}`}
                  >
                    {role}
                  </button>
                ))}
              </div>
              <div className="custom-skill-row">
                <input
                  type="text"
                  placeholder="A different role"
                  className="form-input"
                  value={form.customRole}
                  onChange={(e) => setForm((current) => ({ ...current, customRole: e.target.value }))}
                />
              </div>
              {chosenRoles().length > 0 && (
                <p className="selection-count">{chosenRoles().length}/5 selected</p>
              )}
            </div>
          )}
        </div>

        {error && <div className="server-error">{error}</div>}

        <div className="step-nav">
          {step > 0 && (
            <button type="button" onClick={() => setStep((current) => current - 1)} className="btn btn-ghost">
              ← Back
            </button>
          )}
          <div style={{ marginLeft: 'auto' }}>
            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={() => setStep((current) => current + 1)}
                disabled={!canNext()}
                className="btn btn-primary"
              >
                Continue →
              </button>
            ) : (
              <button
                id="finish-onboarding"
                type="button"
                onClick={handleFinish}
                disabled={isLoading || !canNext()}
                className="btn btn-primary"
              >
                {isLoading ? 'Setting up your account...' : 'Start'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
