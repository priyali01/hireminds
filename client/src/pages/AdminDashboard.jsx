import { useGetPendingExperiencesQuery, useModerateExperienceMutation } from '../store/api'
import { Link } from 'react-router-dom'
import '../styles/dashboard.css'

export default function AdminDashboard() {
  const { data, isLoading } = useGetPendingExperiencesQuery()
  const [moderateExp] = useModerateExperienceMutation()

  const handleModerate = async (id, status) => {
    try {
      await moderateExp({ id, status }).unwrap()
    } catch (err) {
      alert('Moderation failed: ' + err.data?.error)
    }
  }

  return (
    <div className="dashboard-page">


      <div className="dashboard-layout">
        <h1 className="welcome-title gradient-text">Moderation Queue</h1>
        <p className="welcome-subtitle">Approve or reject community submissions. Reject if real names are used.</p>

        {isLoading ? (
          <div>Loading queue...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem' }}>
            {data?.queue?.length === 0 ? (
              <div style={{ padding: '2rem', background: 'var(--color-surface)', borderRadius: '1rem', textAlign: 'center' }}>
                No pending items.
              </div>
            ) : (
              data?.queue?.map(exp => (
                <div key={exp._id} className="glass-card" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div>
                      <h3 style={{ margin: 0 }}>{exp.company} - {exp.role}</h3>
                      <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                        Original Author ID: {exp.authorId?._id} | Anonymous: {exp.isAnonymous ? 'Yes' : 'No'}
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ whiteSpace: 'pre-wrap', padding: '1rem', background: 'var(--color-surface-2)', borderRadius: '0.5rem', marginBottom: '1rem' }}>
                    {exp.content}
                  </div>

                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn btn-primary" onClick={() => handleModerate(exp._id, 'approved')} style={{ background: '#10b981' }}>Approve Post</button>
                    <button className="btn btn-ghost" onClick={() => handleModerate(exp._id, 'rejected')} style={{ color: '#ef4444' }}>Reject Post</button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
