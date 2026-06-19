import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  useGetInterviewSessionQuery, 
  useSubmitInterviewAnswerMutation,
  useCompleteInterviewSessionMutation 
} from '../store/api'

export default function InterviewSessionPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  
  const { data, isLoading } = useGetInterviewSessionQuery(id)
  const [submitAnswer, { isLoading: isSubmitting }] = useSubmitInterviewAnswerMutation()
  const [completeSession, { isLoading: isCompleting }] = useCompleteInterviewSessionMutation()

  const [currentIndex, setCurrentIndex] = useState(0)
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [timeLeft, setTimeLeft] = useState(1800) // 30 mins default
  
  const session = data?.session
  const questions = session?.questions || []
  const answers = session?.answers || []
  
  // Find if current question is already answered
  const existingAnswer = answers.find(a => a.questionIndex === currentIndex)

  useEffect(() => {
    if (session?.status === 'completed') {
      navigate(`/interview/results/${id}`, { replace: true })
    }
  }, [session, id, navigate])

  useEffect(() => {
    // Simple timer
    const timer = setInterval(() => {
      setTimeLeft(prev => prev > 0 ? prev - 1 : 0)
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1)
      setCurrentAnswer('')
    }
  }

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
      setCurrentAnswer('')
    }
  }

  const handleSubmit = async () => {
    if (!currentAnswer.trim() || currentAnswer.length < 10) return
    
    try {
      await submitAnswer({
        id,
        questionIndex: currentIndex,
        userAnswer: currentAnswer
      }).unwrap()
    } catch (err) {
      console.error('Failed to submit answer:', err)
    }
  }

  const handleFinish = async () => {
    if (window.confirm('Are you sure you want to finish this interview?')) {
      try {
        await completeSession(id).unwrap()
        navigate(`/interview/results/${id}`)
      } catch (err) {
        console.error('Failed to complete session:', err)
      }
    }
  }

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  if (isLoading || !session) return <div className="page-loader"><div className="loader-ring" /></div>

  return (
    <div className="interview-layout">
      {/* Sidebar Navigation */}
      <aside className="interview-sidebar">
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)' }}>
          <h2 style={{ fontSize: '1.125rem' }}>{session.role}</h2>
          <p className="text-muted" style={{ textTransform: 'capitalize' }}>{session.type} Interview</p>
        </div>
        
        <div className="question-nav-list">
          {questions.map((q, idx) => {
            const isCompleted = answers.some(a => a.questionIndex === idx)
            const isActive = currentIndex === idx
            
            return (
              <div 
                key={idx}
                className={`question-nav-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                onClick={() => {
                  setCurrentIndex(idx)
                  setCurrentAnswer('')
                }}
              >
                <div className="question-status-dot" />
                Question {idx + 1}
              </div>
            )
          })}
        </div>

        <div style={{ padding: '1.5rem', borderTop: '1px solid var(--color-border)' }}>
          <button 
            className="btn btn-primary btn-full" 
            onClick={handleFinish}
            disabled={isCompleting}
          >
            {isCompleting ? 'Finishing...' : 'Finish Interview'}
          </button>
        </div>
      </aside>

      {/* Main Focus Area */}
      <main className="interview-main">
        <header className="interview-header">
          <div style={{ color: 'var(--color-text-muted)', fontWeight: 500 }}>
            Question {currentIndex + 1} of {questions.length}
          </div>
          <div className={`interview-timer ${timeLeft < 300 ? 'timer-warning' : ''}`}>
            {formatTime(timeLeft)}
          </div>
        </header>

        <div className="question-container">
          <h1 className="question-title">
            {questions[currentIndex]?.text}
          </h1>

          {existingAnswer ? (
            // Show existing answer and AI feedback
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ padding: '1.5rem', background: 'var(--color-surface-2)', borderRadius: '0.75rem', border: '1px solid var(--color-border)' }}>
                <h3 style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>Your Answer:</h3>
                <p style={{ whiteSpace: 'pre-wrap' }}>{existingAnswer.userAnswer}</p>
              </div>

              {existingAnswer.evaluation && (
                <div className="ai-feedback-card">
                  <div className="ai-feedback-header">
                    <h3 style={{ color: 'var(--color-primary-light)' }}>AI Evaluation</h3>
                    <div className="feedback-score">
                      <span className={existingAnswer.evaluation.score >= 8 ? 'score-high' : existingAnswer.evaluation.score >= 5 ? 'score-mid' : 'score-low'}>
                        {existingAnswer.evaluation.score}
                      </span>
                      <span style={{ fontSize: '1rem', color: 'var(--color-text-muted)' }}>/10</span>
                    </div>
                  </div>
                  
                  <p style={{ marginBottom: '1rem', lineHeight: 1.6 }}>{existingAnswer.evaluation.feedback}</p>
                  
                  {existingAnswer.evaluation.missingElements?.length > 0 && (
                    <div style={{ marginBottom: '1rem' }}>
                      <strong style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-error)' }}>Missing Elements:</strong>
                      <ul style={{ paddingLeft: '1.5rem', color: 'var(--color-text-muted)' }}>
                        {existingAnswer.evaluation.missingElements.map((el, i) => <li key={i}>{el}</li>)}
                      </ul>
                    </div>
                  )}

                  <div>
                    <strong style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-success)' }}>Improved Example:</strong>
                    <p style={{ fontStyle: 'italic', color: 'var(--color-text-muted)' }}>"{existingAnswer.evaluation.improvedAnswer}"</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Input area for new answer
            <div className="answer-area">
              <textarea
                className="answer-textarea"
                placeholder="Type your answer here... (minimum 10 characters)"
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button 
                  className="btn btn-primary"
                  disabled={currentAnswer.length < 10 || isSubmitting}
                  onClick={handleSubmit}
                >
                  {isSubmitting ? <div className="spinner" /> : 'Submit Answer'}
                </button>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '2rem' }}>
            <button 
              className="btn btn-secondary" 
              onClick={handlePrev} 
              disabled={currentIndex === 0}
            >
              Previous
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={handleNext} 
              disabled={currentIndex === questions.length - 1}
            >
              Next Question
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
