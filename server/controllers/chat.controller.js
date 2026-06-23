const { GoogleGenerativeAI } = require('@google/generative-ai')
const User = require('../models/user.model')
const Resume = require('../models/resume.model')
const Interview = require('../models/interview.model')
const { z } = require('zod')
const { QuotaError } = require('../utils/errors')

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

const chatSchema = z.object({
  message: z.string().min(1).max(1000),
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    parts: z.array(z.object({ text: z.string() }))
  })).optional().default([])
})

/**
 * POST /chat
 * The Agentic Career Assistant
 * Contextualizes the prompt with the user's resume and interview stats.
 */
async function handleChat(req, res, next) {
  try {
    const { message, history } = chatSchema.parse(req.body)

    const user = await User.findById(req.user.userId)
    
    // Quick quota check (treat chat messages like AI Usage)
    if (user.plan === 'free' && user.aiUsageToday >= 5) {
      throw new QuotaError(user.lastQuotaReset)
    }

    // 1. GATHER CONTEXT (The "Agentic" part)
    // Find the user's best or latest resume
    const latestResume = await Resume.findOne({ userId: user._id }).sort({ createdAt: -1 })
    
    // Find recent interview performance
    const recentInterviews = await Interview.find({ userId: user._id, status: 'completed' })
      .sort({ createdAt: -1 })
      .limit(3)
      .select('role type overallScore answers')

    let interviewContext = "No recent interviews."
    if (recentInterviews.length > 0) {
      const avgScore = (recentInterviews.reduce((acc, curr) => acc + curr.overallScore, 0) / recentInterviews.length).toFixed(1)
      interviewContext = `Recent Interviews: ${recentInterviews.length}. Average Score: ${avgScore}/10.`
    }

    // 2. CONSTRUCT SYSTEM PROMPT
    const systemInstruction = `
You are the HireMinds AI Career Assistant, a highly intelligent and encouraging coach.
Your job is to answer the user's questions about their career, interviews, or resume.

USER CONTEXT:
Name: ${user.fullName}
Level: ${user.level}
Target Roles: ${user.targetRoles?.join(', ') || 'Not specified'}
Gamification Points: ${user.points}
Current Streak: ${user.currentStreak}

RESUME CONTEXT:
${latestResume ? `They have a resume uploaded targeting ${latestResume.targetRole || 'their goals'}. Resume ATS Score: ${latestResume.atsScore || 'N/A'}/100.
Key strengths: ${latestResume.aiAnalysis?.strengths?.join(', ') || 'None found'}
Weaknesses: ${latestResume.aiAnalysis?.weaknesses?.join(', ') || 'None found'}` : 'No resume uploaded yet.'}

INTERVIEW CONTEXT:
${interviewContext}

INSTRUCTIONS:
1. Be concise, direct, and actionable. Do not write essays.
2. Use the provided context to personalize your advice. If they ask "what should I improve", point to their resume weaknesses or interview scores.
3. If they don't have a resume uploaded or interviews completed, encourage them to use those modules in the platform!
`

    // 3. INIT CHAT SESSION WITH CONTEXTUAL MODEL
    const contextualModel = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction
    })

    const chat = contextualModel.startChat({
      history: history
    })

    // 4. GET RESPONSE
    const result = await chat.sendMessage(message)
    const aiResponseText = result.response.text()

    // 5. UPDATE QUOTA
    await User.findByIdAndUpdate(user._id, { $inc: { aiUsageToday: 1 } })

    res.json({ success: true, response: aiResponseText })
  } catch (err) {
    next(err)
  }
}

module.exports = {
  handleChat
}
