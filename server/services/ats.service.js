const { LEVEL_WEIGHTS, scoreResume } = require('./ats.rules')

const PROMPT_VERSION = 'ats-rules-v1'

/**
 * Builds the ATS analysis prompt.
 * User content is injected after a clear delimiter so prompt injection
 * from the resume text cannot override the system instructions.
 *
 * @param {string} resumeText - The raw resume content
 * @param {string} level - fresher | intermediate | experienced
 * @returns {string} - The complete prompt
 */
function buildATSPrompt(resumeText, level) {
  const weights = LEVEL_WEIGHTS[level] || LEVEL_WEIGHTS.fresher

  return `You are an ATS (Applicant Tracking System) evaluator specialised in the Indian job market.
You evaluate resumes for ${level} candidates using LEVEL-AWARE scoring.

SCORING WEIGHTS FOR A ${level.toUpperCase()} CANDIDATE:
${Object.entries(weights)
  .filter(([, w]) => w > 0)
  .map(([k, v]) => `- ${k}: ${Math.round(v * 100)}%`)
  .join('\n')}

IMPORTANT INSTRUCTIONS:
- Score candidates against others at their SAME LEVEL, not against senior engineers.
- A fresher with strong projects, good skills, and a well-structured education section should score 70+.
- The feedback must be specific and actionable, not generic.
- The one_week_fix_plan must be tasks a student can realistically complete in one week.
- Return ONLY valid JSON. No markdown, no explanation, no extra text before or after the JSON.
- All scores are 0-100.
- Write in clear, encouraging English appropriate for Indian students.

OUTPUT FORMAT (strict JSON):
{
  "overall_score": <weighted composite 0-100>,
  "breakdown": {
    "skills": <0-100>,
    "projects": <0-100>,
    "education": <0-100>,
    "experience": <0-100>,
    "certifications": <0-100>
  },
  "feedback": ["specific improvement tip 1", "..."],
  "strengths": ["what this resume does well 1", "..."],
  "missing_keywords": ["keyword 1", "..."],
  "one_week_fix_plan": ["Day 1-2: task", "Day 3-4: task", "..."]
}

--- RESUME CONTENT BELOW THIS LINE ---
${resumeText}
--- END OF RESUME CONTENT ---`
}

/**
 * Scores a resume with the deterministic rule engine.
 * The numeric score does not come from Gemini. The same text and level
 * always produce the same compatibility score and the same level score.
 *
 * @param {string} resumeText
 * @param {'fresher'|'intermediate'|'experienced'|string} level
 */
async function analyseResume(resumeText, level = 'fresher') {
  const scored = scoreResume(resumeText, level)
  return {
    ...scored,
    promptVersion: PROMPT_VERSION,
    modelUsed: 'rules-engine',
    analysedAt: new Date(),
  }
}

module.exports = {
  analyseResume,
  buildATSPrompt,
  LEVEL_WEIGHTS,
  PROMPT_VERSION,
}
