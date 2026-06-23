import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCreateInterviewSessionMutation } from '../store/api'
import '../styles/interview.css'

const COMPANIES = [
  { id: 'tcs_nqt', name: 'TCS NQT', duration: '120 mins', sections: 'Verbal, Quant, Logic, Coding' },
  { id: 'infosys_infytq', name: 'Infosys InfyTQ', duration: '110 mins', sections: 'Logic, Verbal, Quant, Programming' },
  { id: 'amcat', name: 'AMCAT', duration: '60 mins', sections: 'Adaptive Multi-module' },
  { id: 'wipro_nlth', name: 'Wipro NLTH', duration: '60 mins', sections: 'Aptitude & Coding' },
  { id: 'cognizant_genc', name: 'Cognizant GenC', duration: '60 mins', sections: 'Aptitude & Logical' },
]

export default function DriveSetupPage() {
  const navigate = useNavigate()
  const [startDrive, { isLoading }] = useCreateInterviewSessionMutation()
  const [selectedDrive, setSelectedDrive] = useState(null)
  const [error, setError] = useState(null)

  const handleStart = async () => {
    if (!selectedDrive) return
    setError(null)
    
    try {
      const result = await startDrive({
        type: 'placement_drive',
        driveType: selectedDrive,
        role: 'Fresher'
      }).unwrap()
      
      navigate(`/interview/drive/${result.session._id}`)
    } catch (err) {
      setError(err.data?.message || 'Failed to start drive simulation.')
    }
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <button className="btn btn-ghost" onClick={() => navigate('/interview')} style={{ marginBottom: '2rem' }}>
        ← Back to Interviews
      </button>

      <div>
        <h1 className="gradient-text" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Company Mock Drives</h1>
        <p className="text-muted">Simulate actual placement patterns of top IT companies.</p>
      </div>

      {error && <div className="server-error" style={{ marginTop: '1.5rem' }}>{error}</div>}

      <div className="drive-grid">
        {COMPANIES.map(company => (
          <div 
            key={company.id}
            className={`drive-card glass-card ${selectedDrive === company.id ? 'selected' : ''}`}
            onClick={() => setSelectedDrive(company.id)}
          >
            <h3 style={{ fontSize: '1.25rem' }}>{company.name}</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                <span className="text-muted">Duration:</span>
                <span style={{ fontWeight: 500 }}>{company.duration}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                <span className="text-muted">Sections:</span>
                <span style={{ fontWeight: 500, textAlign: 'right' }}>{company.sections}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'center' }}>
        <button 
          className="btn btn-primary" 
          style={{ padding: '1rem 3rem', fontSize: '1.125rem' }}
          disabled={!selectedDrive || isLoading}
          onClick={handleStart}
        >
          {isLoading ? <div className="spinner" /> : 'Start Mock Drive'}
        </button>
      </div>
    </div>
  )
}
