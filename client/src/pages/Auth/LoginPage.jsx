import { motion } from 'framer-motion'
import LoginForm from './components/LoginForm'
import ProductPreview from './components/ProductPreview'

export default function LoginPage() {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  return (
    <div className="bg-[#060611] text-slate-200 font-sans flex flex-row relative overflow-hidden"
      style={{ minHeight: '100dvh' }}
    >

      {/* Background blobs */}
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-[#6366f1]/20 rounded-full blur-[120px] pointer-events-none -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-[#a855f7]/15 rounded-full blur-[150px] pointer-events-none translate-x-1/3 translate-y-1/3" />
      <div className="absolute top-1/2 left-[30%] w-[400px] h-[400px] bg-[#ec4899]/10 rounded-full blur-[100px] pointer-events-none -translate-y-1/2" />

      {/* LEFT PANEL */}
      <motion.div
        initial={{ x: prefersReduced ? 0 : -40, opacity: prefersReduced ? 1 : 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: prefersReduced ? 0.01 : 0.6, ease: 'easeOut' }}
        className="relative z-20 w-[500px] shrink-0 border-r border-white/[0.05] flex items-center justify-center px-8 py-10"
        style={{
          minHeight: '100dvh',
          backdropFilter: 'blur(4px)',
          background: 'linear-gradient(180deg, rgba(99,102,241,0.03) 0%, transparent 60%)',
        }}
      >
        <div className="w-full">
          <LoginForm />
        </div>
      </motion.div>

      {/* RIGHT PANEL */}
      <motion.div
        initial={{ x: prefersReduced ? 0 : 40, opacity: prefersReduced ? 1 : 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: prefersReduced ? 0.01 : 0.6, ease: 'easeOut', delay: prefersReduced ? 0 : 0.15 }}
        className="relative z-20 flex-1 flex items-center justify-center px-10 py-12 overflow-y-auto"
        style={{ minHeight: '100dvh' }}
      >
        <div className="w-full max-w-3xl">
          <ProductPreview />
        </div>
      </motion.div>

    </div>
  )
}