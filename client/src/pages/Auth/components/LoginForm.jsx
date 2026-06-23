import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate, Link } from 'react-router-dom'
import { useLoginMutation } from '../../../store/api'
import { setCredentials } from '../../../store/authSlice'
import { BrainCircuit, Hand, Mail, Lock, Eye, EyeOff } from 'lucide-react'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [login, { isLoading, error }] = useLoginMutation()

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const response = await login({ email, password }).unwrap()
      dispatch(setCredentials({ user: response.user, accessToken: response.accessToken }))
      if (response.user.onboardingComplete) {
        navigate('/dashboard', { replace: true })
      } else {
        navigate('/onboarding', { replace: true })
      }
    } catch (err) {
      console.error('Failed to login', err)
    }
  }

  return (
    <div className="flex flex-col justify-center h-full w-full max-w-[360px] mx-auto py-8">
      {/* Top Logo */}
      <div className="flex flex-col items-start mb-10">
        <div className="flex items-center gap-2 mb-1">
          <BrainCircuit className="text-[#2DD4BF] w-8 h-8" />
          <span className="text-3xl font-bold tracking-tight text-white">HireMinds</span>
        </div>
        <span className="text-[10px] text-[#94A3B8] tracking-[0.2em] uppercase font-medium mt-1">AI Career Companion</span>
      </div>

      {/* Heading */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2 tracking-tight flex items-center gap-2">
          Welcome back <Hand className="w-6 h-6 text-yellow-400" />
        </h1>
        <p className="text-[#94A3B8] text-sm">Sign in to continue your career journey</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label className="block text-[13px] text-white mb-2 font-medium">Email address</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] w-4 h-4" />
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full bg-[#0B1110]/50 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-[#2DD4BF]/50 focus:ring-1 focus:ring-[#2DD4BF]/50 transition-all placeholder-[#475569]"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-[13px] text-white mb-2 font-medium">Password</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] w-4 h-4" />
            <input 
              type={showPassword ? "text" : "password"} 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full bg-[#0B1110]/50 border border-white/5 rounded-xl py-3 pl-10 pr-10 text-sm text-white focus:outline-none focus:border-[#2DD4BF]/50 focus:ring-1 focus:ring-[#2DD4BF]/50 transition-all placeholder-[#475569]"
              required
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Options */}
        <div className="flex items-center justify-between mt-1 mb-2">
          <label className="flex items-center gap-2 cursor-pointer group">
            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${rememberMe ? 'bg-[#14B8A6] border-[#14B8A6]' : 'border-white/20 bg-[#0B1110] group-hover:border-[#14B8A6]'}`}>
              {rememberMe && <span className="text-[10px] text-white font-bold">✓</span>}
            </div>
            <input type="checkbox" className="hidden" checked={rememberMe} onChange={() => setRememberMe(!rememberMe)} />
            <span className="text-xs text-[#94A3B8] group-hover:text-white transition-colors">Remember me</span>
          </label>
          <Link to="/forgot-password" className="text-xs text-[#14B8A6] hover:text-[#2DD4BF] font-medium transition-colors">Forgot password?</Link>
        </div>

        {error && <div className="text-red-400 text-xs text-center">{error.data?.error || 'Login failed'}</div>}

        {/* Submit */}
        <button 
          type="submit" 
          disabled={isLoading}
          className="w-full bg-[#14B8A6] hover:bg-[#0D9488] text-white rounded-xl py-3.5 text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(20,184,166,0.25)] disabled:opacity-70 mt-2"
        >
          {isLoading ? 'Signing in...' : 'Sign in →'}
        </button>
      </form>

      {/* OR Divider */}
      <div className="flex items-center gap-4 my-8 opacity-60">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#94A3B8]/30" />
        <span className="text-[10px] text-[#94A3B8] uppercase font-bold tracking-widest">or</span>
        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#94A3B8]/30" />
      </div>

      {/* Google Button */}
      <button className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-white/[0.08] bg-[#0B1110]/50 hover:bg-white/[0.05] transition-colors text-sm font-medium mb-8 text-white shadow-sm">
        <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
        Continue with Google
      </button>

      <div className="text-center">
        <span className="text-xs text-[#94A3B8]">Don't have an account? </span>
        <Link to="/register" className="text-xs text-[#14B8A6] hover:text-[#2DD4BF] font-semibold transition-colors">Create one</Link>
      </div>

    </div>
  )
}
