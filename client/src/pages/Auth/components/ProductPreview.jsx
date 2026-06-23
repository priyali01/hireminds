import { motion } from 'framer-motion'
import { FileText, Mic, Briefcase, Trophy } from 'lucide-react'

export default function ProductPreview() {
  const pipelineSteps = [
    { icon: <FileText className="w-5 h-5 text-[#2DD4BF]" />, label: 'Resume' },
    { icon: <Mic className="w-5 h-5 text-[#2DD4BF]" />, label: 'Interview' },
    { icon: <Briefcase className="w-5 h-5 text-[#2DD4BF]" />, label: 'Jobs' },
    { icon: <Trophy className="w-5 h-5 text-[#2DD4BF]" />, label: 'Placement' }
  ]

  return (
    <div className="h-full w-full flex flex-col justify-center items-center relative overflow-hidden bg-[#070B0A] py-12">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#2DD4BF]/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#3B82F6]/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Container */}
      <div className="relative w-full max-w-2xl mx-auto flex flex-col items-center">
        
        {/* Title Section */}
        <div className="text-center mb-8 z-20">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block px-4 py-1.5 rounded-full border border-[#2DD4BF]/30 bg-[#2DD4BF]/10 text-[#2DD4BF] text-xs font-bold tracking-widest uppercase mb-6 shadow-[0_0_15px_rgba(45,212,191,0.2)]"
          >
            HireMinds Platform
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
            className="text-[42px] leading-tight font-extrabold text-white mb-4"
          >
            Master the Interview.<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2DD4BF] to-[#3B82F6] drop-shadow-[0_0_15px_rgba(45,212,191,0.4)]">
              Secure the Offer.
            </span>
          </motion.h2>
        </div>

        {/* Mascot / Robot Container */}
        <div className="relative w-full h-[400px] flex items-center justify-center mb-6">
          
          {/* Animated Platform Rings */}
          <div className="absolute bottom-[10px] w-[300px] h-16 border-2 border-[#2DD4BF]/40 rounded-[100%] shadow-[0_0_50px_rgba(45,212,191,0.4)] transform perspective-[600px] rotateX-[70deg] animate-pulse" />
          <div className="absolute bottom-[15px] w-[260px] h-14 border-2 border-[#2DD4BF]/80 rounded-[100%] shadow-[0_0_40px_rgba(45,212,191,0.8)] transform perspective-[600px] rotateX-[70deg] bg-[#2DD4BF]/10" />
          <div className="absolute bottom-[22px] w-[220px] h-12 border border-white/50 rounded-[100%] transform perspective-[600px] rotateX-[70deg] bg-white/5" />
          
          {/* 3D Generated Robot Image */}
          <motion.div 
            className="w-[300px] h-[300px] absolute bottom-[25px] z-10"
            style={{ perspective: 1000 }}
            animate={{ 
              y: [0, -20, 0],
              rotateZ: [-2, 2, -2],
              rotateY: [-15, 15, -15],
              scale: [1, 1.02, 1]
            }} 
            transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
          >
            <img 
              src="/robot.png" 
              alt="AI Career Coach Robot Center" 
              className="w-full h-full object-contain" 
              style={{ 
                mixBlendMode: 'screen',
                filter: 'drop-shadow(0 0 20px rgba(45,212,191,0.6))',
                WebkitMaskImage: 'radial-gradient(circle at center, black 50%, transparent 80%)', 
                maskImage: 'radial-gradient(circle at center, black 50%, transparent 80%)' 
              }}
            />
          </motion.div>

          {/* Floating particles */}
          <div className="absolute top-[20%] left-[20%] w-2 h-2 rounded-full bg-[#2DD4BF] animate-ping" />
          <div className="absolute top-[40%] right-[20%] w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" style={{ animationDelay: '1s' }} />
        </div>

        {/* Bottom Minimal Pipeline */}
        <div className="flex gap-4 z-20 mt-4">
          {pipelineSteps.map((step, idx) => (
            <div key={idx} className="flex items-center gap-3 bg-[#0B1110]/80 backdrop-blur-md border border-white/10 px-5 py-3 rounded-2xl shadow-lg">
              <div className="w-8 h-8 rounded-full bg-[#2DD4BF]/10 flex items-center justify-center">
                {step.icon}
              </div>
              <span className="text-sm font-semibold text-slate-200">{step.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}