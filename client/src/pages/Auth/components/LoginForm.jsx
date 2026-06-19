import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { useForm } from 'react-hook-form'
import { Mail, Lock, Eye, EyeOff, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react'
import { useLoginMutation } from '../../../store/api'
import { setCredentials } from '../../../store/authSlice'

export default function LoginForm() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [login, { isLoading }] = useLoginMutation()
  const [serverError, setServerError] = useState(null)
  const [showPassword, setShowPassword] = useState(false)

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm()

  const onSubmit = async (data) => {
    setServerError(null)
    try {
      const result = await login(data).unwrap()
      dispatch(setCredentials({ user: result.user, accessToken: result.accessToken }))
      navigate(result.user.onboardingComplete ? '/dashboard' : '/onboarding', { replace: true })
    } catch (err) {
      setServerError(err.data?.message || 'Login failed. Please try again.')
    }
  }

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: prefersReduced ? 0 : 0.07,
        delayChildren: prefersReduced ? 0 : 0.3,
      },
    },
  }

  const itemVariants = {
    hidden: { y: prefersReduced ? 0 : 16, opacity: prefersReduced ? 1 : 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: prefersReduced ? 0.01 : 0.4, ease: 'easeOut' },
    },
  }

  return (
    <div className="w-full bg-white/[0.04] backdrop-blur-2xl border border-white/[0.10] shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.10),0_12px_40px_rgba(0,0,0,0.6)] rounded-[28px] px-10 pt-14 pb-10 lg:px-12 lg:pt-16 lg:pb-12 relative overflow-hidden min-h-auto flex flex-col justify-center">

      {/* Left edge accent */}
      <div className="absolute top-0 left-0 w-[2px] h-full bg-gradient-to-b from-[#6366f1] via-[#a855f7] to-transparent opacity-70 rounded-l-[28px]" />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-col w-full gap-8"
      >
        {/* Top Section: Headers */}
        <div className="flex flex-col items-center">
          <motion.div variants={itemVariants} className="flex items-center gap-3 mb-6">
            <div className="text-4xl filter drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]">🧠</div>
            <span className="text-4xl font-bold tracking-tight text-white">
              Hire<span className="text-[#a855f7]">Minds</span>
            </span>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="flex items-center gap-2 text-sm font-medium text-slate-500 tracking-widest mb-10"
          >
            <Sparkles className="w-4 h-4 text-[#a855f7]/60" />
            Your AI Career Companion
            <Sparkles className="w-4 h-4 text-[#a855f7]/60" />
          </motion.div>

          <motion.h2 variants={itemVariants} className="text-3xl font-bold text-white mb-2 text-center">
            Welcome back
          </motion.h2>
          <motion.p variants={itemVariants} className="text-slate-400 text-base text-center">
            Sign in to continue your career journey
          </motion.p>
        </div>

        {/* Middle Section: Form and Actions */}
        <div className="flex flex-col w-full mt-6 mb-6 space-y-4">
          <motion.button
            variants={itemVariants}
            type="button"
            className="w-full flex items-center justify-center gap-4 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.10] text-slate-300 rounded-xl py-5 text-base font-medium transition-all"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </motion.button>

          <motion.div variants={itemVariants} className="flex items-center gap-4 w-full">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-[13px] text-slate-500 uppercase tracking-wider font-medium">or continue with email</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </motion.div>

          <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-6" noValidate>
            <motion.div variants={itemVariants}>
              <label className="block text-sm font-medium text-slate-400 mb-3 ml-1">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="w-5 h-5 text-slate-500" />
                </div>
                <input
                  type="email"
                  placeholder="you@example.com"
                  className="w-full bg-white/[0.06] border border-white/[0.10] text-white rounded-xl py-4 pl-12 pr-4 text-base focus:outline-none focus:border-[#a855f7]/60 focus:ring-1 focus:ring-[#a855f7]/30 transition-all placeholder:text-slate-600"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' },
                  })}
                />
              </div>
              {errors.email && (
                <p className="text-red-400 text-sm mt-2 ml-1">{errors.email.message}</p>
              )}
            </motion.div>

            <motion.div variants={itemVariants}>
              <label className="block text-sm font-medium text-slate-400 mb-3 ml-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-slate-500" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  className="w-full bg-white/[0.06] border border-white/[0.10] text-white rounded-xl py-5 pl-12 pr-12 text-base focus:outline-none focus:border-[#a855f7]/60 focus:ring-1 focus:ring-[#a855f7]/30 transition-all placeholder:text-slate-600"
                  {...register('password', { required: 'Password is required' })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-400 text-sm mt-2 ml-1">{errors.password.message}</p>
              )}
            </motion.div>

            <motion.div variants={itemVariants} className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-4 cursor-pointer group">
                <div className="relative flex items-center justify-center w-6 h-6 rounded border border-[#a855f7]/40 bg-[#a855f7]/20 group-hover:bg-[#a855f7]/30 transition-colors shrink-0">
                  <input type="checkbox" className="opacity-0 absolute inset-0 cursor-pointer" defaultChecked />
                  <svg className="w-4 h-4 text-[#d8b4fe]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-base text-slate-400">Remember me</span>
              </label>
              <Link to="#" className="text-base text-[#a855f7] hover:text-[#d8b4fe] transition-colors">
                Forgot password?
              </Link>
            </motion.div>

            {serverError && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-xl"
              >
                {serverError}
              </motion.div>
            )}

            <motion.div variants={itemVariants} className="pt-4">
              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={!prefersReduced && !isLoading ? { scale: 1.01 } : {}}
                whileTap={!prefersReduced && !isLoading ? { scale: 0.98 } : {}}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#6366f1] to-[#a855f7] text-white rounded-xl py-5 text-base font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-[0_0_24px_rgba(99,102,241,0.35)] hover:shadow-[0_0_32px_rgba(168,85,247,0.45)]"
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
                {!isLoading && <ArrowRight className="w-6 h-6" />}
              </motion.button>
            </motion.div>
          </form>
        </div>

        {/* Bottom Section: Footer Links */}
        <div className="flex flex-col items-center">
          <motion.div variants={itemVariants} className="text-center text-base text-slate-500 mb-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-[#a855f7] hover:text-[#d8b4fe] transition-colors font-medium">
              Create one free
            </Link>
          </motion.div>

          <motion.div variants={itemVariants} className="flex justify-center">
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-emerald-950/40 border border-emerald-500/20">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span className="text-sm text-emerald-400 font-medium">Your data is secure and encrypted</span>
            </div>
          </motion.div>
        </div>

      </motion.div>
    </div>
  )
}