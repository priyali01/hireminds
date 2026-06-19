import { useParams, useNavigate } from 'react-router-dom'
import { useGetInterviewSessionQuery } from '../store/api'

export default function DriveResultsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, isLoading } = useGetInterviewSessionQuery(id)

  if (isLoading || !data?.session) {
    return <div className="page-loader"><div className="loader-ring" /></div>
  }

  const session = data.session
  const results = session.driveResults
  const scoreClass = session.overallScore >= 80 ? 'score-high' : session.overallScore >= 50 ? 'score-mid' : 'score-low'

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <button className="btn btn-ghost" onClick={() => navigate('/interview')} style={{ marginBottom: '2rem' }}>
        ← Back to Interviews
      </button>

      <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem', marginBottom: '2rem' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>{session.company} Mock Drive Results</h1>
        <p className="text-muted" style={{ marginBottom: '2rem' }}>Completed on {new Date(session.completedAt).toLocaleDateString()}</p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '4rem', marginBottom: '2rem' }}>
          <div>
            <div className="text-muted" style={{ marginBottom: '0.5rem' }}>Predicted Score</div>
            <div style={{ fontSize: '3rem', fontWeight: 800 }} className={scoreClass}>
              {session.overallScore?.toFixed(0) || '0'} <span style={{ fontSize: '1.5rem', color: 'var(--color-text-muted)' }}>/ 100</span>
            </div>
          </div>
          <div>
            <div className="text-muted" style={{ marginBottom: '0.5rem' }}>Estimated Percentile</div>
            <div style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--color-info)' }}>
              {results?.percentile || '--'}th
            </div>
          </div>
        </div>
      </div>

      <h2 style={{ marginBottom: '1.5rem' }}>Section Performance</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {results?.sectionScores?.map((sec, idx) => (
          <div key={idx} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 500 }}>{sec.sectionName}</span>
            <span className={`badge ${sec.score >= 80 ? 'badge-green' : sec.score >= 50 ? 'badge-yellow' : 'badge-red'}`}>
              {sec.score.toFixed(0)}%
            </span>
          </div>
        ))}
      </div>

      <div className="card">
        <h2 style={{ marginBottom: '1rem' }}>Study Plan</h2>
        <ul style={{ paddingLeft: '1.5rem', color: 'var(--color-text-muted)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {results?.studyPlan?.map((plan, idx) => (
            <li key={idx}>{plan}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
