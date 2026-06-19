import { motion } from 'framer-motion'
import Sparkline from './Sparkline'

export default function MetricCard({ icon: Icon, score, scoreSuffix, title, label, trendColor, sparklineDelay, pathData, glowColor }) {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  return (
    <motion.div
      whileHover={{ 
        scale: prefersReduced ? 1 : 1.02,
        boxShadow: `0 0 20px ${glowColor}`
      }}
      transition={{ duration: prefersReduced ? 0.01 : 0.2 }}
      className="bg-white/[0.02] backdrop-blur-[12px] border border-white/[0.05] rounded-3xl p-5 flex flex-col justify-between relative overflow-hidden group shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
    >
      {/* Top glowing line */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-[2px] rounded-full blur-[1px] opacity-60 transition-opacity group-hover:opacity-100"
        style={{ backgroundColor: trendColor, boxShadow: `0 0 10px ${trendColor}` }}
      ></div>

      <div className="flex flex-col items-center text-center mb-6 mt-2">
        <div 
          className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
          style={{ backgroundColor: `${trendColor}20`, border: `1px solid ${trendColor}40` }}
        >
          <Icon className="w-5 h-5" style={{ color: trendColor }} />
        </div>
        <div>
          <div className="text-3xl font-bold text-white mb-1 flex items-baseline justify-center">
            {score}
            {scoreSuffix && <span className="text-sm text-slate-400 font-medium ml-0.5">{scoreSuffix}</span>}
          </div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-300">{title}</div>
        </div>
      </div>
      
      <div className="flex flex-col items-center gap-2">
        <p className="text-[11px] font-medium" style={{ color: trendColor }}>{label}</p>
        <Sparkline color={trendColor} delay={sparklineDelay} pathData={pathData} />
      </div>
    </motion.div>
  )
}
