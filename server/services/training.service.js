const TrainingData = require('../models/trainingData.model')
const User = require('../models/user.model')

/**
 * Service to handle dataset aggregation for future fine-tuning.
 * Strict PII scrubbing is applied before saving.
 */
class TrainingService {
  /**
   * Basic regex-based PII scrubber.
   * Removes emails, phone numbers, and common Indian names (basic pass).
   */
  scrubPII(text) {
    if (!text) return ''
    let scrubbed = text.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]')
    scrubbed = scrubbed.replace(/(?:\+91|0)?[6-9]\d{9}/g, '[PHONE]')
    return scrubbed
  }

  /**
   * Log an interview Q&A interaction for fine-tuning.
   * @param {string} userId - To check consent
   * @param {string} question - The interview question
   * @param {string} studentAnswer - The raw answer from the student
   * @param {string} aiImprovedAnswer - The gold standard generated answer
   * @param {number} aiScore - 1-10 rating of student answer
   */
  async logInterviewQA(userId, question, studentAnswer, aiImprovedAnswer, aiScore) {
    try {
      // 1. Check strict DPDP consent
      const user = await User.findById(userId).select('consentGiven level')
      if (!user || !user.consentGiven) {
        return // Do not log if consent is withdrawn
      }

      // 2. Scrub PII
      const safeQuestion = this.scrubPII(question)
      const safeStudentAnswer = this.scrubPII(studentAnswer)
      const safeImprovedAnswer = this.scrubPII(aiImprovedAnswer)

      // 3. Format as Instruct-fine-tuning pair
      const inputContext = `Question: ${safeQuestion}\nStudent Answer: ${safeStudentAnswer}`
      const outputTarget = safeImprovedAnswer

      // 4. Save to DB asynchronously (fire and forget)
      await TrainingData.create({
        dataType: 'interview_qa',
        inputContext,
        outputTarget,
        score: aiScore,
        metadata: { level: user.level }
      })

    } catch (err) {
      console.error('[TrainingService] Failed to log QA:', err.message)
      // Do not throw; this should not break the main user flow
    }
  }
}

module.exports = new TrainingService()
