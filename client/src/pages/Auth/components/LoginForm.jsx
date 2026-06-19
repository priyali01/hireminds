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

  return (
    <div className="w-full max-w-[420px] mx-auto bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] shadow-[0_0_40px_rgba(76,29,149,0.2)] rounded-3xl p-8 lg:p-10 relative overflow-hidden">
      
      {/* Subtle edge highlight */}
      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#6366f1] via-[#a855f7] to-transparent opacity-50"></div>

      <div className="flex flex-col items-center mb-10">
        <div className="flex items-center gap-3 mb-3">
          <div className="text-3xl filter drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]">🧠</div>
          <span className="text-3xl font-bold tracking-tight text-white">
            Hire<span className="text-[#a855f7]">Minds</span>
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-slate-400 uppercase tracking-widest">
          <Sparkles className="w-3 h-3 text-[#a855f7]" />
          Your AI Career Companion
          <Sparkles className="w-3 h-3 text-[#a855f7]" />
        </div>
      </div>

      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Welcome back</h2>
        <p className="text-slate-400 text-sm">Sign in to continue your career journey</p>
      </div>

      <button 
        type="button" 
        className="w-full flex items-center justify-center gap-3 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] text-slate-300 rounded-xl py-3 text-sm font-medium transition-colors mb-6 shadow-inner"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Continue with Google
      </button>

      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 h-px bg-white/[0.04]"></div>
        <span className="text-xs text-slate-500">or</span>
        <div className="flex-1 h-px bg-white/[0.04]"></div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5 ml-1">Email address</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <Mail className="w-4 h-4" />
            </div>
            <input
              type="email"
              placeholder="you@example.com"
              className="w-full bg-[#030308]/50 border border-white/[0.08] text-white rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:border-[#a855f7]/50 focus:ring-1 focus:ring-[#a855f7]/50 transition-colors placeholder:text-slate-600 shadow-inner"
              {...register('email', {
                required: 'Email is required',
                pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' },
              })}
            />
          </div>
          {errors.email && <p className="text-red-400 text-xs mt-1.5 ml-1">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5 ml-1">Password</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••••••"
              className="w-full bg-[#030308]/50 border border-white/[0.08] text-white rounded-xl py-3 pl-11 pr-11 text-sm focus:outline-none focus:border-[#a855f7]/50 focus:ring-1 focus:ring-[#a855f7]/50 transition-colors placeholder:text-slate-600 shadow-inner"
              {...register('password', { required: 'Password is required' })}
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="text-red-400 text-xs mt-1.5 ml-1">{errors.password.message}</p>}
        </div>

        <div className="flex items-center justify-between text-sm pt-1">
          <label className="flex items-center gap-2.5 cursor-pointer group">
            <div className="relative flex items-center justify-center w-4 h-4 rounded border border-[#a855f7]/40 bg-[#a855f7]/20 group-hover:bg-[#a855f7]/30 transition-colors">
              <input type="checkbox" className="opacity-0 absolute inset-0 cursor-pointer" defaultChecked />
              <svg className="w-2.5 h-2.5 text-[#d8b4fe]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-slate-300">Remember me</span>
          </label>
          <Link to="#" className="text-[#a855f7] hover:text-[#d8b4fe] transition-colors">
            Forgot password?
          </Link>
        </div>

        {serverError && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-xl">
            {serverError}
          </div>
        )}

        <motion.button
          type="submit"
          disabled={isLoading}
          whileHover={!prefersReduced && !isLoading ? { scale: 1.02 } : {}}
          whileTap={!prefersReduced && !isLoading ? { scale: 0.98 } : {}}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#6366f1] to-[#d946ef] text-white rounded-xl py-3.5 text-sm font-semibold transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] mt-2"
        >
          {isLoading ? 'Signing in...' : 'Sign in'}
          {!isLoading && <ArrowRight className="w-4 h-4" />}
        </motion.button>
      </form>

      <div className="mt-8 text-center text-sm text-slate-400">
        Don't have an account?{' '}
        <Link to="/register" className="text-[#a855f7] hover:text-[#d8b4fe] transition-colors">
          Create one free
        </Link>
      </div>

      <div className="mt-8 flex justify-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#052e16]/50 border border-[#10b981]/20">
          <ShieldCheck className="w-4 h-4 text-[#10b981]" />
          <span className="text-xs text-[#10b981] font-medium">Your data is secure and encrypted</span>
        </div>
      </div>
    </div>
  )
}
