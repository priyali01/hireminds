import { Link, useNavigate } from 'react-router-dom'
import { useGetInterviewHistoryQuery } from '../store/api'
import '../styles/interview.css'

export default function InterviewPage() {
  const { data, isLoading } = useGetInterviewHistoryQuery()
  const navigate = useNavigate()

  return (
    <div className="page-container" style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Interview Preparation</h1>
          <p className="text-muted">Practice with AI, or simulate full placement drives.</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/interview/setup')}>
          Start New Session
        </button>
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ marginBottom: '1.5rem' }}>Session History</h2>
        
        {isLoading ? (
          <div className="skeleton" style={{ height: '200px' }} />
        ) : !data?.sessions?.length ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--color-text-muted)' }}>
            <p style={{ marginBottom: '1rem' }}>No interview sessions yet.</p>
            <button className="btn btn-secondary" onClick={() => navigate('/interview/setup')}>
              Start your first interview
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {data.sessions.map((session) => (
              <div 
                key={session._id} 
                className="card" 
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem' }}
              >
                <div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <h3 style={{ fontSize: '1.125rem' }}>
                      {session.type === 'placement_drive' ? `${session.company} Mock Drive` : `${session.role} Interview`}
                    </h3>
                    <span className={`badge ${session.status === 'completed' ? 'badge-green' : 'badge-yellow'}`}>
                      {session.status}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                    {new Date(session.createdAt).toLocaleDateString()} • {session.type}
                  </p>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                  {session.status === 'completed' && session.overallScore !== null && (
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--color-primary-light)' }}>
                        {session.type === 'placement_drive' ? session.overallScore.toFixed(0) : session.overallScore.toFixed(1)}
                      </span>
                      <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                        {session.type === 'placement_drive' ? ' / 100' : ' / 10'}
                      </span>
                    </div>
                  )}
                  
                  <Link 
                    to={session.type === 'placement_drive' 
                      ? (session.status === 'completed' ? `/interview/drive/${session._id}/results` : `/interview/drive/${session._id}`)
                      : (session.status === 'completed' ? `/interview/results/${session._id}` : `/interview/session/${session._id}`)}
                    className="btn btn-secondary"
                  >
                    {session.status === 'completed' ? 'View Results' : 'Resume'}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
