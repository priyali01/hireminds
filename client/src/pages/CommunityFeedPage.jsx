import { useState } from 'react'
import { motion } from 'framer-motion'
import { useGetExperiencesQuery, useSubmitExperienceMutation, useToggleExperienceUpvoteMutation } from '../store/api'
import { useForm } from 'react-hook-form'
import { 
  Users, Building2, MessageCircle, TrendingUp, Search, 
  Eye, ThumbsUp, Flame, Trophy, Check, UserRound, ChevronRight,
  ChevronDown, MessageSquare
} from 'lucide-react'

// Mock Data / Helpers for visual enhancements not yet in DB
const COMPANY_LOGOS = {
  'Amazon': 'https://www.svgrepo.com/show/303106/amazon-icon-1-logo.svg',
  'Google': 'https://www.svgrepo.com/show/475656/google-color.svg',
  'Microsoft': 'https://www.svgrepo.com/show/303114/microsoft-logo.svg',
  'Barclays': 'https://www.svgrepo.com/show/330066/barclays.svg',
  'Goldman Sachs': 'https://www.svgrepo.com/show/330543/goldman-sachs.svg',
  'default': 'https://www.svgrepo.com/show/303118/apple-logo.svg' // generic fallback
}

const getLogo = (name) => {
  for (let key in COMPANY_LOGOS) {
    if (name.toLowerCase().includes(key.toLowerCase())) return COMPANY_LOGOS[key]
  }
  return COMPANY_LOGOS['default']
}

const mockProcess = ['OA', 'DSA Round', 'LLD Round', 'HR Round']
const mockTopics = ['Arrays', 'Graphs', 'DP', 'System Design', 'OS', 'DBMS']

