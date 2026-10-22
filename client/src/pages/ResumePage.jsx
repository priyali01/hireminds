import { useState, useRef } from 'react'
import { useAssessResumeMutation } from '../store/api'
import { motion } from 'framer-motion'
import AtsReport from '../components/AtsReport'
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

function acceptedResume(file) {
  if (!file) return false
  const name = file.name.toLowerCase()
  return name.endsWith('.pdf') || name.endsWith('.docx')
}

export default function ResumePage() {
  const [assessResume, { isLoading: isAnalyzing }] = useAssessResumeMutation()

  const [file, setFile] = useState(null)
  const [jobDescription, setJobDescription] = useState('')
  const [assessment, setAssessment] = useState(null)
  const [error, setError] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef()

  const handleFile = (f) => {
    if (!acceptedResume(f)) {
      setError('Upload a PDF or DOCX resume. Scans and old .doc files are not scored.')
      return
    }
    setFile(f)
    setError(null)
  }

  const handleAnalyze = async () => {
    if (!file) return
    if (jobDescription.trim().length < 40) {
      setError('Paste the job description. It needs at least a few lines so required skills can be found.')
      return
    }
    setError(null)
    const formData = new FormData()
    formData.append('resume', file)
    formData.append('jobDescription', jobDescription)
    try {
      const res = await assessResume(formData).unwrap()
      setAssessment(res.assessment)
    } catch (err) {
      setAssessment(null)
      setError(err.data?.details?.[0]?.message || err.data?.message || 'Analysis failed. Please try again.')
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
          <p className="page-subtitle" style={{ fontSize: '1rem', color: 'var(--color-text-muted)', marginBottom: '1rem', maxWidth: '90%' }}>
            Paste a job description and upload a text PDF or DOCX. You get two scores, both calculated on this server: whether the file can be read, and how the text matches this job. Neither is an employer ATS.
          </p>
          <label className="form-label" htmlFor="job-description" style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Job description</label>
          <textarea
            id="job-description"
            className="jd-input"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the role requirements, preferred skills, and responsibilities."
          />

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
                <p className="drop-hint" style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', margin: 0 }}>PDF or DOCX • Max 5MB • text files, not scans</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
              onChange={(e) => handleFile(e.target.files[0])}
              style={{ display: 'none' }}
            />
          </div>

          {error && <div className="server-error" style={{ marginBottom: '1.5rem', color: '#ef4444' }}>{error}</div>}

          <button
            id="analyze-btn"
            onClick={handleAnalyze}
            disabled={!file || jobDescription.trim().length < 40 || isAnalyzing}
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
              opacity: (!file || jobDescription.trim().length < 40 || isAnalyzing) ? 0.7 : 1
            }}
          >
            {isAnalyzing ? (
              <span className="btn-loading" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="spinner" />
                Analysing...
              </span>
            ) : (
              <>{assessment ? 'Rescan' : 'Score against this job'}</>
            )}
          </button>
          
          <div style={{ textAlign: 'center', marginTop: '1rem', marginBottom: '2rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>🔒 Your data is secure and never shared.</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem', marginTop: 'auto' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', fontWeight: 600 }}><span style={{ color: 'var(--color-primary-light)' }}>🛡️</span> Local scoring</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-faint)' }}>Calculated on this server</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', fontWeight: 600 }}><span style={{ color: 'var(--color-primary-light)' }}>✨</span> Evidence</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-faint)' }}>Shows where each skill was found</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', fontWeight: 600 }}><span style={{ color: 'var(--color-primary-light)' }}>📈</span> Practice gate</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-faint)' }}>Opens at 75 on this rubric</div>
            </div>
          </div>
        </motion.div>

        {/* Results / Info panel (Right Column) */}
        <motion.div variants={itemVariants} className="results-panel glass-card" style={{ padding: '2rem', borderRadius: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: assessment ? 'flex-start' : 'center' }}>
          {assessment ? (
            <AtsReport assessment={assessment} />
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
                    Paste a job description, upload a text resume, and click<br />
                    <span style={{ color: 'var(--color-primary-light)' }}>Score against this job</span>.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: '0 1rem' }}>
                <FeatureItem icon="🎯" title="Practice match score" desc="See how this resume lines up with the job description you pasted." />
                <FeatureItem icon="🔍" title="Required skill gaps" desc="See required skills that were not found in the resume." />
                <FeatureItem icon="💡" title="What to fix" desc="Missing required skills and unverified experience, with a rescan after you edit the file." />
                <FeatureItem icon="🎖️" title="A checklist, not a promise" desc="Use the gaps before you apply. This number is not an employer ATS result." />
              </div>

            </div>
          )}
        </motion.div>

      </div>
    </motion.div>
  )
}
