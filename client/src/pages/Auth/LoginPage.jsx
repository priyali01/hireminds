import { motion } from 'framer-motion'
import LoginForm from './components/LoginForm'
import ProductPreview from './components/ProductPreview'

export default function LoginPage() {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  return (
    <div className="min-h-screen bg-[#060611] text-slate-200 overflow-hidden flex flex-col xl:flex-row font-sans selection:bg-indigo-500/30 relative">
      
      {/* Abstract Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#4c1d95]/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[60%] bg-[#312e81]/30 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-[#a855f7]/10 rounded-full blur-[100px] pointer-events-none" />
      
      {/* Left Panel - Login Form */}
      <motion.div 
        initial={{ x: prefersReduced ? 0 : -40, opacity: prefersReduced ? 1 : 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: prefersReduced ? 0.01 : 0.6, ease: "easeOut" }}
        className="w-full xl:w-[40%] min-h-screen flex items-center justify-center relative z-20 p-6 lg:p-12"
      >
        <LoginForm />
      </motion.div>

      {/* Right Panel - Product Preview */}
      <motion.div 
        initial={{ x: prefersReduced ? 0 : 40, opacity: prefersReduced ? 1 : 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: prefersReduced ? 0.01 : 0.6, ease: "easeOut", delay: prefersReduced ? 0 : 0.2 }}
        className="w-full xl:w-[60%] min-h-[50vh] xl:min-h-screen relative flex flex-col items-center justify-center p-6 lg:p-12 overflow-y-auto z-10"
      >
        <ProductPreview />
      </motion.div>
      
    </div>
  )
}
