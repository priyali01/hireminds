import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import KanbanBoard from '../components/KanbanBoard'
import { useCreateJobMutation, useMatchJDMutation } from '../store/api'
import '../styles/dashboard.css' // Reuse some layout styles

export default function JobsPage() {
  const [showAddForm, setShowAddForm] = useState(false)
  const [company, setCompany] = useState('')
  const [role, setRole] = useState('')
  const [url, setUrl] = useState('')
  const [createJob] = useCreateJobMutation()

  const [showMatchForm, setShowMatchForm] = useState(false)
  const [jd, setJd] = useState('')
  const [matchResult, setMatchResult] = useState(null)
  const [matchJD, { isLoading: isMatching }] = useMatchJDMutation()

  const handleAddJob = async (e) => {
    e.preventDefault()
    if (!company || !role) return
    try {
      await createJob({ company, role, url }).unwrap()
      setShowAddForm(false)
      setCompany('')
      setRole('')
      setUrl('')
    } catch (err) {
      console.error(err)
    }
  }

  const handleMatchJD = async (e) => {
    e.preventDefault()
    if (!jd) return
    try {
      const res = await matchJD({ jobDescription: jd }).unwrap()
      setMatchResult(res.match)
    } catch (err) {
      console.error(err)
      alert(err.data?.error || 'Failed to match JD')
    }
  }

  return (
    <div className="dashboard-page">
      <nav className="nav">
        <div className="nav-brand">🧠 HireMinds</div>
        <div className="nav-links">
          <Link to="/dashboard" className="nav-link">Dashboard</Link>
          <Link to="/jobs" className="nav-link active">Jobs</Link>
          <Link to="/interview" className="nav-link">Interviews</Link>
        </div>
      </nav>

      <div className="dashboard-layout" style={{ maxWidth: '1200px' }}>
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="welcome-title">Application Tracker</h1>
            <p className="welcome-subtitle">Manage your job hunt and analyze JDs</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn btn-secondary" onClick={() => setShowMatchForm(!showMatchForm)}>
              🔍 Match JD
            </button>
            <button className="btn btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
              + Add Job
            </button>
          </div>
        </div>

        {/* Add Job Form Overlay */}
        {showAddForm && (
          <motion.div 
            className="form-card" 
            style={{ marginBottom: '2rem', padding: '1.5rem', background: 'var(--color-surface-2)', borderRadius: '1rem' }}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
          >
            <h3>Add New Application</h3>
            <form onSubmit={handleAddJob} style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <input type="text" placeholder="Company" value={company} onChange={e => setCompany(e.target.value)} required className="form-input" />
              <input type="text" placeholder="Role" value={role} onChange={e => setRole(e.target.value)} required className="form-input" />
              <input type="url" placeholder="Job URL (optional)" value={url} onChange={e => setUrl(e.target.value)} className="form-input" />
              <button type="submit" className="btn btn-primary">Save</button>
            </form>
          </motion.div>
        )}

        {/* JD Matcher UI */}
        {showMatchForm && (
          <motion.div 
            className="form-card" 
            style={{ marginBottom: '2rem', padding: '1.5rem', background: 'var(--color-surface-2)', borderRadius: '1rem' }}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
          >
            <h3>Job Description Matcher</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Paste a JD to compare against your latest resume using AI.</p>
            <form onSubmit={handleMatchJD} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              <textarea 
                placeholder="Paste Job Description here..." 
                value={jd} 
                onChange={e => setJd(e.target.value)} 
                required 
                className="form-textarea" 
                rows="5"
              />
              <button type="submit" className="btn btn-primary" disabled={isMatching}>
                {isMatching ? 'Analyzing...' : 'Analyze JD'}
              </button>
            </form>

            {matchResult && (
              <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--color-surface)', borderRadius: '0.5rem' }}>
                <h4>Match Score: <span style={{ color: matchResult.score > 70 ? 'var(--color-success)' : 'var(--color-error)' }}>{matchResult.score}%</span></h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                  <div>
                    <h5>Matched Keywords</h5>
                    <ul style={{ paddingLeft: '1.5rem', fontSize: '0.875rem', color: 'var(--color-success)' }}>
                      {matchResult.matchedKeywords.map(k => <li key={k}>{k}</li>)}
                    </ul>
                  </div>
                  <div>
                    <h5>Missing Keywords</h5>
                    <ul style={{ paddingLeft: '1.5rem', fontSize: '0.875rem', color: 'var(--color-error)' }}>
                      {matchResult.missingKeywords.map(k => <li key={k}>{k}</li>)}
                    </ul>
                  </div>
                </div>
                <div style={{ marginTop: '1rem' }}>
                  <h5>Suggestions</h5>
                  <ul style={{ paddingLeft: '1.5rem', fontSize: '0.875rem' }}>
                    {matchResult.suggestions.map(s => <li key={s}>{s}</li>)}
                  </ul>
                </div>
              </div>
            )}
          </motion.div>
        )}

        <KanbanBoard />
      </div>
    </div>
  )
}
