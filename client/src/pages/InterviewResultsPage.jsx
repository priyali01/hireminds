import { useParams, useNavigate, Link } from 'react-router-dom'
import { useGetInterviewSessionQuery } from '../store/api'

export default function InterviewResultsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, isLoading } = useGetInterviewSessionQuery(id)

  if (isLoading || !data?.session) {
    return <div className="page-loader"><div className="loader-ring" /></div>
  }

  const session = data.session
  const questions = session.questions || []
  const answers = session.answers || []

  const scoreClass = session.overallScore >= 8 ? 'score-high' : session.overallScore >= 5 ? 'score-mid' : 'score-low'

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <button className="btn btn-ghost" onClick={() => navigate('/interview')} style={{ marginBottom: '2rem' }}>
        ← Back to Interviews
      </button>

      <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem', alignItems: 'flex-start' }}>
        
        {/* Overall Score Card */}
        <div className="card" style={{ flex: '0 0 300px', textAlign: 'center', padding: '3rem 2rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--color-text-muted)' }}>Overall Score</h2>
          <div style={{ fontSize: '4rem', fontWeight: 800, lineHeight: 1 }} className={scoreClass}>
            {session.overallScore?.toFixed(1) || '0.0'}
          </div>
          <p style={{ fontSize: '1.25rem', color: 'var(--color-text-muted)', marginBottom: '2rem' }}>/ 10</p>
          
          <button className="btn btn-primary btn-full" onClick={() => navigate('/interview/setup')}>
            Practice Again
          </button>
        </div>

        {/* Summary Data */}
        <div className="card" style={{ flex: 1 }}>
          <h2 style={{ marginBottom: '1.5rem' }}>Session Details</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div>
              <div className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>Role</div>
              <div style={{ fontWeight: 500 }}>{session.role}</div>
            </div>
            <div>
              <div className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>Type</div>
              <div style={{ fontWeight: 500, textTransform: 'capitalize' }}>{session.type}</div>
            </div>
            <div>
              <div className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>Questions Answered</div>
              <div style={{ fontWeight: 500 }}>{answers.length} / {questions.length}</div>
            </div>
            <div>
              <div className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>Duration</div>
              <div style={{ fontWeight: 500 }}>{Math.floor(session.sessionDurationSeconds / 60)} minutes</div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Question Review */}
      <h2 style={{ marginBottom: '1.5rem' }}>Question Review</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {questions.map((q, idx) => {
          const ans = answers.find(a => a.questionIndex === idx)
          
          return (
            <div key={idx} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.125rem', paddingRight: '2rem' }}>{idx + 1}. {q.text}</h3>
                {ans && (
                  <div style={{ fontWeight: 700, fontSize: '1.25rem' }} className={ans.evaluation.score >= 8 ? 'score-high' : ans.evaluation.score >= 5 ? 'score-mid' : 'score-low'}>
                    {ans.evaluation.score}/10
                  </div>
                )}
              </div>
              
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <span className="badge badge-blue">{q.category}</span>
                <span className="badge badge-yellow">{q.difficulty}</span>
              </div>

              {ans ? (
                <div style={{ background: 'var(--color-bg)', padding: '1.5rem', borderRadius: '0.5rem' }}>
                  <div style={{ marginBottom: '1rem' }}>
                    <strong style={{ color: 'var(--color-text-muted)' }}>Your Answer:</strong>
                    <p style={{ marginTop: '0.5rem', whiteSpace: 'pre-wrap' }}>{ans.userAnswer}</p>
                  </div>
                  
                  <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
                    <strong style={{ color: 'var(--color-primary-light)' }}>AI Feedback:</strong>
                    <p style={{ marginTop: '0.5rem' }}>{ans.evaluation.feedback}</p>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '1rem', background: 'var(--color-surface-2)', borderRadius: '0.5rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
                  Not answered
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
