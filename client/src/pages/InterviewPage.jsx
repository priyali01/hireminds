import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useGetInterviewHistoryQuery } from '../store/api'
import '../styles/dashboard.css' 

// Premium animation variants
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

const pulseVariants = {
  animate: {
    scale: [1, 1.05, 1],
    opacity: [0.6, 1, 0.6],
    transition: { duration: 3, repeat: Infinity, ease: "easeInOut" }
  }
}

function RadialProgress({ score }) {
  const radius = 55;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div style={{ position: 'relative', width: '150px', height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div 
        variants={pulseVariants} animate="animate"
        style={{ position: 'absolute', width: '120%', height: '120%', background: 'radial-gradient(circle, rgba(16, 185, 129, 0.2) 0%, transparent 60%)', zIndex: 0 }} 
      />
      <svg width="150" height="150" style={{ transform: 'rotate(-90deg)', zIndex: 1 }}>
        <circle cx="75" cy="75" r={radius} fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
        <motion.circle 
          cx="75" cy="75" r={radius} fill="transparent" stroke="var(--color-primary-light)" strokeWidth="8"
          strokeDasharray={circumference} 
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
          strokeLinecap="round" style={{ filter: 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.6))' }}
        />
      </svg>
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
        style={{ position: 'absolute', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
      >
        <span style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-primary-light)', lineHeight: 1 }}>{score}%</span>
        <span style={{ fontSize: '0.625rem', color: '#fff', margin: '0.25rem 0' }}>Interview Readiness</span>
        <span style={{ fontSize: '0.625rem', color: 'var(--color-primary-light)' }}>↑ 12%</span>
        <span style={{ fontSize: '0.5rem', color: 'var(--color-text-faint)' }}>vs last month</span>
      </motion.div>
    </div>
  )
}

function Sparkline({ color }) {
  return (
    <div style={{ width: '100%', height: '40px', marginTop: '1rem', position: 'relative' }}>
      <svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 100 40">
        <defs>
          <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <motion.path 
          d="M0,30 L20,25 L40,35 L60,15 L80,20 L100,5 L100,40 L0,40 Z" fill={`url(#grad-${color})`} 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 1 }}
        />
        <motion.path 
          d="M0,30 L20,25 L40,35 L60,15 L80,20 L100,5" fill="none" stroke={color} strokeWidth="2" style={{ filter: `drop-shadow(0px 2px 4px ${color})` }} 
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeInOut", delay: 0.2 }}
        />
        <motion.circle cx="20" cy="25" r="2" fill={color} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5 }} />
        <motion.circle cx="40" cy="35" r="2" fill={color} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.7 }} />
        <motion.circle cx="60" cy="15" r="2" fill={color} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.9 }} />
        <motion.circle cx="80" cy="20" r="2" fill={color} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.1 }} />
        <motion.circle cx="100" cy="5" r="2" fill={color} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.3 }} />
      </svg>
    </div>
  )
}

