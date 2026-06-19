import { motion } from 'framer-motion'
import { LayoutDashboard, FileText, Mic, Briefcase, TrendingUp, LineChart, CheckCircle2, ChevronRight } from 'lucide-react'

export default function CommandCenter() {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const navItems = [
    { icon: LayoutDashboard, label: 'Overview', active: true },
    { icon: FileText, label: 'Resume Analysis' },
    { icon: Mic, label: 'Mock Interviews' },
    { icon: Briefcase, label: 'Job Tracker' },
    { icon: TrendingUp, label: 'Skill Roadmap' },
    { icon: LineChart, label: 'Insights' },
  ]

  const activities = [
    { icon: CheckCircle2, text: 'Resume analyzed', time: '2h ago', color: '#22c55e' },
    { icon: Mic, text: 'Mock interview completed', time: '5h ago', color: '#3b82f6' },
    { icon: Briefcase, text: 'New job matches found', time: '1d ago', color: '#10b981' },
    { icon: TrendingUp, text: 'Skills assessment updated', time: '2d ago', color: '#ec4899' },
  ]

  return (
    <div className="bg-[#0f0b29]/60 backdrop-blur-xl border border-white/[0.05] rounded-3xl p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
      <h3 className="text-white font-semibold text-sm mb-6 flex items-center">
        Your Career Command Center
      </h3>
      
      <div className="flex flex-col md:flex-row gap-6">
        {/* Left nav */}
        <div className="flex-1 space-y-1.5 border-r border-white/[0.05] pr-4">
          {navItems.map((item, i) => (
            <motion.div
              key={i}
              whileHover={!prefersReduced && !item.active ? {
                x: 3,
                backgroundColor: 'rgba(168,85,247,0.05)'
              } : {}}
              transition={{ duration: prefersReduced ? 0.01 : 0.15 }}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm cursor-pointer transition-colors ${
                item.active 
                  ? 'bg-gradient-to-r from-[#a855f7]/20 to-transparent border border-[#a855f7]/30 text-white shadow-[inset_2px_0_0_#a855f7]' 
                  : 'text-slate-400 border border-transparent hover:text-slate-300'
              }`}
            >
              <item.icon className={`w-4 h-4 ${item.active ? 'text-[#a855f7]' : 'text-slate-500'}`} />
              <span className="font-medium">{item.label}</span>
            </motion.div>
          ))}
        </div>

        {/* Center donut */}
        <div className="flex-1 flex flex-col items-center justify-center border-r border-white/[0.05] pr-4 relative">
          <div className="absolute top-0 left-0 text-xs font-medium text-slate-400 flex items-center gap-1.5">
            <span className="text-[#a855f7]">+</span> Resume Score
          </div>
          
          <div className="relative w-36 h-36 mt-4 mb-6">
            {/* Background ring */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="6"
              />
              {/* Animated foreground ring */}
              <motion.circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="url(#purpleGradient)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray="263.89"
                initial={{ strokeDashoffset: prefersReduced ? 263.89 * 0.16 : 263.89 }}
                animate={{ strokeDashoffset: 263.89 * 0.16 }} // 84% complete
                transition={{ duration: prefersReduced ? 0.01 : 1.5, ease: "easeOut", delay: prefersReduced ? 0 : 0.5 }}
                style={{ filter: 'drop-shadow(0 0 10px rgba(168,85,247,0.5))' }}
              />
              <defs>
                <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
              <div className="text-3xl font-bold text-white flex items-baseline">
                84<span className="text-sm text-slate-400 ml-0.5 font-medium">/100</span>
              </div>
            </div>
          </div>
          <div className="text-center w-full">
            <p className="text-xs text-slate-400 font-medium mb-3">You're doing great!</p>
            <button className="w-full bg-[#4c1d95]/40 hover:bg-[#4c1d95]/60 border border-[#a855f7]/30 text-xs font-semibold text-[#d8b4fe] py-2 rounded-xl transition-colors">
              Improve Resume
            </button>
          </div>
        </div>

        {/* Right activity */}
        <div className="flex-1 pl-2">
          <h4 className="text-xs font-medium text-slate-400 mb-6 flex items-center">Recent Activity</h4>
          <div className="space-y-5">
            {activities.map((act, i) => (
              <div key={i} className="flex gap-3 items-center">
                <div 
                  className="w-7 h-7 rounded-full flex items-center justify-center border"
                  style={{ backgroundColor: `${act.color}15`, borderColor: `${act.color}30` }}
                >
                  <act.icon className="w-3.5 h-3.5" style={{ color: act.color }} />
                </div>
                <div className="flex-1 flex justify-between items-center">
                  <p className="text-xs text-slate-300">{act.text}</p>
                  <p className="text-[10px] text-slate-500">{act.time}</p>
                </div>
              </div>
            ))}
          </div>
          
          <button className="mt-6 text-[11px] text-[#a855f7] hover:text-[#d8b4fe] font-medium flex items-center transition-colors">
            View all activity <ChevronRight className="w-3 h-3 ml-0.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
