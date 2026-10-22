import { useState, useRef } from 'react'
import { useSelector } from 'react-redux'
import { selectCurrentUser } from '../store/authSlice'
import {
  useUploadAndAnalyzeResumeMutation,
  useSubmitResumeFeedbackMutation,
} from '../store/api'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import '../styles/resume.css'

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

function ScoreColor({ score }) {
  if (score >= 80) return 'score-high'
  if (score >= 50) return 'score-mid'
  return 'score-low'
}

function ScoreBar({ value, label, note }) {
  const color = ScoreColor({ score: value })
  return (
    <div className="score-bar-row">
      <div className="score-bar-meta">
        <span className="score-bar-label">{label}</span>
        <span className={`score-bar-value ${color}`}>{value}/100</span>
      </div>
      <div className="score-bar-track">
        <div
          className={`score-bar-fill bg-${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
      {note && <p className="score-bar-note">{note}</p>}
    </div>
  )
}

const CHECK_GROUPS = [
  { id: 'search', title: 'Compatibility · can a parser read it' },
  { id: 'headings', title: 'Compatibility · standard headings' },
  { id: 'impact', title: 'Compatibility · bullets and proof' },
  { id: 'skillcoverage', title: 'Compatibility · skills' },
  { id: 'projects', title: 'Level score · projects' },
  { id: 'skills', title: 'Level score · skills' },
  { id: 'education', title: 'Level score · education' },
  { id: 'experience', title: 'Level score · experience' },
  { id: 'certifications', title: 'Level score · certifications' },
]

function ATSResult({ result, resumeId }) {
  const [feedback, setFeedback] = useState(null)
  const [submitFeedback] = useSubmitResumeFeedbackMutation()

  const handleFeedback = async (thumbsUp) => {
    setFeedback(thumbsUp ? 'up' : 'down')
    await submitFeedback({ resumeId, thumbsUp }).catch(() => {})
  }

  const compatibility = result.compatibility ?? result.overall
  const compatClass = ScoreColor({ score: compatibility })
  const levelClass = ScoreColor({ score: result.overall })
  const levelName = result.level || 'fresher'
  const weights = result.weights || {}

  return (
    <div className="result-grid">
      <div className="score-pair">
        <div className="card result-score-card glass-card">
          <p className="result-section-label">ATS compatibility</p>
          <div className="overall-score">
            <span className={`score-big ${compatClass}`}>{compatibility}</span>
            <span className="score-denom">/100</span>
          </div>
          <p className="score-explain">
            Compare this number with a generic online ATS checker. It counts contact details, standard headings, bullets, metrics, and skills. It is not a match to one job description.
          </p>
        </div>
        <div className="card result-score-card glass-card">
          <p className="result-section-label">HireMinds {levelName} score</p>
          <div className="overall-score">
            <span className={`score-big ${levelClass}`}>{result.overall}</span>
            <span className="score-denom">/100</span>
          </div>
          <p className="score-explain">{result.formula}</p>
        </div>
      </div>
      <p className="model-tag">Scored in code from the checklist below. The same resume always gets the same numbers. An online checker will be close on compatibility and will disagree with the fresher score when it punishes missing experience.</p>

      <div className="card glass-card">
        <h3 className="result-section-title">Level score, section by section</h3>
        <div className="breakdown-list">
          {Object.entries(result.breakdown || {}).map(([key, val]) => {
            const weight = Math.round((weights[key] || 0) * 100)
            return (
              <ScoreBar
                key={key}
                value={val}
                label={`${key.charAt(0).toUpperCase() + key.slice(1)} · ${weight}% of the level score`}
                note={weight === 0 ? 'Shown so you can see it. It adds nothing at this level.' : ''}
              />
            )
          })}
        </div>
      </div>

      {result.compatibilityBreakdown && (
        <div className="card glass-card">
          <h3 className="result-section-title">Compatibility, piece by piece</h3>
          <p className="score-explain">Searchability 30%, headings 25%, impact 25%, skills 20%.</p>
          <div className="breakdown-list">
            {Object.entries(result.compatibilityBreakdown).map(([key, val]) => (
              <ScoreBar key={key} value={val} label={key.charAt(0).toUpperCase() + key.slice(1)} />
            ))}
          </div>
        </div>
      )}

      <div className="card glass-card">
        <h3 className="result-section-title">Every check</h3>
        {CHECK_GROUPS.map((group) => {
          const items = (result.checks || []).filter((item) => item.group === group.id)
          if (!items.length) return null
          const earned = items.reduce((sum, item) => sum + item.earned, 0)
          const max = items.reduce((sum, item) => sum + item.max, 0)
          return (
            <div key={group.id} className="check-group">
              <div className="check-group-title">
                <span>{group.title}</span>
                <span>{earned}/{max}</span>
              </div>
              {items.map((item) => (
                <div key={item.id} className={`check-row ${item.passed ? 'check-pass' : 'check-miss'}`}>
                  <div className="check-row-top">
                    <span className="check-mark">{item.passed ? 'Pass' : 'Fix'}</span>
                    <span className="check-label">{item.label}</span>
                    <span className="check-points">{item.earned}/{item.max}</span>
                  </div>
                  <p className="check-detail">{item.detail}</p>
                </div>
              ))}
            </div>
          )
        })}
        <div className="feedback-row">
          <span className="feedback-label">Was this helpful?</span>
          <button
            id="thumb-up"
            onClick={() => handleFeedback(true)}
            className={`thumb-btn ${feedback === 'up' ? 'active' : ''}`}
            title="Helpful"
          >👍</button>
          <button
            id="thumb-down"
            onClick={() => handleFeedback(false)}
            className={`thumb-btn ${feedback === 'down' ? 'active' : ''}`}
            title="Not helpful"
          >👎</button>
        </div>
      </div>

      {/* Strengths */}
      {result.strengths?.length > 0 && (
        <div className="card strengths-card glass-card">
          <h3 className="result-section-title">✅ What's working</h3>
          <ul className="result-list">
            {result.strengths.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>
      )}

      {/* Feedback / improvements */}
      {result.feedback?.length > 0 && (
        <div className="card glass-card">
          <h3 className="result-section-title">💡 What to improve</h3>
          <ul className="result-list">
            {result.feedback.map((f, i) => <li key={i}>{f}</li>)}
          </ul>
        </div>
      )}

      {/* Missing keywords */}
      <div className="card glass-card">
        <h3 className="result-section-title">Common keywords not on this resume</h3>
        <p className="score-explain">{result.keywordNote}</p>
        {result.missingKeywords?.length > 0 && (
          <div className="chip-grid">
            {result.missingKeywords.map((k) => (
              <span key={k} className="chip">{k}</span>
            ))}
          </div>
        )}
      </div>

      {/* One-week fix plan */}
      {result.oneWeekFixPlan?.length > 0 && (
        <div className="card fix-plan-card glass-card">
          <h3 className="result-section-title">📅 One-week fix plan</h3>
          <ol className="fix-plan-list">
            {result.oneWeekFixPlan.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}

function FeatureItem({ icon, title, desc }) {
  return (
    <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
      <div style={{ padding: '0.75rem', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.1)', borderRadius: '0.75rem', color: 'var(--color-primary-light)', fontSize: '1.25rem' }}>
        {icon}
      </div>
      <div>
        <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', fontWeight: 600 }}>{title}</h4>
        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>{desc}</p>
      </div>
    </div>
  )
}

export default function ResumePage() {
  const user = useSelector(selectCurrentUser)
  const [uploadAndAnalyze, { isLoading: isAnalyzing }] = useUploadAndAnalyzeResumeMutation()

  const [file, setFile] = useState(null)
  const [level, setLevel] = useState(({
    fresher: 'fresher',
    junior: 'intermediate',
    intermediate: 'intermediate',
    mid: 'experienced',
    senior: 'experienced',
    experienced: 'experienced',
  })[user?.level] || 'fresher')
  const [result, setResult] = useState(null)
  const [resumeId, setResumeId] = useState(null)
  const [error, setError] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef()

  const handleFile = (f) => {
    if (f?.type !== 'application/pdf') {
      setError('Only PDF files are accepted.')
      return
    }
    setFile(f)
    setError(null)
    setResult(null)
  }

  const handleAnalyze = async () => {
    if (!file) return
    setError(null)
    const formData = new FormData()
    formData.append('resume', file)
    formData.append('level', level)
    try {
      const res = await uploadAndAnalyze(formData).unwrap()
      setResult(res.score)
      setResumeId(res.resumeId)
    } catch (err) {
      setError(err.data?.message || 'Analysis failed. Please try again.')
    }
  }

  return (
    <motion.div className="resume-page" style={{ padding: 'var(--space-8)' }} initial="hidden" animate="show" variants={containerVariants}>

      <div className="resume-analyzer-grid">
        
        {/* Upload panel (Left Column) */}
        <motion.div variants={itemVariants} className="upload-panel glass-card" style={{ padding: '2.5rem', borderRadius: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <h1 className="page-title" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
            Resume <span className="gradient-text">Analyser</span>✨
          </h1>
          <p className="page-subtitle" style={{ fontSize: '1rem', color: 'var(--color-text-muted)', marginBottom: '2rem', maxWidth: '90%' }}>
            Two scores from the text of your PDF. Compatibility is the one to compare with an online checker. The level score is HireMinds, and a fresher is not marked down for having no job.
          </p>

          {/* Level selector */}
          <div className="level-selector" style={{ marginBottom: '2rem' }}>
            <p className="form-label" style={{ fontSize: '0.875rem', marginBottom: '0.75rem', color: 'var(--color-text-muted)' }}>I'm a</p>
            <div className="level-tabs" style={{ display: 'flex', gap: '0.5rem' }}>
              {['fresher', 'intermediate', 'experienced'].map((l) => (
                <button
                  key={l}
                  id={`level-tab-${l}`}
                  onClick={() => setLevel(l)}
                  className={`level-tab ${level === l ? 'active' : ''}`}
                  style={{
                    padding: '0.5rem 1.25rem',
                    borderRadius: '2rem',
                    border: level === l ? '1px solid transparent' : '1px solid rgba(255,255,255,0.1)',
                    background: level === l ? 'var(--color-primary)' : 'transparent',
                    color: level === l ? '#000' : 'var(--color-text-muted)',
                    fontWeight: level === l ? 600 : 400,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {l.charAt(0).toUpperCase() + l.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Drop zone */}
          <div
            id="drop-zone"
            className={`drop-zone ${dragOver ? 'drag-over' : ''} ${file ? 'has-file' : ''}`}
            onClick={() => fileInputRef.current.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragOver(false)
              handleFile(e.dataTransfer.files[0])
            }}
            style={{
              border: '2px dashed rgba(16, 185, 129, 0.3)',
              borderRadius: '1rem',
              padding: '3rem 2rem',
              textAlign: 'center',
              background: dragOver ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255, 255, 255, 0.02)',
              cursor: 'pointer',
              transition: 'all 0.2s',
              marginBottom: '1.5rem'
            }}
          >
            {file ? (
              <div className="file-selected" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                <span className="file-icon" style={{ fontSize: '2.5rem' }}>📄</span>
                <span className="file-name" style={{ fontWeight: 500, color: 'var(--color-primary-light)' }}>{file.name}</span>
                <span className="file-size" style={{ fontSize: '0.875rem', color: 'var(--color-text-faint)' }}>{(file.size / 1024).toFixed(0)} KB</span>
              </div>
            ) : (
              <div className="drop-prompt" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                  ↑
                </div>
                <p className="drop-text" style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>Click or drag & drop your resume</p>
                <p className="drop-hint" style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', margin: 0 }}>PDF only • Max 5MB</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => handleFile(e.target.files[0])}
              style={{ display: 'none' }}
            />
          </div>

          {error && <div className="server-error" style={{ marginBottom: '1.5rem', color: '#ef4444' }}>{error}</div>}

          <button
            id="analyze-btn"
            onClick={handleAnalyze}
            disabled={!file || isAnalyzing}
            className="btn btn-primary"
            style={{ 
              width: '100%', 
              padding: '1rem', 
              fontSize: '1rem', 
              borderRadius: '0.75rem',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '0.5rem',
              opacity: (!file || isAnalyzing) ? 0.7 : 1
            }}
          >
            {isAnalyzing ? (
              <span className="btn-loading" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="spinner" />
                Analysing...
              </span>
            ) : (
              <>✨ Analyse Resume</>
            )}
          </button>
          
          <div style={{ textAlign: 'center', marginTop: '1rem', marginBottom: '2rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>🔒 Your data is secure and never shared.</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem', marginTop: 'auto' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', fontWeight: 600 }}><span style={{ color: 'var(--color-primary-light)' }}>🛡️</span> ATS Optimized</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-faint)' }}>Get a score that matters</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', fontWeight: 600 }}><span style={{ color: 'var(--color-primary-light)' }}>✨</span> AI-Powered Insights</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-faint)' }}>Actionable suggestions</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', fontWeight: 600 }}><span style={{ color: 'var(--color-primary-light)' }}>📈</span> Faster Shortlisting</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-faint)' }}>Stand out to recruiters</div>
            </div>
          </div>
        </motion.div>

        {/* Results / Info panel (Right Column) */}
        <motion.div variants={itemVariants} className="results-panel glass-card" style={{ padding: '2rem', borderRadius: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: result ? 'flex-start' : 'center' }}>
          {result ? (
            <ATSResult result={result} resumeId={resumeId} />
          ) : (
            <div className="results-empty" style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1.5rem' }}>
                {/* Styled illustration matching screenshot */}
                <div style={{ position: 'relative', width: '120px', height: '140px', margin: '0 auto' }}>
                  {/* Document shape */}
                  <div style={{ position: 'absolute', top: 0, left: '10px', right: '10px', bottom: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    {/* Corner fold */}
                    <div style={{ position: 'absolute', top: 0, right: 0, width: '30px', height: '30px', background: 'rgba(16, 185, 129, 0.4)', borderRadius: '0 8px 0 8px' }}></div>
                    {/* Text lines */}
                    <div style={{ position: 'absolute', top: '30px', left: '20px', width: '50%', height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px' }}></div>
                    <div style={{ position: 'absolute', top: '45px', left: '20px', width: '70%', height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px' }}></div>
                    <div style={{ position: 'absolute', top: '60px', left: '20px', width: '40%', height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px' }}></div>
                  </div>
                  {/* Glowing bars overlapping */}
                  <div style={{ position: 'absolute', bottom: 0, left: 0, width: '15px', height: '45px', background: 'var(--color-primary)', borderRadius: '4px', boxShadow: '0 0 15px var(--color-primary)' }}></div>
                  <div style={{ position: 'absolute', bottom: 0, left: '25px', width: '15px', height: '70px', background: 'var(--color-primary-light)', borderRadius: '4px', boxShadow: '0 0 15px var(--color-primary-light)' }}></div>
                  <div style={{ position: 'absolute', bottom: 0, left: '50px', width: '15px', height: '30px', background: 'var(--color-primary)', borderRadius: '4px', boxShadow: '0 0 15px var(--color-primary)' }}></div>
                  <div style={{ position: 'absolute', bottom: 0, left: '75px', width: '15px', height: '55px', background: 'var(--color-primary-light)', borderRadius: '4px', boxShadow: '0 0 15px var(--color-primary-light)' }}></div>
                  <div style={{ position: 'absolute', bottom: 0, left: '100px', width: '15px', height: '85px', background: 'var(--color-primary)', borderRadius: '4px', boxShadow: '0 0 15px var(--color-primary)' }}></div>
                </div>

                <div>
                  <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Your analysis will appear here</h3>
                  <p style={{ color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.5 }}>
                    Upload your resume and click<br />
                    <span style={{ color: 'var(--color-primary-light)' }}>"Analyse Resume"</span> to get started.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: '0 1rem' }}>
                <FeatureItem icon="🎯" title="Instant ATS Score" desc="See how well your resume performs against ATS filters." />
                <FeatureItem icon="🔍" title="Keyword Insights" desc="Discover missing keywords and optimize your resume." />
                <FeatureItem icon="💡" title="Smart Suggestions" desc="AI-recommended changes to improve your chances." />
                <FeatureItem icon="🎖️" title="Stand Out" desc="Build a resume that gets noticed by top recruiters." />
              </div>

            </div>
          )}
        </motion.div>

      </div>
    </motion.div>
  )
}
