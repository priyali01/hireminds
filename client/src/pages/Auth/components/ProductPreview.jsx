import { motion } from 'framer-motion'

function GlowingRobot() {
  return (
    <div className="relative w-[340px] h-[340px] flex flex-col items-center justify-center mx-auto mb-12 z-10">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-[#2DD4BF]/20 blur-[100px] rounded-full pointer-events-none" />
      
      {/* Platform Rings */}
      <div className="absolute bottom-0 w-[340px] h-20 border-[3px] border-[#2DD4BF]/40 rounded-[100%] shadow-[0_0_30px_rgba(45,212,191,0.5)] transform perspective-[600px] rotateX-[70deg]" />
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
          alt="AI Career Coach Robot" 
          className="w-full h-full object-contain" 
          style={{ 
            mixBlendMode: 'screen', // Perfectly removes solid black background
            filter: 'drop-shadow(0 0 20px rgba(45,212,191,0.6))',
            WebkitMaskImage: 'radial-gradient(circle at center, black 50%, transparent 80%)', 
            maskImage: 'radial-gradient(circle at center, black 50%, transparent 80%)' 
          }}
        />
      </motion.div>

      {/* Floating particles */}
      <div className="absolute top-[10%] left-[5%] w-1.5 h-1.5 bg-[#2DD4BF] rounded-full animate-pulse blur-[1px]" />
      <div className="absolute top-[30%] right-[10%] w-1 h-1 bg-white rounded-full animate-pulse blur-[1px]" />
      <div className="absolute bottom-[50%] left-[15%] w-1.5 h-1.5 bg-[#14B8A6] rounded-full animate-pulse blur-[1px]" />
      <div className="absolute bottom-[40%] right-[20%] w-1 h-1 bg-[#2DD4BF] rounded-full animate-pulse blur-[1px]" />
    </div>
  )
}

function PipelineStep({ icon, title, desc, isActive }) {
  return (
    <div className="flex flex-col items-center text-center relative z-10 px-2">
      <div className={`w-12 h-12 rounded-full border-2 bg-[#0B1110] flex items-center justify-center mb-3 relative z-20 ${isActive ? 'border-[#2DD4BF] shadow-[0_0_15px_rgba(45,212,191,0.5)]' : 'border-white/10'}`}>
        <span className="text-xl" style={{ filter: isActive ? 'drop-shadow(0 0 5px #2DD4BF)' : 'none', opacity: isActive ? 1 : 0.5 }}>{icon}</span>
      </div>
      <h4 className="text-[13px] font-bold text-white mb-0.5" style={{ opacity: isActive ? 1 : 0.7 }}>{title}</h4>
      <p className="text-[11px] text-[#94A3B8] leading-tight">{desc}</p>
    </div>
  )
}

export default function ProductPreview() {
  return (
    <div className="w-full h-full flex flex-col justify-center items-center max-w-[800px] mx-auto py-8 relative z-10">
      
      {/* Centered Content Wrapper to prevent cut-offs */}
      <div className="flex flex-col items-center w-full">
        {/* Header - Improved Slogan */}
        <div className="mb-6 text-center">
          <h2 className="text-[3.25rem] font-bold text-white leading-[1.1] mb-4 tracking-tight">
            Master the Interview.<br />
            <span className="text-[#2DD4BF] drop-shadow-[0_0_15px_rgba(45,212,191,0.2)]">Secure the Offer.</span>
          </h2>
          <p className="text-[#94A3B8] text-[1.05rem] max-w-md mx-auto">
            Your personal AI career coach, guiding you from resume to placement.
          </p>
        </div>

        {/* Robot Showcase */}
        <GlowingRobot />

        {/* Minimal Pipeline Container */}
        <div className="relative max-w-[600px] mx-auto w-full mb-8">
          {/* Connecting Line */}
          <div className="absolute top-[24px] left-[10%] right-[10%] h-[1px] bg-gradient-to-r from-[#2DD4BF] to-white/10 z-0" />
          
          <div className="flex justify-between relative z-10">
            <PipelineStep icon="📄" title="Resume" desc="Analyze" isActive={true} />
            <PipelineStep icon="🎤" title="Interview" desc="Practice" isActive={false} />
            <PipelineStep icon="💼" title="Jobs" desc="Match" isActive={false} />
            <PipelineStep icon="🏆" title="Placement" desc="Achieve" isActive={false} />
          </div>
        </div>
      </div>

      {/* Minimal Footer */}
      <div className="text-center mt-auto text-[11px] text-[#94A3B8]/60">
        © 2025 HireMinds. All rights reserved.
      </div>
    </div>
  )
}