import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCreateInterviewSessionMutation, useGetResumeHistoryQuery } from '../store/api'

export default function InterviewSetupPage() {
  const navigate = useNavigate()
  const { data: resumeData } = useGetResumeHistoryQuery()
  const [createSession, { isLoading }] = useCreateInterviewSessionMutation()
  
  const [type, setType] = useState('technical')
  const [role, setRole] = useState('')
  const [resumeId, setResumeId] = useState('')
  const [error, setError] = useState(null)

  const handleStart = async (e) => {
    e.preventDefault()
    setError(null)
    
    try {
      const result = await createSession({
        type,
        role,
        resumeId: resumeId || undefined
      }).unwrap()
      
      navigate(`/interview/session/${result.session._id}`)
    } catch (err) {
      setError(err.data?.message || 'Failed to start interview session.')
    }
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <button className="btn btn-ghost" onClick={() => navigate('/interview')} style={{ marginBottom: '2rem' }}>
        ← Back to Interviews
      </button>

      <div className="card glass-card">
        <h1 className="gradient-text" style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Setup Interview Session</h1>
        
        {error && <div className="server-error" style={{ marginBottom: '1rem' }}>{error}</div>}

        <form onSubmit={handleStart} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="form-group">
            <label className="form-label">Interview Type</label>
            <div style={{ display: 'flex', gap: '1rem' }}>
              {['technical', 'hr', 'behavioral'].map(t => (
                <div 
                  key={t}
                  className={`chip ${type === t ? 'chip-active' : ''}`}
                  onClick={() => setType(t)}
                  style={{ textTransform: 'capitalize', flex: 1, textAlign: 'center' }}
                >
                  {t}
                </div>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="role">Target Role</label>
            <input
              id="role"
              className="form-input"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Frontend Developer, Data Scientist"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="resume">Resume Context (Optional)</label>
            <select
              id="resume"
              className="form-input"
              value={resumeId}
              onChange={(e) => setResumeId(e.target.value)}
            >
              <option value="">Do not use resume</option>
              {resumeData?.resumes?.map(r => (
                <option key={r._id} value={r._id}>
                  {r.title || 'Resume'} ({new Date(r.createdAt).toLocaleDateString()})
                </option>
              ))}
            </select>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
              If selected, questions will be tailored to your specific projects and skills.
            </p>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={isLoading || !role}
            style={{ marginTop: '1rem' }}
          >
            {isLoading ? <div className="spinner" /> : 'Start Interview'}
          </button>
        </form>
      </div>
    </div>
  )
}
