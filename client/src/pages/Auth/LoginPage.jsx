import { motion } from 'framer-motion'
import LoginForm from './components/LoginForm'
import ProductPreview from './components/ProductPreview'

export default function LoginPage() {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  return (
    <div className="bg-[#070B0A] text-slate-200 font-sans flex flex-row relative h-screen overflow-hidden">

      {/* Background Teal Radial Glows */}
      <div className="absolute top-1/2 left-[20%] w-[800px] h-[800px] bg-[#14B8A6]/5 rounded-full blur-[150px] pointer-events-none -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute top-[30%] right-[10%] w-[1000px] h-[1000px] bg-[#2DD4BF]/5 rounded-full blur-[180px] pointer-events-none translate-x-1/3 -translate-y-1/3" />

      {/* LEFT PANEL - LoginForm */}
      <motion.div
        initial={{ x: prefersReduced ? 0 : -40, opacity: prefersReduced ? 1 : 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: prefersReduced ? 0.01 : 0.6, ease: 'easeOut' }}
        className="relative z-20 w-[420px] lg:w-[480px] shrink-0 flex items-center justify-center px-8 border-r border-[#14B8A6]/10"
        style={{
          background: 'linear-gradient(180deg, rgba(20, 184, 166, 0.02) 0%, transparent 100%)',
        }}
      >
        <div className="w-full h-full flex flex-col justify-center">
          <LoginForm />
        </div>
      </motion.div>

      {/* RIGHT PANEL - ProductPreview */}
      <motion.div
        initial={{ opacity: prefersReduced ? 1 : 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: prefersReduced ? 0.01 : 0.8, ease: 'easeOut', delay: prefersReduced ? 0 : 0.2 }}
        className="relative z-20 flex-1 flex items-center justify-center px-8 overflow-hidden"
      >
        <div className="w-full h-full max-w-[1000px] mx-auto flex flex-col justify-center">
          <ProductPreview />
        </div>
      </motion.div>

    </div>
  )
}