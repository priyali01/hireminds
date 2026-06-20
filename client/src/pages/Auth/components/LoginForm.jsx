import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { useForm } from 'react-hook-form'
import { Mail, Lock, Eye, EyeOff, ShieldCheck, ArrowRight } from 'lucide-react'
import { useLoginMutation } from '../../../store/api'
import { setCredentials } from '../../../store/authSlice'

const ANIM = {
  container: {
    hidden: {},
    show: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
  },
  item: {
    hidden: { opacity: 0, y: 14 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  },
}

export default function LoginForm() {
  const dispatch    = useDispatch()
  const navigate    = useNavigate()
  const [login, { isLoading }] = useLoginMutation()
  const [serverError, setServerError] = useState(null)
  const [showPwd, setShowPwd]         = useState(false)
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const { register, handleSubmit, formState: { errors } } = useForm()

  const onSubmit = async (data) => {
    setServerError(null)
    try {
      const res = await login(data).unwrap()
      dispatch(setCredentials({ user: res.user, accessToken: res.accessToken }))
      navigate(res.user.onboardingComplete ? '/dashboard' : '/onboarding', { replace: true })
    } catch (err) {
      setServerError(err.data?.message || 'Login failed. Please try again.')
    }
  }

  const variants = prefersReduced
    ? { container: {}, item: {} }
    : ANIM

  return (
    <motion.div
      variants={variants.container}
      initial="hidden"
      animate="show"
      className="w-full"
    >
      {/* ── Glass card ── */}
      <div className="relative w-full bg-white/[0.05] backdrop-blur-2xl border border-white/[0.10] rounded-3xl shadow-[0_24px_64px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.08)] overflow-hidden">

        {/* top glow stripe */}
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#a855f7] to-transparent opacity-80" />
        {/* left glow stripe */}
        <div className="absolute inset-y-0 left-0 w-[2px] bg-gradient-to-b from-[#6366f1] via-[#a855f7]/50 to-transparent" />
        {/* ambient inner glow */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-32 bg-[#7c3aed]/25 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 px-9 py-10">

          {/* ── Brand ── */}
          <motion.div variants={variants.item} className="flex flex-col items-center gap-2 mb-8">
            <div className="flex items-center gap-3">
              <span className="text-4xl drop-shadow-[0_0_16px_rgba(168,85,247,0.7)]">🧠</span>
              <span className="text-[1.85rem] font-extrabold tracking-tight text-white leading-none">
                Hire<span className="text-[#a855f7]">Minds</span>
              </span>
            </div>
            <p className="text-[11px] font-semibold tracking-[0.22em] text-slate-500 uppercase">
              Your AI Career Companion
            </p>
          </motion.div>

          {/* ── Welcome heading ── */}
          <motion.div variants={variants.item} className="text-center mb-7">
            <h1 className="text-2xl font-bold text-white mb-1.5">Welcome back 👋</h1>
            <p className="text-slate-400 text-sm leading-relaxed">
              Sign in to continue your career journey
            </p>
          </motion.div>

          {/* ── Google OAuth ── */}
          <motion.button
            variants={variants.item}
            type="button"
            whileHover={!prefersReduced ? { scale: 1.015 } : {}}
            whileTap={!prefersReduced ? { scale: 0.985 } : {}}
            className="w-full flex items-center justify-center gap-3 bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.12] text-slate-200 text-sm font-semibold rounded-xl py-3.5 transition-all duration-200 mb-5 shadow-sm"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </motion.button>

          {/* ── Divider ── */}
          <motion.div variants={variants.item} className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-white/[0.07]" />
            <span className="text-[11px] font-semibold tracking-[0.18em] text-slate-600 uppercase">or email</span>
            <div className="flex-1 h-px bg-white/[0.07]" />
          </motion.div>

          {/* ── Form ── */}
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="space-y-5">

              {/* Email field */}
              <motion.div variants={variants.item}>
                <label className="block text-xs font-bold text-slate-400 mb-2 tracking-widest uppercase">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  <input
                    type="email"
                    autoComplete="email"
                    placeholder="you@college.ac.in"
                    className="w-full bg-[#0c0a1a] border border-white/[0.09] hover:border-white/[0.15] text-white rounded-xl py-3.5 pl-10 pr-4 text-sm outline-none focus:border-[#a855f7]/70 focus:ring-2 focus:ring-[#a855f7]/20 transition-all placeholder:text-slate-600 caret-violet-400"
                    {...register('email', {
                      required: 'Email is required',
                      pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' },
                    })}
                  />
                </div>
                {errors.email && (
                  <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                    <span>⚠</span> {errors.email.message}
                  </p>
                )}
              </motion.div>

              {/* Password field */}
              <motion.div variants={variants.item}>
                <label className="block text-xs font-bold text-slate-400 mb-2 tracking-widest uppercase">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  <input
                    type={showPwd ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••••••"
                    className="w-full bg-[#0c0a1a] border border-white/[0.09] hover:border-white/[0.15] text-white rounded-xl py-3.5 pl-10 pr-11 text-sm outline-none focus:border-[#a855f7]/70 focus:ring-2 focus:ring-[#a855f7]/20 transition-all placeholder:text-slate-600 caret-violet-400"
                    {...register('password', { required: 'Password is required' })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(v => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                    <span>⚠</span> {errors.password.message}
                  </p>
                )}
              </motion.div>

              {/* Remember me + Forgot */}
              <motion.div variants={variants.item} className="flex items-center justify-between">
                <label className="flex items-center gap-2.5 cursor-pointer select-none group">
                  <div className="relative w-[18px] h-[18px] shrink-0">
                    <input type="checkbox" className="peer sr-only" defaultChecked />
                    <div className="w-[18px] h-[18px] rounded-[5px] border border-violet-500/40 bg-violet-900/20 peer-checked:bg-violet-700/40 peer-checked:border-violet-500/60 transition-all" />
                    <svg className="absolute inset-0 m-auto w-3 h-3 text-violet-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">Remember me</span>
                </label>
                <Link to="#" className="text-sm text-violet-400 hover:text-violet-300 transition-colors font-medium">
                  Forgot password?
                </Link>
              </motion.div>

              {/* Server error */}
              {serverError && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3"
                >
                  {serverError}
                </motion.p>
              )}

              {/* Submit */}
              <motion.div variants={variants.item} className="pt-1">
                <motion.button
                  type="submit"
                  disabled={isLoading}
                  whileHover={!prefersReduced && !isLoading ? { scale: 1.015 } : {}}
                  whileTap={!prefersReduced && !isLoading ? { scale: 0.985 } : {}}
                  className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-indigo-500 via-violet-600 to-purple-500 hover:from-indigo-400 hover:via-violet-500 hover:to-purple-400 text-white font-bold rounded-xl py-3.5 text-sm transition-all duration-300 shadow-[0_0_32px_rgba(124,58,237,0.5)] hover:shadow-[0_0_48px_rgba(124,58,237,0.65)] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                >
                  {isLoading ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                      Signing in…
                    </>
                  ) : (
                    <>
                      Sign in <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </motion.button>
              </motion.div>

            </div>
          </form>

          {/* ── Footer ── */}
          <motion.div variants={variants.item} className="mt-7 pt-6 border-t border-white/[0.06] space-y-4">

            <p className="text-center text-sm text-slate-500">
              New to HireMinds?{' '}
              <Link to="/register" className="text-violet-400 hover:text-violet-300 font-semibold transition-colors">
                Create a free account
              </Link>
            </p>

            <div className="flex justify-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-950/60 border border-emerald-600/25">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-xs text-emerald-400 font-medium">256-bit SSL · Your data is always safe</span>
              </div>
            </div>

          </motion.div>

        </div>
      </div>
    </motion.div>
  )
}
