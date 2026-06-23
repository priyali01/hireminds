import { useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { selectCurrentUser } from '../store/authSlice'
import { useGetResumeHistoryQuery } from '../store/api'
import { motion } from 'framer-motion'
import DashboardCalendarWidget from '../components/DashboardCalendarWidget'
import '../styles/dashboard.css'

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

const CircularProgress = ({ percentage, size = 120, strokeWidth = 10, title, subtitle }) => {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - ((percentage || 0) / 100) * circumference

  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--color-surface-2)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--color-primary)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
      </svg>
      <div style={{ position: 'absolute', textAlign: 'center' }}>
        <div style={{ fontSize: size > 100 ? '1.75rem' : '1.25rem', fontWeight: 800 }}>{percentage || 0}%</div>
        {title && <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</div>}
        {subtitle && <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>{subtitle}</div>}
      </div>
    </div>
  )
}

function MiniStatList({ icon, label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.35rem', borderRadius: '50%', color: 'var(--color-primary-light)' }}>{icon}</div>
        <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{label}</span>
      </div>
      <span style={{ fontWeight: 600, color: 'var(--color-primary-light)' }}>{value}</span>
    </div>
  )
}

function StatCard({ title, value, subtitle, icon, trend }) {
  return (
    <motion.div variants={itemVariants} whileHover={{ y: -5 }} className="glass-card" style={{ padding: '1.5rem', borderRadius: '1rem', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: '50%', color: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
        <h3 style={{ fontSize: '0.875rem', margin: 0, fontWeight: 500, color: 'var(--color-text-muted)' }}>{title}</h3>
      </div>
      <div style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 0.25rem 0' }}>{value}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-faint)' }}>{subtitle}</span>
        {trend && <span style={{ color: 'var(--color-primary)', fontSize: '1rem' }}>{trend}</span>}
      </div>
    </motion.div>
  )
}