function StatCard({ icon, title, value, unit, trend, trendColor, sparklineColor, subtext }) {
  return (
    <motion.div variants={itemVariants} className="glass-card" style={{ padding: '1.25rem 1.5rem', borderRadius: '1rem', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <span style={{ width: '24px', height: '24px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem' }}>{icon}</span>
        <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{title}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
        <h3 style={{ fontSize: '2rem', margin: 0, fontWeight: 700 }}>{value}</h3>
        {unit && <span style={{ fontSize: '0.875rem', color: 'var(--color-text-faint)' }}>{unit}</span>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.5rem', fontSize: '0.75rem' }}>
        <span style={{ color: trendColor, fontWeight: 600 }}>{trend}</span>
        <span style={{ color: 'var(--color-text-faint)' }}>{subtext}</span>
      </div>
      <Sparkline color={sparklineColor} />
    </motion.div>
  )
}

function InterviewTypeCard({ icon, title, items, duration, onClick }) {
  return (
    <motion.div variants={itemVariants} whileHover={{ y: -5, boxShadow: '0 10px 30px -10px rgba(16, 185, 129, 0.2)' }} className="glass-card card-hover" onClick={onClick} style={{ padding: '1.5rem', borderRadius: '1rem', cursor: 'pointer', display: 'flex', flexDirection: 'column' }}>
      <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', marginBottom: '1rem' }}>
        {icon}
      </div>
      <h3 style={{ fontSize: '1.125rem', margin: '0 0 1rem 0', fontWeight: 600 }}>{title}</h3>
      <ul style={{ margin: '0 0 1.5rem 0', paddingLeft: '1.25rem', color: 'var(--color-text-muted)', fontSize: '0.8125rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {items.map(item => <li key={item}>{item}</li>)}
      </ul>
      <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-faint)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          ⏱️ {duration}
        </span>
        <button style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--color-primary-light)', padding: '0.25rem 1rem', borderRadius: '0.5rem', fontSize: '0.8125rem', fontWeight: 500, transition: 'all 0.3s ease' }} className="btn-hover-solid">
          Start
        </button>
      </div>
    </motion.div>
  )
}

function SkillBar({ label, score, color }) {
  return (
    <motion.div variants={itemVariants} style={{ display: 'grid', gridTemplateColumns: '150px 1fr 40px', alignItems: 'center', gap: '1rem', fontSize: '0.8125rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ color }}>{"</>"}</span>
        <span>{label}</span>
      </div>
      <div style={{ height: '4px', width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
        <motion.div 
          initial={{ width: 0 }}
          whileInView={{ width: `${score}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
          style={{ height: '100%', background: color, borderRadius: '2px', boxShadow: `0 0 8px ${color}` }} 
        />
      </div>
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 1 }} style={{ textAlign: 'right' }}>{score}%</motion.div>
    </motion.div>
  )
}

function RobotIllustration() {
  return (
    <div style={{ position: 'relative', width: '180px', height: '180px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* Base glow */}
      <motion.div variants={pulseVariants} animate="animate" style={{ position: 'absolute', bottom: 10, width: '100px', height: '20px', background: 'radial-gradient(ellipse, rgba(16, 185, 129, 0.6) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(4px)' }} />
      {/* Stars */}
      <motion.div animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }} transition={{ duration: 2, repeat: Infinity }} style={{ position: 'absolute', top: 20, left: 20, color: 'var(--color-primary-light)', fontSize: '0.5rem' }}>✦</motion.div>
      <motion.div animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }} transition={{ duration: 3, repeat: Infinity, delay: 0.5 }} style={{ position: 'absolute', top: 50, right: 20, color: 'var(--color-primary-light)', fontSize: '0.75rem' }}>✦</motion.div>
      <motion.div animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }} transition={{ duration: 2.5, repeat: Infinity, delay: 1 }} style={{ position: 'absolute', bottom: 40, left: 10, color: 'var(--color-primary-light)', fontSize: '0.5rem' }}>✦</motion.div>
      
      {/* Robot body with floating animation */}
      <motion.div 
        animate={{ y: [-5, 5, -5] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        style={{ width: '80px', height: '80px', background: 'linear-gradient(135deg, #1f2937, #111827)', borderRadius: '30px', position: 'relative', border: '2px solid rgba(16, 185, 129, 0.4)', boxShadow: '0 0 20px rgba(16, 185, 129, 0.2)' }}
      >
        {/* Antenna */}
        <div style={{ position: 'absolute', top: '-15px', left: '38px', width: '4px', height: '15px', background: 'var(--color-primary-light)' }} />
        <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }} style={{ position: 'absolute', top: '-20px', left: '35px', width: '10px', height: '10px', background: 'var(--color-primary-light)', borderRadius: '50%', boxShadow: '0 0 10px var(--color-primary-light)' }} />
        {/* Eyes */}
        <motion.div animate={{ scaleY: [1, 0.1, 1] }} transition={{ duration: 4, repeat: Infinity, times: [0, 0.1, 0.2] }} style={{ position: 'absolute', top: '30px', left: '15px', width: '20px', height: '8px', background: 'var(--color-primary-light)', borderRadius: '4px', boxShadow: '0 0 10px var(--color-primary-light)' }} />
        <motion.div animate={{ scaleY: [1, 0.1, 1] }} transition={{ duration: 4, repeat: Infinity, times: [0, 0.1, 0.2] }} style={{ position: 'absolute', top: '30px', right: '15px', width: '20px', height: '8px', background: 'var(--color-primary-light)', borderRadius: '4px', boxShadow: '0 0 10px var(--color-primary-light)' }} />
        {/* Smile */}
        <div style={{ position: 'absolute', bottom: '15px', left: '30px', width: '20px', height: '4px', background: 'rgba(16, 185, 129, 0.5)', borderRadius: '2px' }} />
      </motion.div>
    </div>
  )
}

export default function InterviewPage() {
  const { data, isLoading } = useGetInterviewHistoryQuery()
  const navigate = useNavigate()
  const sessions = data?.sessions || []

  return (
    <motion.div className="dashboard-page" style={{ padding: '2rem' }} initial="hidden" animate="show" variants={containerVariants}>
      <div className="dashboard-layout" style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* SECTION 1: HERO */}
        <motion.div variants={itemVariants} className="glass-card" style={{ padding: '2.5rem 3rem', borderRadius: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(10, 20, 18, 0.8) 100%)' }}>
          <div style={{ flex: 1, paddingRight: '4rem' }}>
            <motion.div variants={itemVariants} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.75rem', color: 'var(--color-primary-light)' }}>🎤</span>
              <h1 style={{ fontSize: '1.75rem', margin: 0, fontWeight: 700, letterSpacing: '0.02em' }}>AI Interview Center</h1>
            </motion.div>
            <motion.p variants={itemVariants} style={{ color: 'var(--color-text-muted)', marginBottom: '2rem', fontSize: '0.9375rem' }}>Practice, improve and ace your next interview with AI.</motion.p>
            
            <motion.div variants={itemVariants} whileHover={{ scale: 1.02 }} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '1rem', padding: '1.25rem', display: 'flex', gap: '1rem', marginBottom: '2rem', maxWidth: '600px', cursor: 'default' }}>
              <span style={{ color: 'var(--color-primary-light)', fontSize: '1.25rem', marginTop: '0.125rem' }}>✧</span>
              <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--color-text-muted)' }}>
                You are performing well in DSA and OOP.<br/>
                Focus on <span style={{ color: 'var(--color-primary-light)' }}>DBMS</span> and <span style={{ color: 'var(--color-primary-light)' }}>Operating Systems</span> to improve your placement readiness.
              </p>
            </motion.div>
            
            <motion.div variants={itemVariants} style={{ display: 'flex', gap: '1rem' }}>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="btn" onClick={() => navigate('/interview/setup')} style={{ background: 'var(--color-primary-light)', color: '#000', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)' }}>
                ▶ Start Mock Interview
              </motion.button>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="btn btn-ghost" onClick={() => navigate('/interview/drive/setup')} style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                🏢 Placement Drive Simulator
              </motion.button>
            </motion.div>
          </div>
          <motion.div variants={itemVariants} style={{ flexShrink: 0 }}>
            <RadialProgress score={78} />
          </motion.div>
        </motion.div>

        {/* SECTION 2: PERFORMANCE STATS */}
        <motion.div variants={containerVariants} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
          <StatCard icon="🎯" title="Overall Score" value="84" unit="/100" trend="↑ 8%" trendColor="var(--color-primary-light)" sparklineColor="#10b981" subtext="vs last month" />
          <StatCard icon="📅" title="Interviews Completed" value="12" unit="" trend="↑ 3" trendColor="var(--color-primary-light)" sparklineColor="#3b82f6" subtext="this week" />
          <StatCard icon="😊" title="Avg. Confidence" value="78%" unit="" trend="↑ 6%" trendColor="var(--color-primary-light)" sparklineColor="#10b981" subtext="vs last month" />
          <StatCard icon="🔥" title="Current Streak" value="5" unit="Days" trend="" trendColor="var(--color-text-muted)" sparklineColor="#f59e0b" subtext="Best: 12 Days" />
        </motion.div>

        {/* SECTION 3: INTERVIEW TYPES */}
        <motion.div variants={containerVariants}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Interview Types</h2>
            <span style={{ color: 'var(--color-primary-light)', fontSize: '0.875rem', cursor: 'pointer' }}>View all →</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
            <InterviewTypeCard 
              icon={<span style={{color: '#10b981'}}>{"</>"}</span>} title="Technical Interview" 
              items={['DSA', 'OOP', 'DBMS', 'Operating Systems', 'Computer Networks']} duration="45-60 mins" onClick={() => navigate('/interview/setup')}
            />
            <InterviewTypeCard 
              icon={<span style={{color: '#8b5cf6'}}>👥</span>} title="HR Interview" 
              items={['Behavioral Questions', 'Strengths & Weaknesses', 'Situational', 'Communication']} duration="30-45 mins" onClick={() => navigate('/interview/setup')}
            />
            <InterviewTypeCard 
              icon={<span style={{color: '#3b82f6'}}>📄</span>} title="Resume-Based" 
              items={['AI will generate questions based on your resume and experience.']} duration="30-45 mins" onClick={() => navigate('/interview/setup')}
            />
            <InterviewTypeCard 
              icon={<span style={{color: '#f59e0b'}}>🏢</span>} title="Company Specific" 
              items={['Google', 'Amazon', 'Microsoft', 'Barclays', 'and more...']} duration="45-60 mins" onClick={() => navigate('/interview/setup')}
            />
          </div>
        </motion.div>

        {/* SECTION 4 & 5: COACH & SKILLS */}
        <motion.div variants={containerVariants} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          
          <motion.div variants={itemVariants} className="glass-card" style={{ padding: '1.5rem', borderRadius: '1rem', display: 'flex' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '1.25rem', color: 'var(--color-primary-light)' }}>🤖</span>
                <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>AI Career Coach</h3>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>Insights from your last 3 interviews</p>
              
              <motion.ul variants={containerVariants} initial="hidden" whileInView="show" viewport={{ once: true }} style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.8125rem' }}>
                <motion.li variants={itemVariants} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}><span style={{ color: '#10b981' }}>✔</span> Excellent DSA performance</motion.li>
                <motion.li variants={itemVariants} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}><span style={{ color: '#10b981' }}>✔</span> Strong communication skills</motion.li>
                <motion.li variants={itemVariants} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}><span style={{ color: '#f59e0b' }}>⚠️</span> Weakness in DBMS concepts</motion.li>
                <motion.li variants={itemVariants} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}><span style={{ color: '#f59e0b' }}>⚠️</span> Need improvement in OS topics</motion.li>
              </motion.ul>
              
              <div style={{ marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Recommended next step</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Complete a DBMS-focused interview to strengthen your weak areas.</span>
              </div>
              
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="btn" onClick={() => navigate('/interview/setup')} style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-primary-light)', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontSize: '0.8125rem', fontWeight: 600, border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                Practice DBMS Interview →
              </motion.button>
            </div>
            <div style={{ width: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <RobotIllustration />
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="glass-card" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>Skill Breakdown</h3>
              <span style={{ color: 'var(--color-primary-light)', fontSize: '0.75rem', cursor: 'pointer' }}>View detailed report →</span>
            </div>
            <motion.div variants={containerVariants} initial="hidden" whileInView="show" viewport={{ once: true }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <SkillBar label="DSA" score={90} color="#10b981" />
              <SkillBar label="OOP" score={85} color="#3b82f6" />
              <SkillBar label="DBMS" score={65} color="#f59e0b" />
              <SkillBar label="Operating Systems" score={60} color="#f97316" />
              <SkillBar label="Computer Networks" score={75} color="#8b5cf6" />
              <SkillBar label="Communication" score={80} color="#10b981" />
            </motion.div>
          </motion.div>
          
        </motion.div>

        {/* SECTION 6 & 7: HISTORY & TREND */}
        <motion.div variants={containerVariants} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          
          <motion.div variants={itemVariants} className="glass-card" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>Interview History</h3>
              <span style={{ color: 'var(--color-primary-light)', fontSize: '0.75rem', cursor: 'pointer' }}>View all →</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 40px', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-faint)' }}>
              <div>Interview</div>
              <div>Date</div>
              <div>Score</div>
              <div>Feedback</div>
              <div>Replay</div>
            </div>
            
            <motion.div variants={containerVariants} initial="hidden" whileInView="show" viewport={{ once: true }} style={{ display: 'flex', flexDirection: 'column' }}>
              {[
                { title: 'Google Technical Round', sub: 'DSA + OOP', date: '23 Jun 2024', score: '87', feedback: 'Great', fcolor: '#10b981' },
                { title: 'HR Interview', sub: 'Behavioral Round', date: '20 Jun 2024', score: '76', feedback: 'Good', fcolor: '#f59e0b' },
                { title: 'Resume Review Interview', sub: 'Experience Based', date: '18 Jun 2024', score: '91', feedback: 'Excellent', fcolor: '#10b981' },
                { title: 'Amazon SDE Mock Drive', sub: 'Full Placement Drive', date: '15 Jun 2024', score: '82', feedback: 'Good', fcolor: '#f59e0b' },
                { title: 'DBMS Interview', sub: 'Technical Round', date: '12 Jun 2024', score: '68', feedback: 'Needs Work', fcolor: '#ef4444' }
              ].map((item, i) => (
                <motion.div variants={itemVariants} key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 40px', padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.02)', alignItems: 'center', fontSize: '0.75rem' }} className="table-row-hover">
                  <div>
                    <div style={{ fontWeight: 600 }}>{item.title}</div>
                    <div style={{ fontSize: '0.625rem', color: 'var(--color-text-muted)' }}>{item.sub}</div>
                  </div>
                  <div style={{ color: 'var(--color-text-muted)' }}>{item.date}</div>
                  <div><span style={{ fontWeight: 700 }}>{item.score}</span>/100</div>
                  <div><span style={{ background: `rgba(255,255,255,0.05)`, color: item.fcolor, padding: '0.125rem 0.5rem', borderRadius: '1rem', fontSize: '0.625rem', fontWeight: 600 }}>{item.feedback}</span></div>
                  <div style={{ textAlign: 'right' }}>
                    <motion.div whileHover={{ scale: 1.2, color: '#fff' }} style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary-light)', cursor: 'pointer' }}>▶</motion.div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          <motion.div variants={itemVariants} className="glass-card" style={{ padding: '1.5rem', borderRadius: '1rem', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>Score Trend</h3>
              <span style={{ color: 'var(--color-primary-light)', fontSize: '0.75rem', cursor: 'pointer' }}>View analytics →</span>
            </div>
            
            <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingBottom: '2rem' }}>
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: '2rem', width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                {[100, 75, 50, 25, 0].map(y => (
                  <div key={y} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.625rem', color: 'var(--color-text-faint)', width: '20px' }}>{y}</span>
                    <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.05)' }} />
                  </div>
                ))}
              </div>
              
              <div style={{ position: 'absolute', left: '28px', right: '20px', top: '10%', bottom: '2rem' }}>
                 <svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 100 100">
                    <motion.path 
                      d="M0,60 L25,50 L50,55 L75,35 L100,20" fill="none" stroke="var(--color-primary-light)" strokeWidth="1.5" 
                      initial={{ pathLength: 0, opacity: 0 }}
                      whileInView={{ pathLength: 1, opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 2, ease: "easeInOut", delay: 0.5 }}
                    />
                    {[
                      {cx: 0, cy: 60, val: 65, dl: 1}, {cx: 25, cy: 50, val: 72, dl: 1.2}, 
                      {cx: 50, cy: 55, val: 68, dl: 1.4}, {cx: 75, cy: 35, val: 80, dl: 1.6}, 
                      {cx: 100, cy: 20, val: 87, dl: 1.8}
                    ].map((pt, i) => (
                      <g key={i}>
                        <motion.circle 
                          cx={pt.cx} cy={pt.cy} r="3" fill="var(--color-primary-light)" 
                          initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ delay: pt.dl }}
                        />
                      </g>
                    ))}
                 </svg>
                 <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 1 }} style={{ position: 'absolute', left: '-5%', top: '50%', fontSize: '0.625rem' }}>65</motion.div>
                 <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 1.2 }} style={{ position: 'absolute', left: '23%', top: '40%', fontSize: '0.625rem' }}>72</motion.div>
                 <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 1.4 }} style={{ position: 'absolute', left: '48%', top: '45%', fontSize: '0.625rem' }}>68</motion.div>
                 <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 1.6 }} style={{ position: 'absolute', left: '73%', top: '25%', fontSize: '0.625rem' }}>80</motion.div>
                 <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 1.8 }} style={{ position: 'absolute', left: '98%', top: '10%', fontSize: '0.625rem' }}>87</motion.div>
              </div>
              
              <div style={{ position: 'absolute', bottom: 0, left: '28px', right: 0, display: 'flex', justifyContent: 'space-between', fontSize: '0.625rem', color: 'var(--color-text-faint)' }}>
                <span>28 May</span>
                <span>3 Jun</span>
                <span>10 Jun</span>
                <span>17 Jun</span>
                <span>24 Jun</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem', textAlign: 'center' }}>
              <div>
                <div style={{ fontSize: '1.125rem', color: 'var(--color-primary-light)', fontWeight: 600 }}>↑ 22%</div>
                <div style={{ fontSize: '0.625rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>Improvement</div>
              </div>
              <div>
                <div style={{ fontSize: '1.125rem', fontWeight: 600 }}>87<span style={{ fontSize: '0.75rem', color: 'var(--color-text-faint)' }}>/100</span></div>
                <div style={{ fontSize: '0.625rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>Highest Score</div>
              </div>
              <div>
                <div style={{ fontSize: '1.125rem', fontWeight: 600 }}>76<span style={{ fontSize: '0.75rem', color: 'var(--color-text-faint)' }}>/100</span></div>
                <div style={{ fontSize: '0.625rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>Average Score</div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* SECTION 8: PLACEMENT DRIVE */}
        <motion.div variants={itemVariants} className="glass-card" style={{ padding: '2rem 2.5rem', borderRadius: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '1.5rem', color: 'var(--color-primary-light)' }}>🚀</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>Placement Drive Simulator</h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Experience real placement drives with AI-powered simulations.</p>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
            
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ width: '48px', height: '48px', background: 'rgba(0,0,0,0.5)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                  <span style={{ color: '#f59e0b', fontWeight: 'bold', fontFamily: 'serif' }}>a</span>
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>Amazon</h4>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>SDE Internship Drive</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.75rem', textAlign: 'center' }}>
                <div><div style={{ color: 'var(--color-primary-light)', fontSize: '1rem', marginBottom: '0.25rem' }}>⏱️</div><div style={{ color: 'var(--color-text-muted)' }}>Difficulty</div><div style={{ fontWeight: 600 }}>Hard</div></div>
                <div><div style={{ color: 'var(--color-primary-light)', fontSize: '1rem', marginBottom: '0.25rem' }}>⏳</div><div style={{ color: 'var(--color-text-muted)' }}>Duration</div><div style={{ fontWeight: 600 }}>90 mins</div></div>
                <div><div style={{ color: 'var(--color-primary-light)', fontSize: '1rem', marginBottom: '0.25rem' }}>📋</div><div style={{ color: 'var(--color-text-muted)' }}>Rounds</div><div style={{ fontWeight: 600 }}>4</div></div>
                <div><div style={{ color: 'var(--color-primary-light)', fontSize: '1rem', marginBottom: '0.25rem' }}>👥</div><div style={{ color: 'var(--color-text-muted)' }}>Participants</div><div style={{ fontWeight: 600 }}>12,450+</div></div>
              </div>
            </div>

            <div style={{ flex: 2, padding: '0 2rem', borderLeft: '1px solid rgba(255,255,255,0.05)', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '1.5rem' }}>Rounds</div>
              <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <motion.div initial={{ width: 0 }} whileInView={{ width: '100%' }} viewport={{ once: true }} transition={{ duration: 1.5, ease: "easeOut" }} style={{ position: 'absolute', top: '16px', left: '20px', height: '2px', background: 'rgba(16, 185, 129, 0.3)', zIndex: 0 }} />
                
                {[
                  { num: 1, name: 'Aptitude', time: '15 mins' },
                  { num: 2, name: 'Coding', time: '45 mins' },
                  { num: 3, name: 'Technical', time: '20 mins' },
                  { num: 4, name: 'HR Round', time: '10 mins' }
                ].map((round, idx) => (
                  <motion.div key={idx} initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ delay: idx * 0.3 + 0.5 }} style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--color-bg)', border: '2px solid var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-primary-light)', marginBottom: '0.5rem' }}>
                      {round.num}
                    </div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 500 }}>{round.name}</div>
                    <div style={{ fontSize: '0.625rem', color: 'var(--color-text-muted)' }}>{round.time}</div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <motion.ul variants={containerVariants} initial="hidden" whileInView="show" viewport={{ once: true }} style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <motion.li variants={itemVariants}><span style={{ color: 'var(--color-primary-light)' }}>✔</span> Real company questions</motion.li>
                <motion.li variants={itemVariants}><span style={{ color: 'var(--color-primary-light)' }}>✔</span> Timed environment</motion.li>
                <motion.li variants={itemVariants}><span style={{ color: 'var(--color-primary-light)' }}>✔</span> AI evaluation & feedback</motion.li>
                <motion.li variants={itemVariants}><span style={{ color: 'var(--color-primary-light)' }}>✔</span> Detailed performance report</motion.li>
              </motion.ul>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="btn" onClick={() => navigate('/interview/drive/setup')} style={{ background: 'var(--color-primary-light)', color: '#000', padding: '0.75rem', borderRadius: '0.5rem', fontWeight: 600, fontSize: '0.875rem', width: '100%', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)' }}>
                Start Simulation →
              </motion.button>
            </div>

          </div>
        </motion.div>

      </div>
    </motion.div>
  )
}
