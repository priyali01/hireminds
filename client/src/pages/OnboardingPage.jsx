import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { useCompleteOnboardingMutation } from '../store/api'
import { updateUser } from '../store/authSlice'
import '../styles/onboarding.css'

const STEPS = ['Level', 'Goals', 'Skills', 'College', 'Review']

const TARGET_ROLES = [
  'Software Engineer', 'Frontend Developer', 'Backend Developer',
  'Full Stack Developer', 'Data Analyst', 'Data Scientist',
  'DevOps Engineer', 'Mobile Developer', 'UI/UX Designer', 'Product Manager',
]

const POPULAR_SKILLS = [
  'C++', 'Java', 'Python', 'JavaScript', 'TypeScript', 'React',
  'Node.js', 'SQL', 'MongoDB', 'Git', 'Docker', 'Linux',
  'Machine Learning', 'Data Structures', 'REST APIs', 'AWS',
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
    skills: [],
    customSkill: '',
    college: '',
    branch: '',
    graduationYear: new Date().getFullYear() + 1,
  })

  const toggleRole = (role) => {
    setForm((f) => ({
      ...f,
      targetRoles: f.targetRoles.includes(role)
        ? f.targetRoles.filter((r) => r !== role)
        : f.targetRoles.length < 5
        ? [...f.targetRoles, role]
        : f.targetRoles,
    }))
  }

  const toggleSkill = (skill) => {
    setForm((f) => ({
      ...f,
      skills: f.skills.includes(skill)
        ? f.skills.filter((s) => s !== skill)
        : f.skills.length < 20
        ? [...f.skills, skill]
        : f.skills,
    }))
  }

  const addCustomSkill = () => {
    const skill = form.customSkill.trim()
    if (skill && !form.skills.includes(skill) && form.skills.length < 20) {
      setForm((f) => ({ ...f, skills: [...f.skills, skill], customSkill: '' }))
    }
  }

  const canNext = () => {
    if (step === 0) return !!form.level
    if (step === 1) return form.targetRoles.length > 0
    if (step === 2) return form.skills.length > 0
    if (step === 3) return form.college.trim().length > 0 && form.branch.trim().length > 0
    return true
  }

  const handleFinish = async () => {
    setError(null)
    try {
      const result = await completeOnboarding({
        level: form.level,
        targetRoles: form.targetRoles,
        skills: form.skills,
        college: form.college,
        branch: form.branch,
        graduationYear: Number(form.graduationYear),
      }).unwrap()
      dispatch(updateUser(result.user))
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.data?.message || 'Something went wrong. Please try again.')
    }
  }

  return (
    <div className="onboarding-page">
      <div className="onboarding-card glass-card">
        {/* Step indicator */}
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
          {/* Step 0: Level */}
          {step === 0 && (
            <div className="step-panel">
              <h2>What's your career stage?</h2>
              <p>This shapes how we score your resume — freshers are not compared to senior engineers.</p>
              <div className="level-grid">
                {[
                  { value: 'fresher', label: 'Fresher', desc: '0–1 year, student or recent grad', emoji: '🌱' },
                  { value: 'intermediate', label: 'Intermediate', desc: '1–3 years experience', emoji: '📈' },
                  { value: 'experienced', label: 'Experienced', desc: '3+ years in the industry', emoji: '🚀' },
                ].map((l) => (
                  <button
                    key={l.value}
                    id={`level-${l.value}`}
                    onClick={() => setForm((f) => ({ ...f, level: l.value }))}
                    className={`level-card ${form.level === l.value ? 'selected' : ''}`}
                  >
                    <span className="level-emoji">{l.emoji}</span>
                    <span className="level-name">{l.label}</span>
                    <span className="level-desc">{l.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 1: Target roles */}
          {step === 1 && (
            <div className="step-panel">
              <h2>What roles are you targeting?</h2>
              <p>Select up to 5. We'll personalise your job matches and resume analysis.</p>
              <div className="chip-grid">
                {TARGET_ROLES.map((role) => (
                  <button
                    key={role}
                    onClick={() => toggleRole(role)}
                    className={`chip ${form.targetRoles.includes(role) ? 'chip-active' : ''}`}
                  >
                    {role}
                  </button>
                ))}
              </div>
              {form.targetRoles.length > 0 && (
                <p className="selection-count">{form.targetRoles.length}/5 selected</p>
              )}
            </div>
          )}

          {/* Step 2: Skills */}
          {step === 2 && (
            <div className="step-panel">
              <h2>What are your top skills?</h2>
              <p>Select from common ones or add your own. Up to 20 skills.</p>
              <div className="chip-grid">
                {POPULAR_SKILLS.map((skill) => (
                  <button
                    key={skill}
                    onClick={() => toggleSkill(skill)}
                    className={`chip ${form.skills.includes(skill) ? 'chip-active' : ''}`}
                  >
                    {skill}
                  </button>
                ))}
              </div>
              <div className="custom-skill-row">
                <input
                  type="text"
                  placeholder="Add custom skill..."
                  className="form-input"
                  value={form.customSkill}
                  onChange={(e) => setForm((f) => ({ ...f, customSkill: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomSkill())}
                />
                <button onClick={addCustomSkill} className="btn btn-secondary">Add</button>
              </div>
              {form.skills.length > 0 && (
                <p className="selection-count">{form.skills.length} skills added</p>
              )}
            </div>
          )}

          {/* Step 3: College */}
          {step === 3 && (
            <div className="step-panel">
              <h2>Your education</h2>
              <p>Helps us understand your academic background and tailor recommendations.</p>
              <div className="form-group">
                <label className="form-label">College / University</label>
                <input
                  type="text"
                  placeholder="e.g. IIT Bombay, VIT Vellore"
                  className="form-input"
                  value={form.college}
                  onChange={(e) => setForm((f) => ({ ...f, college: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Branch / Stream</label>
                <input
                  type="text"
                  placeholder="e.g. Computer Science and Engineering"
                  className="form-input"
                  value={form.branch}
                  onChange={(e) => setForm((f) => ({ ...f, branch: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Graduation Year</label>
                <select
                  className="form-input"
                  value={form.graduationYear}
                  onChange={(e) => setForm((f) => ({ ...f, graduationYear: Number(e.target.value) }))}
                >
                  {Array.from({ length: 12 }, (_, i) => 2020 + i).map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <div className="step-panel">
              <h2 className="gradient-text">Looks good! 🎉</h2>
              <p>Here's what we know about you. You can update this anytime in your profile.</p>
              <div className="review-card">
                <div className="review-row">
                  <span className="review-key">Career stage</span>
                  <span className="review-val capitalize">{form.level}</span>
                </div>
                <div className="review-row">
                  <span className="review-key">Target roles</span>
                  <span className="review-val">{form.targetRoles.join(', ')}</span>
                </div>
                <div className="review-row">
                  <span className="review-key">Skills</span>
                  <span className="review-val">{form.skills.slice(0, 5).join(', ')}{form.skills.length > 5 ? ` +${form.skills.length - 5} more` : ''}</span>
                </div>
                <div className="review-row">
                  <span className="review-key">College</span>
                  <span className="review-val">{form.college}</span>
                </div>
                <div className="review-row">
                  <span className="review-key">Branch</span>
                  <span className="review-val">{form.branch}</span>
                </div>
                <div className="review-row">
                  <span className="review-key">Graduation</span>
                  <span className="review-val">{form.graduationYear}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {error && <div className="server-error">{error}</div>}

        {/* Navigation */}
        <div className="step-nav">
          {step > 0 && (
            <button onClick={() => setStep((s) => s - 1)} className="btn btn-ghost">
              ← Back
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canNext()}
              className="btn btn-primary"
            >
              Continue →
            </button>
          ) : (
            <button
              id="finish-onboarding"
              onClick={handleFinish}
              disabled={isLoading}
              className="btn btn-primary"
            >
              {isLoading ? 'Setting up your account...' : 'Let\'s go 🚀'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
