import { useState } from 'react'
import { motion } from 'framer-motion'
import { useGetExperiencesQuery, useSubmitExperienceMutation, useToggleExperienceUpvoteMutation } from '../store/api'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import '../styles/dashboard.css'

export default function CommunityFeedPage() {
  const [showModal, setShowModal] = useState(false)
  const { data, isLoading } = useGetExperiencesQuery({ page: 1 })
  const [toggleUpvote] = useToggleExperienceUpvoteMutation()

  const handleUpvote = (id) => {
    toggleUpvote(id)
  }

  return (
    <div className="dashboard-page">


      <div className="dashboard-layout" style={{ maxWidth: '800px' }}>
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 className="welcome-title gradient-text">Interview Experiences</h1>
            <p className="welcome-subtitle">Learn from others or share your own experience anonymously.</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>Share Experience</button>
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>Loading community posts...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {data?.experiences?.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--color-surface)', borderRadius: '1rem' }}>
                <p>No experiences shared yet. Be the first!</p>
              </div>
            ) : (
              data?.experiences?.map(exp => (
                <motion.div 
                  key={exp._id}
                  className="glass-card"
                  style={{ padding: '1.5rem', borderRadius: '1rem' }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div>
                      <h3 style={{ margin: 0, color: 'var(--color-primary)' }}>{exp.company} - {exp.role}</h3>
                      <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                        By {exp.authorId?.fullName} • {new Date(exp.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div>
                      <span className={`badge badge-${exp.outcome === 'offer' ? 'green' : exp.outcome === 'rejected' ? 'red' : 'blue'}`}>
                        {exp.outcome.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  
                  <div style={{ whiteSpace: 'pre-wrap', marginBottom: '1.5rem', lineHeight: '1.6' }}>
                    {exp.content}
                  </div>

                  {exp.questionsAsked?.length > 0 && (
                    <div style={{ background: 'var(--color-surface-2)', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>
                      <strong style={{ display: 'block', marginBottom: '0.5rem' }}>Questions Asked:</strong>
                      <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
                        {exp.questionsAsked.map((q, i) => <li key={i}>{q}</li>)}
                      </ul>
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
                    <button 
                      onClick={() => handleUpvote(exp._id)}
                      style={{ 
                        background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
                        color: exp.hasUpvoted ? 'var(--color-primary)' : 'var(--color-text-muted)'
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill={exp.hasUpvoted ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>
                      {exp.upvotesCount}
                    </button>
                    <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginLeft: 'auto' }}>
                      Verified {exp.verifiedBadge ? '✅' : '❌'}
                    </span>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>

      {showModal && <SubmissionModal onClose={() => setShowModal(false)} />}
    </div>
  )
}

function SubmissionModal({ onClose }) {
  const { register, handleSubmit } = useForm()
  const [submitExp, { isLoading }] = useSubmitExperienceMutation()
  const [msg, setMsg] = useState('')

  const onSubmit = async (data) => {
    // Convert questions to array
    const questions = data.questions.split('\n').filter(q => q.trim().length > 0)
    try {
      await submitExp({
        company: data.company,
        role: data.role,
        outcome: data.outcome,
        dateOfInterview: data.date,
        content: data.content,
        questionsAsked: questions,
        isAnonymous: data.isAnonymous
      }).unwrap()
      setMsg('Submitted successfully! Waiting for admin approval.')
      setTimeout(onClose, 2000)
    } catch (err) {
      setMsg(err.data?.error || 'Submission failed')
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '600px', borderRadius: '1rem', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
        <h2>Share Interview Experience</h2>
        {msg && <div style={{ padding: '1rem', background: 'var(--color-surface-2)', marginBottom: '1rem', borderRadius: '0.5rem' }}>{msg}</div>}
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Company</label>
              <input type="text" className="form-input" required {...register('company')} />
            </div>
            <div className="form-group">
              <label className="form-label">Role</label>
              <input type="text" className="form-input" required {...register('role')} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Outcome</label>
              <select className="form-input" required {...register('outcome')}>
                <option value="awaiting">Awaiting Result</option>
                <option value="offer">Got Offer</option>
                <option value="rejected">Rejected</option>
                <option value="ghosted">Ghosted</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Date of Interview</label>
              <input type="date" className="form-input" required {...register('date')} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Experience Write-up (No names!)</label>
            <textarea className="form-input" rows="4" required placeholder="How did the rounds go?" {...register('content')}></textarea>
          </div>

          <div className="form-group">
            <label className="form-label">Questions Asked (One per line)</label>
            <textarea className="form-input" rows="3" placeholder="What is the difference between TCP and UDP?" {...register('questions')}></textarea>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input type="checkbox" {...register('isAnonymous')} defaultChecked />
            Post Anonymously
          </label>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={isLoading} style={{ flex: 1 }}>Submit for Review</button>
          </div>
        </form>
      </div>
    </div>
  )
}
