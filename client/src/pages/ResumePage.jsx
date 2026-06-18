import { useState, useRef } from 'react'
import { useSelector } from 'react-redux'
import { selectCurrentUser } from '../store/authSlice'
import {
  useUploadAndAnalyzeResumeMutation,
  useGetResumeHistoryQuery,
  useSubmitResumeFeedbackMutation,
} from '../store/api'
import { Link } from 'react-router-dom'
import '../styles/resume.css'

function ScoreColor({ score }) {
  if (score >= 80) return 'score-high'
  if (score >= 50) return 'score-mid'
  return 'score-low'
}

function ScoreBar({ value, label }) {
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
    </div>
  )
}

function ATSResult({ result, resumeId }) {
  const [feedback, setFeedback] = useState(null)
  const [submitFeedback] = useSubmitResumeFeedbackMutation()

  const handleFeedback = async (thumbsUp) => {
    setFeedback(thumbsUp ? 'up' : 'down')
    await submitFeedback({ resumeId, thumbsUp }).catch(() => {})
  }

  const scoreClass = ScoreColor({ score: result.overall })
  const scoreLabel = result.overall >= 80 ? 'Strong' : result.overall >= 50 ? 'Average' : 'Needs work'

  return (
    <div className="result-grid">
      {/* Overall score */}
      <div className="card result-score-card">
        <p className="result-section-label">ATS Score</p>
        <div className="overall-score">
          <span className={`score-big ${scoreClass}`}>{result.overall}</span>
          <span className="score-denom">/100</span>
        </div>
        <span className={`badge badge-${result.overall >= 80 ? 'green' : result.overall >= 50 ? 'yellow' : 'red'}`}>
          {scoreLabel}
        </span>
        <div className="score-bar-track" style={{ marginTop: '1rem' }}>
          <div
            className={`score-bar-fill bg-${scoreClass}`}
            style={{ width: `${result.overall}%` }}
          />
        </div>
        <p className="model-tag">Analysed by {result.modelUsed || 'gemini-2.5-flash'}</p>

        {/* Thumbs feedback */}
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

      {/* Breakdown */}
      <div className="card">
        <h3 className="result-section-title">Section breakdown</h3>
        <div className="breakdown-list">
          {Object.entries(result.breakdown || {})
            .filter(([, v]) => v > 0)
            .map(([key, val]) => (
              <ScoreBar key={key} value={val} label={key.charAt(0).toUpperCase() + key.slice(1)} />
            ))}
        </div>
      </div>

      {/* Strengths */}
      {result.strengths?.length > 0 && (
        <div className="card strengths-card">
          <h3 className="result-section-title">✅ What's working</h3>
          <ul className="result-list">
            {result.strengths.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>
      )}

      {/* Feedback / improvements */}
      {result.feedback?.length > 0 && (
        <div className="card">
          <h3 className="result-section-title">💡 What to improve</h3>
          <ul className="result-list">
            {result.feedback.map((f, i) => <li key={i}>{f}</li>)}
          </ul>
        </div>
      )}

      {/* Missing keywords */}
      {result.missingKeywords?.length > 0 && (
        <div className="card">
          <h3 className="result-section-title">🔍 Missing keywords</h3>
          <div className="chip-grid">
            {result.missingKeywords.map((k, i) => (
              <span key={i} className="chip">{k}</span>
            ))}
          </div>
        </div>
      )}

      {/* One-week fix plan */}
      {result.oneWeekFixPlan?.length > 0 && (
        <div className="card fix-plan-card">
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

export default function ResumePage() {
  const user = useSelector(selectCurrentUser)
  const [uploadAndAnalyze, { isLoading: isAnalyzing }] = useUploadAndAnalyzeResumeMutation()
  const { data: historyData } = useGetResumeHistoryQuery()

  const [file, setFile] = useState(null)
  const [level, setLevel] = useState(user?.level || 'fresher')
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
    <div className="resume-page">
      <nav className="nav">
        <div className="nav-brand">🧠 HireMinds</div>
        <div className="nav-links">
          <Link to="/dashboard" className="nav-link">Dashboard</Link>
          <Link to="/resume" className="nav-link active">Resume</Link>
        </div>
      </nav>

      <div className="resume-layout">
        {/* Upload panel */}
        <div className="upload-panel">
          <h1 className="page-title">Resume Analyser</h1>
          <p className="page-subtitle">
            Level-aware ATS scoring — freshers compared to freshers, not senior engineers.
          </p>

          {/* Level selector */}
          <div className="level-selector">
            <p className="form-label">I'm a</p>
            <div className="level-tabs">
              {['fresher', 'intermediate', 'experienced'].map((l) => (
                <button
                  key={l}
                  id={`level-tab-${l}`}
                  onClick={() => setLevel(l)}
                  className={`level-tab ${level === l ? 'active' : ''}`}
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
          >
            {file ? (
              <div className="file-selected">
                <span className="file-icon">📄</span>
                <span className="file-name">{file.name}</span>
                <span className="file-size">{(file.size / 1024).toFixed(0)} KB</span>
              </div>
            ) : (
              <div className="drop-prompt">
                <span className="drop-icon">⬆️</span>
                <p className="drop-text">Click or drag & drop your resume</p>
                <p className="drop-hint">PDF only · Max 5MB</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => handleFile(e.target.files[0])}
            />
          </div>

          {error && <div className="server-error" style={{ marginTop: '1rem' }}>{error}</div>}

          <button
            id="analyze-btn"
            onClick={handleAnalyze}
            disabled={!file || isAnalyzing}
            className="btn btn-primary btn-full"
            style={{ marginTop: '1rem' }}
          >
            {isAnalyzing ? (
              <span className="btn-loading">
                <span className="spinner" />
                Analysing with AI...
              </span>
            ) : 'Analyse Resume'}
          </button>

          {/* History */}
          {historyData?.resumes?.length > 0 && (
            <div className="history-section">
              <h3 className="history-title">Past analyses</h3>
              <div className="history-list">
                {historyData.resumes.slice(0, 5).map((r) => (
                  <div key={r._id} className="history-item">
                    <div>
                      <p className="history-filename">{r.pdfMeta?.originalFilename || 'Manual entry'}</p>
                      <p className="history-date">{new Date(r.createdAt).toLocaleDateString('en-IN')}</p>
                    </div>
                    <span className={`score-badge ${ScoreColor({ score: r.atsScore.overall })}`}>
                      {r.atsScore.overall}/100
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Results panel */}
        <div className="results-panel">
          {result ? (
            <ATSResult result={result} resumeId={resumeId} />
          ) : (
            <div className="results-empty">
              <div className="empty-illustration">📊</div>
              <h3>Your analysis will appear here</h3>
              <p>Upload your resume and click "Analyse Resume" to get started.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
