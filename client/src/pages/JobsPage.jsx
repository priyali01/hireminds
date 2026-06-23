import { useState } from 'react'
import { motion } from 'framer-motion'
import { useCreateJobMutation, useMatchJDMutation, useGetJobsQuery } from '../store/api'
import '../styles/dashboard.css'

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 15 } }
}

function StatCard({ icon, title, count, color, accentColor }) {
  return (
    <motion.div variants={itemVariants} whileHover={{ y: -5 }} className="glass-card" style={{ 
      padding: '1.5rem', 
      borderRadius: '1rem', 
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      borderBottom: `2px solid ${accentColor}`
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <div style={{ 
          width: '36px', height: '36px', borderRadius: '8px', 
          background: `rgba(${color}, 0.1)`, 
          color: `rgb(${color})`, 
          display: 'flex', alignItems: 'center', justifyContent: 'center', 
          fontSize: '1.25rem' 
        }}>
          {icon}
        </div>
        <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text)' }}>{title}</span>
      </div>
      <div>
        <h2 style={{ fontSize: '2rem', margin: 0, fontWeight: 700 }}>{count}</h2>
      </div>
      {/* Decorative trendline mock */}
      <div style={{ position: 'absolute', bottom: '1rem', right: '1rem', width: '60px', height: '30px', opacity: 0.5 }}>
        <svg viewBox="0 0 100 40" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
          <path d="M0,40 Q10,30 20,35 T40,20 T60,25 T80,10 T100,5" fill="none" stroke={`rgb(${color})`} strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </div>
    </motion.div>
  )
}

function StatusBadge({ status }) {
  const getStyle = (s) => {
    switch(s) {
      case 'saved': return { bg: 'rgba(255,255,255,0.05)', color: 'var(--color-text-muted)', icon: '🔖', label: 'Saved' }
      case 'applied': return { bg: 'rgba(59, 130, 246, 0.15)', color: '#60A5FA', icon: '↗️', label: 'Applied' }
      case 'interview': return { bg: 'rgba(16, 185, 129, 0.15)', color: '#10B981', icon: '👥', label: 'Interviewing' }
      case 'offer': return { bg: 'rgba(234, 179, 8, 0.15)', color: '#FBBF24', icon: '🏆', label: 'Offer' }
      case 'rejected': return { bg: 'rgba(239, 68, 68, 0.15)', color: '#F87171', icon: '✕', label: 'Rejected' }
      default: return { bg: 'rgba(255,255,255,0.05)', color: 'var(--color-text)', icon: '•', label: s }
    }
  }
  const style = getStyle(status)
  return (
    <span style={{ 
      display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
      background: style.bg, color: style.color, 
      padding: '0.375rem 0.75rem', borderRadius: '2rem', 
      fontSize: '0.75rem', fontWeight: 600
    }}>
      {style.icon} {style.label}
    </span>
  )
}

export default function JobsPage() {
  const { data, isLoading } = useGetJobsQuery()
  const jobs = data?.jobs || []

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

  const savedCount = jobs.filter(j => j.status === 'saved').length
  const appliedCount = jobs.filter(j => j.status === 'applied').length
  const interviewingCount = jobs.filter(j => j.status === 'interview').length
  const offerCount = jobs.filter(j => j.status === 'offer').length

  return (
    <motion.div className="dashboard-page" style={{ padding: '2rem' }} initial="hidden" animate="show" variants={containerVariants}>
      <div className="dashboard-layout" style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', margin: '0 0 0.5rem 0', fontWeight: 700 }}>
              Application <span className="gradient-text">Tracker</span>✨
            </h1>
            <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>Manage your job hunt and analyze your journey</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn btn-ghost" onClick={() => setShowMatchForm(!showMatchForm)} style={{ border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: 'var(--color-primary-light)' }}>✨</span> Match JD
            </button>
            <button className="btn btn-primary" onClick={() => setShowAddForm(!showAddForm)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>+</span> Add Job
            </button>
          </div>
        </div>

        {/* Add Job Modal (Inline for now) */}
        {showAddForm && (
          <motion.div 
            className="glass-card" 
            style={{ marginBottom: '2rem', padding: '1.5rem', borderRadius: '1rem' }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0 }}>Add New Application</h3>
              <button onClick={() => setShowAddForm(false)} className="btn btn-ghost" style={{ padding: '0.25rem 0.5rem' }}>✕</button>
            </div>
            <form onSubmit={handleAddJob} style={{ display: 'flex', gap: '1rem' }}>
              <input type="text" placeholder="Company" value={company} onChange={e => setCompany(e.target.value)} required className="input" style={{ flex: 1 }} />
              <input type="text" placeholder="Role" value={role} onChange={e => setRole(e.target.value)} required className="input" style={{ flex: 1 }} />
              <input type="url" placeholder="Job URL (optional)" value={url} onChange={e => setUrl(e.target.value)} className="input" style={{ flex: 1 }} />
              <button type="submit" className="btn btn-primary">Save</button>
            </form>
          </motion.div>
        )}

        {/* Match JD Modal (Inline) */}
        {showMatchForm && (
          <motion.div 
            className="glass-card" 
            style={{ marginBottom: '2rem', padding: '1.5rem', borderRadius: '1rem' }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <h3 style={{ margin: 0 }}>Job Description Matcher</h3>
              <button onClick={() => setShowMatchForm(false)} className="btn btn-ghost" style={{ padding: '0.25rem 0.5rem' }}>✕</button>
            </div>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>Paste a JD to compare against your latest resume using AI.</p>
            <form onSubmit={handleMatchJD} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <textarea 
                placeholder="Paste Job Description here..." 
                value={jd} 
                onChange={e => setJd(e.target.value)} 
                required 
                className="input" 
                style={{ resize: 'vertical', minHeight: '120px' }}
              />
              <button type="submit" className="btn btn-primary" disabled={isMatching} style={{ alignSelf: 'flex-start' }}>
                {isMatching ? 'Analyzing...' : 'Analyze JD'}
              </button>
            </form>
            {matchResult && (
              <div style={{ marginTop: '1.5rem', padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                <h4 style={{ margin: '0 0 1rem 0' }}>Match Score: <span style={{ color: matchResult.score > 70 ? 'var(--color-primary-light)' : '#ef4444' }}>{matchResult.score}%</span></h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                  <div>
                    <h5 style={{ color: 'var(--color-text-muted)', margin: '0 0 0.5rem 0' }}>Matched Keywords</h5>
                    <ul style={{ paddingLeft: '1.25rem', fontSize: '0.875rem', color: 'var(--color-primary-light)', margin: 0 }}>
                      {matchResult.matchedKeywords.map(k => <li key={k}>{k}</li>)}
                    </ul>
                  </div>
                  <div>
                    <h5 style={{ color: 'var(--color-text-muted)', margin: '0 0 0.5rem 0' }}>Missing Keywords</h5>
                    <ul style={{ paddingLeft: '1.25rem', fontSize: '0.875rem', color: '#ef4444', margin: 0 }}>
                      {matchResult.missingKeywords.map(k => <li key={k}>{k}</li>)}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Stats Grid */}
        <motion.div variants={containerVariants} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
          <StatCard icon="🔖" title="Saved" count={savedCount} color="200, 200, 200" accentColor="var(--color-text-muted)" />
          <StatCard icon="↗️" title="Applied" count={appliedCount} color="96, 165, 250" accentColor="#3B82F6" />
          <StatCard icon="👥" title="Interviewing" count={interviewingCount} color="16, 185, 129" accentColor="#10B981" />
          <StatCard icon="🏆" title="Offer" count={offerCount} color="251, 191, 36" accentColor="#F59E0B" />
        </motion.div>

        {/* Filters Area */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', background: 'var(--color-surface)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '0.75rem', padding: '0.5rem 1rem', width: '350px' }}>
            <span style={{ color: 'var(--color-text-muted)', marginRight: '0.5rem' }}>🔍</span>
            <input type="text" placeholder="Search by company, role, or location..." style={{ background: 'transparent', border: 'none', color: '#fff', outline: 'none', width: '100%', fontSize: '0.875rem' }} />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <select className="input" style={{ padding: '0.5rem 2rem 0.5rem 1rem', width: 'auto', background: 'var(--color-surface)' }}>
              <option>All Status</option>
            </select>
            <select className="input" style={{ padding: '0.5rem 2rem 0.5rem 1rem', width: 'auto', background: 'var(--color-surface)' }}>
              <option>All Companies</option>
            </select>
            <select className="input" style={{ padding: '0.5rem 2rem 0.5rem 1rem', width: 'auto', background: 'var(--color-surface)' }}>
              <option>Recent First</option>
            </select>
            <button className="btn btn-ghost" style={{ padding: '0.5rem', background: 'var(--color-surface)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⎚</span>
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        {isLoading ? (
          <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="spinner" />
          </div>
        ) : jobs.length > 0 ? (
          <motion.div variants={itemVariants} className="glass-card" style={{ borderRadius: '1rem', overflow: 'hidden' }}>
            {/* Table Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr 40px', padding: '1rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <div>Job Role</div>
              <div>Company</div>
              <div>Status On</div>
              <div>Match Score</div>
              <div></div>
              <div></div>
            </div>
            
            {/* Table Rows */}
            <motion.div variants={containerVariants} initial="hidden" animate="show">
              {jobs.map(job => (
                <motion.div variants={itemVariants} key={job._id} style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr 40px', padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.02)', alignItems: 'center', transition: 'background 0.2s', cursor: 'pointer' }} className="table-row-hover">
                  
                  {/* Role + Icon */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', color: '#000', fontWeight: 'bold' }}>
                      {job.company.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9375rem', marginBottom: '0.125rem' }}>{job.role}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{job.company} • Remote</div>
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <StatusBadge status={job.status} />
                  </div>

                  {/* Date */}
                  <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                    {new Date(job.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>

                  {/* Match Score */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {job.matchScore ? (
                      <>
                        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-primary-light)' }}>{job.matchScore}%</span>
                        <div style={{ height: '4px', width: '60px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${job.matchScore}%`, background: 'var(--color-primary-light)', borderRadius: '2px' }} />
                        </div>
                      </>
                    ) : (
                      <span style={{ fontSize: '0.875rem', color: 'var(--color-text-faint)' }}>—</span>
                    )}
                  </div>

                  {/* Empty col for spacing */}
                  <div></div>

                  {/* Actions */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button className="btn btn-ghost" style={{ padding: '0.5rem', color: 'var(--color-text-muted)' }}>⋮</button>
                  </div>

                </motion.div>
              ))}
            </motion.div>
            
            <div style={{ padding: '1rem', display: 'flex', justifyContent: 'center', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <button className="btn btn-ghost" style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Load more ⌄</button>
            </div>
          </motion.div>
        ) : (
          /* Empty State */
          <div className="glass-card" style={{ padding: '6rem 2rem', borderRadius: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            <div style={{ width: '160px', height: '160px', marginBottom: '2rem', position: 'relative' }}>
              {/* Abstract Illustration */}
              <div style={{ position: 'absolute', width: '100px', height: '80px', background: 'rgba(16, 185, 129, 0.2)', borderRadius: '8px', top: '40px', left: '30px', transform: 'rotate(-10deg)', border: '1px solid rgba(16, 185, 129, 0.4)' }} />
              <div style={{ position: 'absolute', width: '110px', height: '90px', background: 'rgba(16, 185, 129, 0.3)', borderRadius: '8px', top: '35px', left: '25px', transform: 'rotate(5deg)', border: '1px solid rgba(16, 185, 129, 0.5)' }} />
              <div style={{ position: 'absolute', width: '120px', height: '100px', background: 'var(--color-primary-dark)', borderRadius: '8px', top: '30px', left: '20px', display: 'flex', flexDirection: 'column', gap: '8px', padding: '1rem', border: '1px solid var(--color-primary)' }}>
                <div style={{ height: '12px', width: '60%', background: 'var(--color-primary-light)', borderRadius: '4px' }} />
                <div style={{ height: '8px', width: '80%', background: 'rgba(255,255,255,0.2)', borderRadius: '4px' }} />
                <div style={{ height: '8px', width: '40%', background: 'rgba(255,255,255,0.2)', borderRadius: '4px' }} />
              </div>
              <div style={{ position: 'absolute', top: '10px', right: '10px', fontSize: '1.5rem', color: '#FCD34D', textShadow: '0 0 10px rgba(252, 211, 77, 0.5)' }}>✨</div>
              <div style={{ position: 'absolute', bottom: '10px', left: '0px', fontSize: '1.25rem', color: '#60A5FA', textShadow: '0 0 10px rgba(96, 165, 250, 0.5)' }}>✨</div>
            </div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', fontWeight: 600 }}>No jobs tracked yet</h2>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>Start adding jobs and we'll help you track your progress</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button className="btn btn-primary" onClick={() => setShowAddForm(true)} style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}>
                + Add Your First Job
              </button>
            </div>
          </div>
        )}

      </div>
    </motion.div>
  )
}
