import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useSelector } from 'react-redux'
import { selectIsAuthenticated } from '../store/authSlice'
import { CheckCircle2, Target, BarChart3, Zap, Shield, Sparkles, MessageSquare, Briefcase, FileText } from 'lucide-react'

// Array of simple dummy icons for the integration grid
const icons = [
  FileText, Shield, Zap, Target, BarChart3, MessageSquare, Briefcase, Sparkles, CheckCircle2,
  Zap, FileText, Briefcase, MessageSquare, Shield, Target, Sparkles, BarChart3, CheckCircle2
]

import { Skiper17 } from "../components/animations/StickyCard";

export default function LandingPage() {
  const isAuthenticated = useSelector(selectIsAuthenticated)

  return (
    <div className="min-h-screen bg-[#060908] text-white font-sans selection:bg-[#14B8A6] selection:text-white">

      {/* Navbar */}
      <nav className="fixed top-0 left-0 w-full z-50 px-8 md:px-12 py-4 flex justify-between items-center bg-[#0d1211]/80 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="HireMinds" className="h-10 w-auto object-contain" />
        </div>

        <div className="hidden md:flex items-center gap-8">
          <a href="#home" className="text-sm font-medium text-[#14B8A6] hover:text-[#2DD4BF] transition-colors">Home</a>
          <a href="#features" className="text-sm font-medium text-[#94A3B8] hover:text-white transition-colors">Products</a>
          <a href="#solutions" className="text-sm font-medium text-[#94A3B8] hover:text-white transition-colors">Solutions</a>
          <a href="#testimonials" className="text-sm font-medium text-[#94A3B8] hover:text-white transition-colors">Resources</a>
        </div>

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <Link to="/dashboard" className="px-5 py-2 text-sm font-bold text-white bg-[#14B8A6] hover:bg-[#0D9488] transition-colors rounded-lg shadow-[0_0_15px_rgba(20,184,166,0.3)]">
              Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-[#94A3B8] hover:text-white transition-colors">Log In</Link>
              <Link to="/register" className="px-5 py-2 text-sm font-bold text-[#060908] bg-[#2DD4BF] hover:bg-[#14B8A6] transition-colors rounded-lg shadow-[0_0_15px_rgba(45,212,191,0.3)]">
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="relative pt-40 pb-4 px-6 flex flex-col items-center text-center z-10 overflow-x-clip">

        {/* Background Gradients removed */}

        {/* The Arc (Smile shape slightly lower) */}
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[1200px] h-[750px] rounded-[100%] border-b-[4px] border-[#2DD4BF]/80 shadow-[0_20px_60px_rgba(45,212,191,0.3)] opacity-70 pointer-events-none z-0" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center relative z-10"
        >
          {/* Pill Badge */}
          <div className="px-4 py-1.5 rounded-full bg-gradient-to-r from-[#14B8A6]/20 to-[#14B8A6]/5 border border-[#14B8A6]/30 mb-8 backdrop-blur-sm">
            <span className="text-[11px] font-bold text-[#2DD4BF] tracking-[0.15em] uppercase">
              AI NATIVE. BUILT FOR FRESHERS.
            </span>
          </div>

          {/* Slogan */}
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1] max-w-4xl mx-auto">
            Get Hired <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2DD4BF] to-[#0D9488]">Faster</span>. <br />
            No Experience Needed.
          </h1>

          {/* Subtext */}
          <p className="text-[#94A3B8] text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            The intelligent career coach that builds your resume, prepares you for interviews, and matches you with top tech roles.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-20 z-20">
            <Link
              to={isAuthenticated ? "/dashboard" : "/register"}
              className="px-8 py-3 rounded-lg text-sm font-bold text-[#060908] bg-gradient-to-r from-[#2DD4BF] to-[#14B8A6] hover:from-[#14B8A6] hover:to-[#0D9488] transition-all shadow-[0_0_20px_rgba(45,212,191,0.4)] hover:shadow-[0_0_30px_rgba(45,212,191,0.6)]"
            >
              Start Free Analysis
            </Link>
            <a
              href="#features"
              className="px-8 py-3 rounded-lg text-sm font-bold text-white bg-white/5 border border-white/10 hover:bg-white/10 transition-all backdrop-blur-sm"
            >
              AI Done Right
            </a>
          </div>
        </motion.div>

        {/* Floating Icons Row (Decorative) */}
        <div className="relative w-[100vw] left-1/2 -translate-x-1/2 mt-16 z-20 hidden md:block">
          <div className="flex justify-around items-center w-full px-4 opacity-40 gap-4">
            {icons.slice(0, 12).map((Icon, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: (i % 5) * 0.1 + 0.2 }}
                transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse', delay: i * 0.1 }}
                className="w-16 h-16 bg-white/5 border border-white/5 rounded-xl flex items-center justify-center backdrop-blur-sm shrink-0"
              >
                <Icon className="w-6 h-6 text-[#94A3B8]" />
              </motion.div>
            ))}
          </div>
        </div>




      </section>

      {/* Feature Section */}
      <section id="features" className="relative pt-10 pb-24 px-6 bg-[#060908]">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 border-b border-white/10 pb-8">
            <div className="max-w-2xl">
              <div className="px-3 py-1 w-max rounded-md bg-[#14B8A6]/10 border border-[#14B8A6]/20 mb-4">
                <span className="text-[10px] font-bold text-[#2DD4BF] uppercase tracking-wider">AI NATIVE. BUILT FOR FRESHERS.</span>
              </div>
              <h2 className="text-4xl font-semibold text-white leading-tight">
                Why Students And Recruiting <br /> Teams Love <span className="text-[#14B8A6]">HireMinds</span>
              </h2>
            </div>
            <p className="text-[#94A3B8] max-w-xs mt-6 md:mt-0 text-sm">
              HireMinds boosts candidate engagement, streamlines prep workflows, and automates ATS analysis.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature Cards */}
            <div className="bg-[#0B1110] border border-white/5 rounded-2xl p-8 hover:bg-white/5 transition-colors group">
              <div className="w-10 h-10 bg-[#14B8A6]/10 rounded-lg flex items-center justify-center mb-6 border border-[#14B8A6]/20 group-hover:border-[#14B8A6]/50 transition-colors">
                <Target className="w-5 h-5 text-[#2DD4BF]" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-3">Data-Driven Decisions</h3>
              <p className="text-sm text-[#64748B] leading-relaxed">
                Data-Driven Decisions are at the heart of HireMinds approach. By leveraging AI to capture and analyse resume metrics, you know exactly what to improve.
              </p>
            </div>

            <div className="bg-[#0B1110] border border-white/5 rounded-2xl p-8 hover:bg-white/5 transition-colors group">
              <div className="w-10 h-10 bg-[#14B8A6]/10 rounded-lg flex items-center justify-center mb-6 border border-[#14B8A6]/20 group-hover:border-[#14B8A6]/50 transition-colors">
                <Zap className="w-5 h-5 text-[#2DD4BF]" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-3">Faster Time-To-Offer</h3>
              <p className="text-sm text-[#64748B] leading-relaxed">
                Faster Time-To-Offer is one of the key benefits offered by HireMinds's AI-powered mock interview platform, preparing you for the real deal.
              </p>
            </div>

            <div className="bg-[#0B1110] border border-white/5 rounded-2xl p-8 hover:bg-white/5 transition-colors group lg:row-span-2">
              <div className="w-10 h-10 bg-[#14B8A6]/10 rounded-lg flex items-center justify-center mb-6 border border-[#14B8A6]/20 group-hover:border-[#14B8A6]/50 transition-colors">
                <Sparkles className="w-5 h-5 text-[#2DD4BF]" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-3">Streamlined Screening</h3>
              <p className="text-sm text-[#64748B] leading-relaxed mb-6">
                Streamlined, Precise Screening is a core strength of HireMinds, designed to ensure only the most qualified keywords and structures are highlighted.
              </p>
              {/* Mini visual inside card */}
              <div className="h-32 rounded-xl bg-gradient-to-br from-[#14B8A6]/20 to-transparent border border-white/5 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-[#14B8A6]/20 animate-pulse flex items-center justify-center">
                  <CheckCircle2 className="text-[#2DD4BF] w-8 h-8" />
                </div>
              </div>
            </div>

            <div className="bg-[#0B1110] border border-white/5 rounded-2xl p-8 hover:bg-white/5 transition-colors group">
              <div className="w-10 h-10 bg-[#14B8A6]/10 rounded-lg flex items-center justify-center mb-6 border border-[#14B8A6]/20 group-hover:border-[#14B8A6]/50 transition-colors">
                <BarChart3 className="w-5 h-5 text-[#2DD4BF]" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-3">Maximize Prep ROI</h3>
              <p className="text-sm text-[#64748B] leading-relaxed">
                Maximize Hiring ROI with HireMinds by transforming your preparation process into a high-efficiency machine.
              </p>
            </div>

            <div className="bg-[#0B1110] border border-white/5 rounded-2xl p-8 hover:bg-white/5 transition-colors group">
              <div className="w-10 h-10 bg-[#14B8A6]/10 rounded-lg flex items-center justify-center mb-6 border border-[#14B8A6]/20 group-hover:border-[#14B8A6]/50 transition-colors">
                <MessageSquare className="w-5 h-5 text-[#2DD4BF]" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-3">AI-Powered Coach</h3>
              <p className="text-sm text-[#64748B] leading-relaxed">
                AI-Powered Candidate Sourcing with HireMinds transforms the way freshers find and connect with top talent recruiters.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Animated Sticky Cards Mockup */}
      <section className="relative pt-12 pb-24 bg-[#060908] overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 mb-2 text-center relative z-20">
          <div className="px-3 py-1 w-max mx-auto rounded-md bg-[#14B8A6]/10 border border-[#14B8A6]/20 mb-4">
            <span className="text-[11px] font-bold text-[#2DD4BF] tracking-[0.15em] uppercase">
              Platform Visuals
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
            See HireMinds In <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2DD4BF] to-[#0D9488]">Action</span>
          </h2>
          <p className="text-[#94A3B8] text-lg max-w-2xl mx-auto">
            Experience the seamless AI coaching workflow designed specifically to help you land your dream tech role.
          </p>
        </div>

        <div className="relative w-[95vw] max-w-[1700px] mx-auto z-10">
          <Skiper17 />
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="relative py-24 px-6 bg-[#060908]">
        <div className="max-w-6xl mx-auto flex flex-col items-center">
          <div className="px-3 py-1 w-max rounded-md bg-[#14B8A6]/10 border border-[#14B8A6]/20 mb-6">
            <span className="text-[10px] font-bold text-[#2DD4BF] uppercase tracking-wider">AI NATIVE. BUILT FOR FRESHERS.</span>
          </div>
          <h2 className="text-4xl font-semibold text-white text-center mb-4">Customers <span className="text-white">Love Us</span></h2>
          <p className="text-[#64748B] text-center mb-16 text-sm">Proudly rated 4.9/5, and trusted by freshers and placement cells everywhere.</p>

          <div className="grid md:grid-cols-3 gap-6 w-full">
            <div className="bg-[#0B1110] border border-white/5 rounded-2xl p-8 hover:bg-white/5 transition-colors">
              <p className="text-[#94A3B8] text-sm leading-relaxed mb-6">
                "The mock interviews feel incredibly real. The AI feedback on my tone and technical answers helped me clear my dream company's HR round."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-white">R</div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Rahul K.</h4>
                  <p className="text-[11px] text-[#64748B]">Placed at Tech Corp</p>
                </div>
              </div>
            </div>

            <div className="bg-[#0B1110] border border-white/5 rounded-2xl p-8 hover:bg-white/5 transition-colors">
              <p className="text-[#94A3B8] text-sm leading-relaxed mb-6">
                "Also I started using AI resume scoring, it has been helpful. I already found 3 missing keywords that I didn't find via standard ATS checkers."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#14B8A6]/20 flex items-center justify-center text-xs font-bold text-[#2DD4BF]">A</div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Ananya S.</h4>
                  <p className="text-[11px] text-[#64748B]">Software Engineer</p>
                </div>
              </div>
            </div>

            <div className="bg-[#0B1110] border border-white/5 rounded-2xl p-8 hover:bg-white/5 transition-colors">
              <p className="text-[#94A3B8] text-sm leading-relaxed mb-6">
                "HireMinds is a game changer for placement outreach and quality resume building. The AI technology of the platform is unmatched."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-white">P</div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Priya L.</h4>
                  <p className="text-[11px] text-[#64748B]">Data Analyst</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-6 bg-[#0B1110]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 opacity-80">
            <img src="/logo.png" alt="HireMinds" className="w-6 h-6 object-contain grayscale opacity-70" />
            <span className="text-lg font-bold tracking-tight text-[#94A3B8]">HireMinds</span>
          </div>
          <div className="text-xs text-[#64748B]">
            © {new Date().getFullYear()} HireMinds. AI Native Platform. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
