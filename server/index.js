const express = require('express')
const cors = require('cors')
require('dotenv').config()

const { GoogleGenerativeAI } = require('@google/generative-ai')
const multer = require('multer')
const pdfParse = require('pdf-parse-fork')

const app = express()
app.use(cors())
app.use(express.json())

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
const upload = multer({ storage: multer.memoryStorage() })

async function analyzeResume(resumeText, level) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const prompt = `
You are an ATS evaluator for the Indian job market.
Analyze this resume for a ${level} candidate.

Resume:
${resumeText}

Return ONLY this JSON, no extra text:
{
  "overall_score": number between 0-100,
  "breakdown": {
    "skills": number,
    "projects": number,
    "education": number
  },
  "feedback": ["tip 1", "tip 2", "tip 3"],
  "strengths": ["strength 1", "strength 2"],
  "missing_keywords": ["keyword 1", "keyword 2"]
}
`

  const result = await model.generateContent(prompt)
  const text = result.response.text()
  const clean = text.replace(/```json|```/g, '').trim()

  try {
    return JSON.parse(clean)
  } catch {
    throw new Error('Invalid AI response — could not parse JSON')
  }
}

app.post('/analyze', async (req, res) => {
  try {
    const { resumeText, level } = req.body
    if (!resumeText) return res.status(400).json({ error: 'resumeText is required' })
    const result = await analyzeResume(resumeText, level || 'fresher')
    res.json(result)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

app.post('/upload-and-analyze', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' })

    const level = req.body.level || 'fresher'

    const pdfData = await pdfParse(req.file.buffer)
    const resumeText = pdfData.text

    if (!resumeText || resumeText.trim().length < 50) {
      return res.status(400).json({ error: 'Could not extract text from PDF' })
    }

    const result = await analyzeResume(resumeText, level)
    res.json({ ...result, preview: resumeText.slice(0, 200) })

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Upload failed', details: err.message })
  }
})

app.listen(3001, () => console.log('Server running on port 3001'))