export default function CommunityFeedPage() {
  const [showModal, setShowModal] = useState(false)
  const { data, isLoading } = useGetExperiencesQuery({ page: 1 })
  const [toggleUpvote] = useToggleExperienceUpvoteMutation()

  const handleUpvote = (id) => toggleUpvote(id)

  return (
    <div className="min-h-screen bg-[#070B0A] text-slate-200 font-sans p-6 overflow-x-hidden">
      <div className="max-w-[1400px] mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Filters */}
        <div className="hidden lg:block lg:col-span-3">
          <FiltersSidebar />
        </div>

        {/* MIDDLE COLUMN: Main Feed */}
        <div className="col-span-1 lg:col-span-6 flex flex-col gap-6">
          
          {/* Hero Banner */}
          <div className="relative overflow-hidden rounded-2xl bg-[#0B1110] border border-white/5 p-6 flex items-center justify-between shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#2DD4BF]/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
            <div className="relative z-10 max-w-[70%]">
              <h2 className="text-2xl font-bold text-white mb-2">
                Community Knowledge <span className="text-[#2DD4BF] drop-shadow-[0_0_10px_rgba(45,212,191,0.5)]">Hub ✦</span>
              </h2>
              <p className="text-sm text-[#94A3B8]">
                Real interview experiences, placement tips, and company insights shared by students.
              </p>
            </div>
            {/* Mock glowing illustration */}
            <div className="relative z-10 w-24 h-24 rounded-full border-2 border-[#2DD4BF] flex items-center justify-center bg-[#0B1110] shadow-[0_0_20px_rgba(45,212,191,0.3)]">
              <UserRound className="w-10 h-10 text-slate-200" />
              <div className="absolute -bottom-4 w-32 h-6 border-b-2 border-[#2DD4BF] rounded-[100%] shadow-[0_10px_10px_rgba(45,212,191,0.5)] transform rotateX-[70deg]" />
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={<Users className="w-5 h-5 text-[#2DD4BF]" />} number="1.2k+" label="Experiences Shared" />
            <StatCard icon={<Building2 className="w-5 h-5 text-blue-400" />} number="400+" label="Companies Covered" />
            <StatCard icon={<MessageCircle className="w-5 h-5 text-green-400" />} number="12.5k" label="Helpful Interactions" />
            <StatCard icon={<TrendingUp className="w-5 h-5 text-purple-400" />} number="150+" label="Contributors" />
          </div>

          {/* Tabs */}
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex gap-6">
              <button className="text-[#2DD4BF] font-semibold text-sm border-b-2 border-[#2DD4BF] pb-2 px-1">Recent</button>
              <button className="text-[#94A3B8] hover:text-white transition-colors text-sm font-medium pb-2 px-1">Trending</button>
              <button className="text-[#94A3B8] hover:text-white transition-colors text-sm font-medium pb-2 px-1">Most Helpful</button>
            </div>
            <select className="bg-[#0B1110] border border-white/10 rounded-lg text-sm text-[#94A3B8] px-3 py-1.5 focus:outline-none focus:border-[#2DD4BF]">
              <option>Most Recent</option>
              <option>Highest Rated</option>
            </select>
          </div>

          {/* Feed List */}
          {isLoading ? (
            <div className="text-center py-12 text-[#94A3B8]">Loading community posts...</div>
          ) : (
            <div className="flex flex-col gap-5">
              {data?.experiences?.length === 0 ? (
                <div className="text-center py-12 bg-[#0B1110] border border-white/5 rounded-2xl">
                  <p className="text-[#94A3B8]">No experiences shared yet. Be the first!</p>
                </div>
              ) : (
                data?.experiences?.map((exp, index) => (
                  <ExperienceCard key={exp._id} exp={exp} index={index} handleUpvote={handleUpvote} />
                ))
              )}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Side Widgets */}
        <div className="hidden lg:flex lg:col-span-3 flex-col gap-6">
          {/* Share CTA */}
          <div className="bg-[#0B1110] border border-white/5 rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
            <h3 className="text-white font-bold mb-2 flex items-center gap-2">
              Share Your Experience <span className="text-[#2DD4BF]">✦</span>
            </h3>
            <p className="text-xs text-[#94A3B8] mb-4">
              Help others prepare better by sharing your interview journey.
            </p>
            <button 
              onClick={() => setShowModal(true)}
              className="w-full bg-[#14B8A6] hover:bg-[#0D9488] text-white py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(20,184,166,0.3)]"
            >
              <span className="text-lg leading-none">+</span> Share Experience
            </button>
          </div>

          <TrendingCompanies />
          <TopContributors />
        </div>

      </div>

      {showModal && <SubmissionModal onClose={() => setShowModal(false)} />}
    </div>
  )
}

function FiltersSidebar() {
  return (
    <div className="bg-[#0B1110]/80 border border-white/5 rounded-2xl p-5 flex flex-col gap-6 sticky top-6 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
      <h3 className="text-white font-bold flex items-center gap-2">
        <span className="text-[#94A3B8]"><ChevronDown className="w-4 h-4"/></span> Filters
      </h3>
      
      <div>
        <label className="text-[11px] text-[#94A3B8] font-bold uppercase tracking-wider mb-2 block">Search companies</label>
        <div className="relative">
          <input 
            type="text" 
            placeholder="Search company..." 
            className="w-full bg-[#070B0A] border border-white/10 rounded-lg py-2 pl-3 pr-8 text-xs text-white focus:outline-none focus:border-[#2DD4BF]"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8]">
            <Search className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>

      <div>
        <label className="text-[11px] text-[#94A3B8] font-bold uppercase tracking-wider mb-3 block">Popular Companies</label>
        <div className="flex flex-col gap-3">
          {['Google', 'Microsoft', 'Amazon', 'Barclays', 'Goldman Sachs'].map((c, i) => (
            <div key={c} className="flex items-center justify-between text-xs text-slate-300 hover:text-white cursor-pointer group">
              <div className="flex items-center gap-3">
                <img src={getLogo(c)} alt={c} className="w-4 h-4" />
                <span className="font-medium group-hover:text-[#2DD4BF] transition-colors">{c}</span>
              </div>
              <span className="bg-[#1E293B] text-[#94A3B8] px-2 py-0.5 rounded text-[10px]">{Math.floor(Math.random() * 100 + 50)}</span>
            </div>
          ))}
        </div>
        <button className="text-[#2DD4BF] text-xs font-semibold mt-4 flex items-center gap-1 hover:text-[#14B8A6]">
          View all companies <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      <div>
        <label className="text-[11px] text-[#94A3B8] font-bold uppercase tracking-wider mb-3 block">Experience Type</label>
        <div className="flex flex-col gap-3">
          {['Full Time', 'Internship', 'Off Campus', 'On Campus'].map(t => (
            <label key={t} className="flex items-center justify-between text-xs cursor-pointer group">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-[#14B8A6] flex items-center justify-center">
                  <Check className="w-3 h-3 text-[#070B0A] font-bold" />
                </div>
                <span className="text-slate-300 group-hover:text-white">{t}</span>
              </div>
              <span className="text-[#94A3B8] text-[10px]">{Math.floor(Math.random() * 500 + 100)}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="text-[11px] text-[#94A3B8] font-bold uppercase tracking-wider mb-3 block">Difficulty</label>
        <div className="flex flex-col gap-3">
          {['All', 'Easy', 'Medium', 'Hard'].map((d, i) => (
            <label key={d} className="flex items-center justify-between text-xs cursor-pointer group">
              <div className="flex items-center gap-2">
                <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${i === 0 ? 'border-[#14B8A6]' : 'border-[#475569]'}`}>
                  {i === 0 && <div className="w-1.5 h-1.5 rounded-full bg-[#14B8A6]" />}
                </div>
                <span className="text-slate-300 group-hover:text-white flex items-center gap-1">
                  {d !== 'All' && <span style={{color: i===1?'#4ADE80':i===2?'#FACC15':'#F87171'}}>★</span>} {d}
                </span>
              </div>
              {i !== 0 && <span className="text-[#94A3B8] text-[10px]">{Math.floor(Math.random() * 400 + 50)}</span>}
            </label>
          ))}
        </div>
      </div>

    </div>
  )
}

function StatCard({ icon, number, label }) {
  return (
    <div className="bg-[#0B1110] border border-white/5 rounded-xl p-4 flex items-center gap-4 hover:border-[#2DD4BF]/30 transition-colors">
      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
        {icon}
      </div>
      <div>
        <div className="text-white font-bold text-lg leading-tight">{number}</div>
        <div className="text-[#94A3B8] text-[10px] uppercase font-semibold">{label}</div>
      </div>
    </div>
  )
}

function ExperienceCard({ exp, index, handleUpvote }) {
  const isHighDiff = index % 2 === 0
  const isIntern = index % 2 !== 0

  return (
    <motion.div 
      className="bg-[#0B1110] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.2)]"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex gap-4">
          <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center p-2 shadow-inner shrink-0">
            <img src={getLogo(exp.company)} alt={exp.company} className="w-full h-full object-contain" />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg">{exp.company} {exp.role}</h3>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex text-[#FACC15] text-[10px]">★★★★★ <span className="text-white font-semibold ml-1">{(Math.random() * 1 + 4).toFixed(1)}</span></div>
              <span className="text-[#94A3B8] text-xs px-2 border-l border-white/10">
                {isIntern ? 'Internship' : 'Full Time'} • {new Date(exp.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
        <div className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex flex-col items-center ${isHighDiff ? 'border-red-500/20 text-red-400' : 'border-[#2DD4BF]/20 text-[#2DD4BF]'}`}>
          <span>{isHighDiff ? 'Very High Difficulty' : 'High Difficulty'}</span>
          <span className="text-[10px] mt-0.5">{isHighDiff ? '9 / 10' : '8.5 / 10'}</span>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-3 text-xs overflow-x-auto whitespace-nowrap pb-1">
        <span className="text-[#94A3B8] font-bold">Interview Process:</span>
        {mockProcess.map((step, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="bg-[#1E293B] text-slate-200 px-2.5 py-1 rounded-full">{step}</span>
            {i < mockProcess.length - 1 && <ChevronRight className="w-3 h-3 text-[#94A3B8]" />}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 mb-5 text-xs flex-wrap">
        <span className="text-[#94A3B8] font-bold mr-1">Topics:</span>
        {mockTopics.slice(0, 4 + (index % 3)).map((topic, i) => (
          <span key={i} className="bg-white/5 border border-white/5 text-slate-300 px-2 py-1 rounded-md hover:bg-white/10 transition-colors cursor-default">
            {topic}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-white/5 text-[#94A3B8] text-xs">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1.5"><Eye className="w-4 h-4" /> {exp.upvotesCount * 3 + 120} views</div>
          <button 
            onClick={() => handleUpvote(exp._id)}
            className={`flex items-center gap-1.5 transition-colors ${exp.hasUpvoted ? 'text-[#2DD4BF]' : 'hover:text-white'}`}
          >
            <ThumbsUp className="w-4 h-4" /> {exp.upvotesCount} helpful
          </button>
          <div className="flex items-center gap-1.5"><MessageSquare className="w-4 h-4" /> {Math.floor(Math.random() * 50)} comments</div>
        </div>
        <button className="text-[#2DD4BF] font-semibold flex items-center gap-1 hover:text-[#14B8A6] transition-colors">
          View Details <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </motion.div>
  )
}

function TrendingCompanies() {
  return (
    <div className="bg-[#0B1110]/80 border border-white/5 rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
      <h3 className="text-white font-bold mb-4 flex items-center gap-2">
        <Flame className="w-5 h-5 text-orange-500" /> Trending Companies
      </h3>
      <div className="flex flex-col gap-4">
        {['Amazon', 'Google', 'Microsoft', 'Barclays', 'Goldman Sachs'].map((c, i) => (
          <div key={c} className="flex items-center justify-between text-xs text-slate-200">
            <div className="flex items-center gap-3">
              <span className="text-[#94A3B8] font-bold w-4 text-right">{i+1}</span>
              <img src={getLogo(c)} alt={c} className="w-5 h-5 bg-white rounded p-0.5" />
              <span className="font-medium hover:text-[#2DD4BF] cursor-pointer transition-colors">{c}</span>
            </div>
            <span className="bg-[#1E293B] text-[#94A3B8] px-2 py-0.5 rounded text-[10px]">{200 - i * 30}</span>
          </div>
        ))}
      </div>
      <button className="text-[#2DD4BF] text-xs font-semibold mt-5 flex items-center gap-1 hover:text-[#14B8A6]">
        View all <ChevronRight className="w-3 h-3" />
      </button>
    </div>
  )
}

function TopContributors() {
  const colors = ['bg-purple-500', 'bg-green-500', 'bg-orange-500']
  return (
    <div className="bg-[#0B1110]/80 border border-white/5 rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
      <h3 className="text-white font-bold mb-4 flex items-center gap-2">
        <Trophy className="w-5 h-5 text-yellow-500" /> Top Contributors
      </h3>
      <div className="flex flex-col gap-4">
        {['Anon User', 'Student123', 'CodeNinja'].map((c, i) => (
          <div key={c} className="flex items-center justify-between text-xs text-slate-200">
            <div className="flex items-center gap-3">
              <span className="text-[#94A3B8] font-bold w-4 text-right">{i+1}</span>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${colors[i]}`}>
                {c.charAt(0)}
              </div>
              <span className="font-medium hover:text-[#2DD4BF] cursor-pointer transition-colors">{c}</span>
            </div>
            <span className="text-[#94A3B8] text-[10px]">{60 - i * 15} experiences</span>
          </div>
        ))}
      </div>
      <button className="text-[#2DD4BF] text-xs font-semibold mt-5 flex items-center gap-1 hover:text-[#14B8A6]">
        View leaderboard <ChevronRight className="w-3 h-3" />
      </button>
    </div>
  )
}

function SubmissionModal({ onClose }) {
  const { register, handleSubmit } = useForm()
  const [submitExp, { isLoading }] = useSubmitExperienceMutation()
  const [msg, setMsg] = useState('')

  const onSubmit = async (data) => {
    const questions = data.questions.split('\n').filter(q => q.trim().length > 0)
    try {
      await submitExp({
        company: data.company, role: data.role, outcome: data.outcome,
        dateOfInterview: data.date, content: data.content, questionsAsked: questions,
        isAnonymous: data.isAnonymous
      }).unwrap()
      setMsg('Submitted successfully! Waiting for admin approval.')
      setTimeout(onClose, 2000)
    } catch (err) {
      setMsg(err.data?.error || 'Submission failed')
    }
  }

  return (
    <div className="fixed inset-0 bg-[#070B0A]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#0B1110] border border-white/10 w-full max-w-[600px] rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <span className="text-[#2DD4BF]">✦</span> Share Interview Experience
        </h2>
        {msg && <div className="p-3 bg-[#14B8A6]/10 text-[#2DD4BF] border border-[#14B8A6]/20 rounded-lg mb-4 text-sm font-medium">{msg}</div>}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 text-sm text-slate-300">
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#94A3B8] mb-1.5 uppercase">Company</label>
              <input type="text" required {...register('company')} className="w-full bg-[#070B0A] border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:border-[#2DD4BF]" placeholder="e.g. Google" />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#94A3B8] mb-1.5 uppercase">Role</label>
              <input type="text" required {...register('role')} className="w-full bg-[#070B0A] border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:border-[#2DD4BF]" placeholder="e.g. SWE Intern" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#94A3B8] mb-1.5 uppercase">Outcome</label>
              <select required {...register('outcome')} className="w-full bg-[#070B0A] border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:border-[#2DD4BF]">
                <option value="awaiting">Awaiting Result</option>
                <option value="offer">Got Offer</option>
                <option value="rejected">Rejected</option>
                <option value="ghosted">Ghosted</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#94A3B8] mb-1.5 uppercase">Date</label>
              <input type="date" required {...register('date')} className="w-full bg-[#070B0A] border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:border-[#2DD4BF] [&::-webkit-calendar-picker-indicator]:invert" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#94A3B8] mb-1.5 uppercase">Experience Details</label>
            <textarea required rows="4" {...register('content')} className="w-full bg-[#070B0A] border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:border-[#2DD4BF]" placeholder="Describe the interview process..."></textarea>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#94A3B8] mb-1.5 uppercase">Questions Asked</label>
            <textarea rows="3" {...register('questions')} className="w-full bg-[#070B0A] border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:border-[#2DD4BF]" placeholder="One question per line..."></textarea>
          </div>

          <label className="flex items-center gap-2 cursor-pointer mt-2 w-max text-xs font-semibold">
            <input type="checkbox" {...register('isAnonymous')} defaultChecked className="accent-[#14B8A6] w-4 h-4" />
            Post Anonymously
          </label>

          <div className="flex gap-4 mt-4">
            <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-lg border border-white/10 text-white font-semibold hover:bg-white/5 transition-colors">Cancel</button>
            <button type="submit" disabled={isLoading} className="flex-1 bg-[#14B8A6] hover:bg-[#0D9488] text-white font-bold py-2.5 rounded-lg transition-colors disabled:opacity-50">Submit Experience</button>
          </div>
        </form>
      </div>
    </div>
  )
}
