import { Star, Quote } from 'lucide-react'

export default function Testimonial() {
  return (
    <div className="bg-[#0f0b29]/60 backdrop-blur-xl border border-white/[0.05] rounded-3xl p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] flex flex-col md:flex-row items-center gap-6">
      
      <div className="text-[#a855f7] opacity-60">
        <Quote className="w-10 h-10 fill-current" />
      </div>

      <div className="flex-1">
        <p className="text-slate-300 text-sm leading-relaxed mb-3">
          HireMinds helped me improve my resume and crack interviews with confidence. Highly recommended!
        </p>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star key={star} className="w-3.5 h-3.5 fill-[#f59e0b] text-[#f59e0b]" />
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 border-t md:border-t-0 md:border-l border-white/[0.05] pt-4 md:pt-0 md:pl-6 w-full md:w-auto shrink-0 justify-center md:justify-start">
        <img 
          src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&q=80" 
          alt="Arjun S." 
          className="w-10 h-10 rounded-full object-cover border border-white/[0.1]"
        />
        <div>
          <div className="text-sm font-semibold text-white">Arjun S.</div>
          <div className="text-xs text-slate-400">
            Placed at <span className="text-[#a855f7] font-medium">Google</span>
          </div>
        </div>
      </div>

    </div>
  )
}