export default function DashboardPage() {
  const user = useSelector(selectCurrentUser)
  const navigate = useNavigate()
  const { data: historyData } = useGetResumeHistoryQuery()

  const latestResume = historyData?.resumes?.[0]
  const latestScore = latestResume?.atsScore?.overall || 0

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <motion.div className="dashboard-page" initial="hidden" animate="show" variants={containerVariants}>
      <div className="dashboard-layout" style={{ maxWidth: '1200px' }}>
        
        {/* HERO SECTION */}
        <motion.div variants={itemVariants} className="glass-card" style={{ padding: '2.5rem', borderRadius: '1.5rem', display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'center', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(10, 20, 18, 0.8) 100%)' }}>
          <div style={{ flex: '1 1 400px' }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{greeting()}, <span className="gradient-text">{user?.fullName?.split(' ')[0] || 'Guest'} 👋</span></h1>
            <p style={{ fontSize: '1.125rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
              You're <strong style={{ color: 'var(--color-primary-light)' }}>{latestScore}%</strong> interview-ready.
            </p>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-faint)', marginBottom: '2rem', maxWidth: '400px' }}>
              Complete your ATS analysis to unlock 23 personalized frontend opportunities.
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn btn-primary" onClick={() => navigate('/resume')} style={{ padding: '0.75rem 1.5rem' }}>📄 Analyze Resume</button>
              <button className="btn" style={{ background: 'transparent', border: '1px solid var(--color-border)', padding: '0.75rem 1.5rem' }} onClick={() => navigate('/interview')}>🎤 Start AI Interview</button>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '3rem', flexWrap: 'wrap' }}>
            <CircularProgress percentage={latestScore} size={160} strokeWidth={12} title="Interview" subtitle="Readiness" />
            
            <div style={{ minWidth: '200px' }}>
              <MiniStatList icon="🎯" label="ATS Score" value={`${latestScore}/100`} />
              <MiniStatList icon="🎤" label="Interviews" value={user?.metrics?.interviews || 12} />
              <MiniStatList icon="💼" label="Job Matches" value="23" />
              <MiniStatList icon="📈" label="Skills Improved" value="12" />
            </div>
          </div>
        </motion.div>

        {/* QUICK STATS GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
          <StatCard title="ATS Score" value={`${latestScore}/100`} subtitle="Great progress! 🎉" icon="🎯" trend="📈" />
          <StatCard title="Job Matches" value="23" subtitle="New matches available" icon="💼" trend="📈" />
          <StatCard title="Interview Score" value="92/100" subtitle="Excellent! 🔥" icon="🎤" trend="📈" />
          <StatCard title="Skills Improved" value="12" subtitle="Keep it up! 💪" icon="📈" trend="📈" />
        </div>

        {/* MIDDLE 3-COLUMN GRID */}
        <motion.div variants={containerVariants} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          
          {/* AI Career Coach */}
          <motion.div variants={itemVariants} className="glass-card" style={{ padding: '1.5rem', borderRadius: '1rem', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: 'var(--color-primary-light)' }}>🤖</span>
                <h3 style={{ margin: 0, fontSize: '1rem' }}>AI Career Coach</h3>
              </div>
              <span className="badge badge-primary" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-primary-light)' }}>New</span>
            </div>
            
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1rem', lineHeight: 1.6 }}>
              Your resume is missing some in-demand skills for Frontend Developer roles.
            </p>
            <ul style={{ paddingLeft: '1.5rem', fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <li>TypeScript</li>
              <li>Next.js</li>
              <li>Jest</li>
              <li>Tailwind CSS</li>
            </ul>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
              Adding these skills can increase your match score by <strong style={{ color: 'var(--color-primary-light)' }}>14%</strong>.
            </p>
            <button className="btn" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-primary)', width: '100%', marginTop: 'auto', border: '1px solid rgba(16, 185, 129, 0.2)' }} onClick={() => navigate('/resume')}>✨ Improve My Resume</button>
          </motion.div>

          {/* Resume Health */}
          <motion.div variants={itemVariants} className="glass-card" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
            <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1rem' }}>Resume Health</h3>
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
              <CircularProgress percentage={latestScore || 84} size={100} strokeWidth={8} title="Overall" />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem' }}><span>ATS Score</span><span>84/100</span></div>
                  <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}><div style={{ width: '84%', height: '100%', background: 'var(--color-primary)' }}></div></div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem' }}><span>Projects</span><span>90/100</span></div>
                  <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}><div style={{ width: '90%', height: '100%', background: 'var(--color-primary)' }}></div></div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem' }}><span>Skills</span><span>75/100</span></div>
                  <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}><div style={{ width: '75%', height: '100%', background: 'var(--color-primary)' }}></div></div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem' }}><span>Experience</span><span>82/100</span></div>
                  <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}><div style={{ width: '82%', height: '100%', background: 'var(--color-primary)' }}></div></div>
                </div>
              </div>
            </div>
            <button className="btn btn-ghost" style={{ width: '100%', marginTop: '1.5rem', border: '1px solid rgba(255,255,255,0.05)' }} onClick={() => navigate('/resume')}>📈 View Full Analysis</button>
          </motion.div>

          {/* Recommended Jobs */}
          <motion.div variants={itemVariants} className="glass-card" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1rem' }}>Recommended Jobs</h3>
              <span style={{ fontSize: '0.875rem', color: 'var(--color-primary-light)', cursor: 'pointer' }} onClick={() => navigate('/jobs')}>View all</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { role: 'Frontend Developer Intern', company: 'Google', location: 'Bangalore, India', match: 87, icon: 'G', color: '#ea4335' },
                { role: 'React Developer', company: 'Microsoft', location: 'Remote', match: 82, icon: 'M', color: '#00a4ef' },
                { role: 'Frontend Engineer', company: 'Swiggy', location: 'Bangalore, India', match: 78, icon: 'S', color: '#fc8019' }
              ].map((job, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.5rem 0', borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--color-surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: job.color }}>{job.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{job.role}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{job.company} • {job.location}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-primary-light)', fontWeight: 600 }}>{job.match}% Match</span>
                    <span style={{ color: 'var(--color-text-muted)', cursor: 'pointer' }}>🔖</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>

        {/* BOTTOM 2-COLUMN GRID */}
        <motion.div variants={containerVariants} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
          
          <DashboardCalendarWidget />

          <motion.div variants={itemVariants} className="glass-card" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1rem' }}>Recent Activity</h3>
              <span style={{ fontSize: '0.875rem', color: 'var(--color-primary-light)', cursor: 'pointer' }} onClick={() => navigate('/resume')}>View all</span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {historyData?.resumes?.slice(0,1).map(r => (
                <div key={r._id} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '50%', color: 'var(--color-text-muted)' }}>📄</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>Resume analyzed</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Your resume scored {r.atsScore?.overall || 0} out of 100</div>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-faint)' }}>{new Date(r.createdAt).toLocaleDateString('en-IN')}</span>
                </div>
              ))}
              
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '50%', color: 'var(--color-text-muted)' }}>💼</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>New job matches found</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>We found 23 new jobs for you</div>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-faint)' }}>5h ago</span>
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '50%', color: 'var(--color-text-muted)' }}>🎤</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>Mock interview completed</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Great job! You scored 92 out of 100</div>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-faint)' }}>1d ago</span>
              </div>
            </div>
          </motion.div>
        </motion.div>

      </div>
    </motion.div>
  )
}
