import { motion } from 'framer-motion'

export default function Sparkline({ color, delay = 0, pathData }) {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  return (
    <div className="w-16 h-8 flex items-center">
      <svg viewBox="0 0 100 30" className="w-full h-full overflow-visible">
        <motion.path
          d={pathData || "M0 25 L20 20 L40 28 L60 15 L80 18 L100 5"}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: prefersReduced ? 1 : 0, opacity: prefersReduced ? 1 : 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{
            duration: prefersReduced ? 0.01 : 1.2,
            ease: "easeInOut",
            delay: prefersReduced ? 0 : delay
          }}
          style={{ filter: `drop-shadow(0px 2px 4px ${color}40)` }}
        />
      </svg>
    </div>
  )
}
