/**
 * Prompt templates for Job Matcher and Insight Engine.
 */

const buildJDMatchPrompt = (resumeText, jobDescription) => `You are an expert technical recruiter and ATS software analyzer.
Compare the following candidate's resume against the provided Job Description (JD).

Resume:
${resumeText}

Job Description:
${jobDescription}

Provide a comprehensive match analysis based strictly on the required skills, experience, and keywords in the JD.

Return ONLY valid JSON matching this structure:
{
  "score": <Number 0-100 representing the match percentage>,
  "matchedKeywords": ["Keyword 1", "Keyword 2"],
  "missingKeywords": ["Missing Keyword 1", "Missing Keyword 2"],
  "suggestions": ["Specific, actionable suggestion to improve the resume for this JD"]
}`

const buildInsightExtractionPrompt = (roleTitle, searchResultsText) => `You are a career analyst building a job profile for the role of "${roleTitle}".
Extract structured insights about this role based on the following web search data:

Web Search Data:
${searchResultsText}

Provide a realistic, data-driven profile for this role in the Indian market.

Return ONLY valid JSON matching this structure:
{
  "role": "${roleTitle}",
  "requiredSkills": ["Skill 1", "Skill 2", "Skill 3", "Skill 4", "Skill 5"],
  "salaryTrends": {
    "min": "e.g., ₹4LPA",
    "max": "e.g., ₹15LPA",
    "median": "e.g., ₹8LPA"
  },
  "interviewProcess": ["e.g., Online Assessment", "e.g., Technical Round 1", "e.g., HR Round"],
  "topCompanies": ["Company A", "Company B", "Company C"],
  "growthOutlook": "1-2 sentence summary of future growth and demand"
}`

module.exports = {
  buildJDMatchPrompt,
  buildInsightExtractionPrompt
}
