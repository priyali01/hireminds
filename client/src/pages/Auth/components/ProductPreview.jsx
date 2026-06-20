import { motion } from 'framer-motion'
import { FileText, Mic, Briefcase, TrendingUp, Sparkles, Target, ShieldCheck } from 'lucide-react'
import MetricCard from './MetricCard'
import CommandCenter from './CommandCenter'
import Testimonial from './Testimonial'

export default function ProductPreview() {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const metrics = [
    {
      icon: FileText,
      score: "84",
      scoreSuffix: "/100",
      title: "ATS Score",
      label: "Great Progress! 🎉",
      trendColor: "#a855f7",
      sparklineDelay: 0.6,
      pathData: "M0 25 L20 20 L40 28 L60 15 L80 18 L100 5",
      glowColor: "rgba(168,85,247,0.3)"
    },
    {
      icon: Mic,
      score: "92",
      scoreSuffix: "/100",
      title: "Interview Score",
      label: "Excellent! 🔥",
      trendColor: "#3b82f6",
      sparklineDelay: 0.75,
      pathData: "M0 20 L20 22 L40 18 L60 10 L80 12 L100 4",
      glowColor: "rgba(59,130,246,0.3)"
    },
    {
      icon: Briefcase,
      score: "76",
      scoreSuffix: "/100",
      title: "Job Match",
      label: "Good Match 👍",
      trendColor: "#22c55e",
      sparklineDelay: 0.9,
      pathData: "M0 15 L20 18 L40 14 L60 20 L80 10 L100 12",
      glowColor: "rgba(34,197,94,0.3)"
    },
    {
      icon: TrendingUp,
      score: "12",
      scoreSuffix: "",
      title: "Skills Improved",
      label: "Keep it up! 🚀",
      trendColor: "#ec4899",
      sparklineDelay: 1.05,
      pathData: "M0 28 L20 22 L40 24 L60 16 L80 18 L100 8",
      glowColor: "rgba(236,72,153,0.3)"
    }
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: prefersReduced ? 0 : 0.08,
        delayChildren: prefersReduced ? 0 : 0.2
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: prefersReduced ? 0 : 20 },
    show: { opacity: 1, y: 0, transition: { duration: prefersReduced ? 0.01 : 0.45 } }
  }

  return (
    <div className="relative w-full flex flex-col justify-center items-center mx-auto z-10 py-12 px-4">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="w-full flex flex-col items-center text-center"
      >

        {/* Pill Badge */}
        <motion.div
          variants={itemVariants}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#4c1d95]/20 border border-[#4c1d95]/40 text-slate-300 text-xs font-medium backdrop-blur-md mb-5"
        >
          <div className="w-3 h-3 rounded-full bg-[#a855f7] flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-white rounded-full" />
          </div>
          <span>AI-Powered • Student-Focused • Results-Driven</span>
        </motion.div>

        {/* Hero Text */}
        <motion.h1
          variants={itemVariants}
          className="text-4xl lg:text-[2.75rem] font-bold tracking-tight leading-tight mb-3"
        >
          <span className="text-white">Improve. </span>
          <span className="text-[#3b82f6]">Practice. </span>
          <span className="text-[#d946ef]">Get Hired.</span>
        </motion.h1>

        <motion.p
          variants={itemVariants}
          className="text-slate-400 text-sm lg:text-[0.95rem] leading-relaxed max-w-md mb-8"
        >
          Level-aware ATS scoring, smart feedback, and AI mock interviews — everything in one place.
        </motion.p>

        {/* 4 Metric Cards */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full mb-4"
        >
          {metrics.map((m, i) => (
            <motion.div key={i} variants={itemVariants}>
              <MetricCard {...m} />
            </motion.div>
          ))}
        </motion.div>

        {/* Divider */}
        <motion.div
          variants={itemVariants}
          className="w-full h-px bg-white/[0.05] mb-4"
        />

        {/* Command Center */}
        <motion.div variants={itemVariants} className="w-full mb-4">
          <CommandCenter />
        </motion.div>

        {/* Divider */}
        <motion.div
          variants={itemVariants}
          className="w-full h-px bg-white/[0.05] mb-4"
        />

        {/* Testimonial */}
        <motion.div variants={itemVariants} className="w-full mb-6">
          <Testimonial />
        </motion.div>

        {/* Bottom Strip */}
        <motion.div
          variants={itemVariants}
          className="flex flex-wrap justify-center gap-3"
        >
          {[
            { icon: Sparkles, color: '#a855f7', label: 'AI-Powered Insights' },
            { icon: Target, color: '#a855f7', label: 'Level-Aware Scoring' },
            { icon: TrendingUp, color: '#3b82f6', label: 'Personalized Roadmaps' },
            { icon: ShieldCheck, color: '#ec4899', label: 'Privacy First' },
          ].map(({ icon: Icon, color, label }) => (
            <div
              key={label}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs text-slate-400 backdrop-blur-sm"
            >
              <Icon className="w-3.5 h-3.5 shrink-0" style={{ color }} />
              {label}
            </div>
          ))}
        </motion.div>

      </motion.div>
    </div>
  )
}