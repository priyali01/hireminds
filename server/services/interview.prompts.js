/**
 * Prompt templates for AI interview generation and evaluation.
 */

const buildTechnicalPrompt = (role, resumeContext, count) => `You are a strict technical interviewer for the role of ${role}.
Generate ${count} technical interview questions tailored to the candidate's experience.

Candidate context (Resume excerpt):
${resumeContext || 'No resume provided. Generate standard role-specific questions.'}

Rules:
1. Questions should test real-world problem solving, not just definitions.
2. If resume is provided, ask about specific technologies or projects mentioned.
3. Classify difficulty as easy, medium, or hard.
4. Return ONLY valid JSON matching this structure:
{
  "questions": [
    {
      "text": "The question text",
      "category": "e.g., system design, language specific, problem solving",
      "difficulty": "easy|medium|hard"
    }
  ]
}`

const buildHRPrompt = (role, count) => `You are an HR manager hiring for a ${role} position.
Generate ${count} HR interview questions.

Rules:
1. Focus on cultural fit, conflict resolution, motivation, and career goals.
2. Ensure tone is professional but probing.
3. Return ONLY valid JSON matching this structure:
{
  "questions": [
    {
      "text": "The question text",
      "category": "e.g., cultural fit, motivation",
      "difficulty": "easy|medium|hard"
    }
  ]
}`

const buildBehavioralPrompt = (role, count) => `You are a hiring manager for the role of ${role}.
Generate ${count} behavioral questions that require the candidate to use the STAR (Situation, Task, Action, Result) method.

Rules:
1. Questions should start with phrases like "Tell me about a time when..." or "Give an example of..."
2. Return ONLY valid JSON matching this structure:
{
  "questions": [
    {
      "text": "The question text",
      "category": "behavioral (STAR)",
      "difficulty": "easy|medium|hard"
    }
  ]
}`

const buildEvaluationPrompt = (question, userAnswer, role, roundType) => `You are evaluating an interview answer for a ${role} candidate in a ${roundType || 'general'} interview.

Question asked: "${question}"
Candidate's answer: "${userAnswer}"

Evaluate this answer critically based on:
1. Accuracy and relevance to the question.
2. Structure and clarity (did they use STAR method if behavioral?).
3. Depth of technical knowledge (if technical).

Return ONLY valid JSON matching this strict format:
{
  "score": <Number 1-10>,
  "feedback": "Specific, actionable feedback on what was good and what went wrong.",
  "missingElements": ["Element 1 they missed", "Element 2 they missed"],
  "improvedAnswer": "Rewrite their answer to be a 9/10 or 10/10.",
  "toneAssessment": "Professional, confident, nervous, arrogant, etc."
}`

module.exports = {
  buildTechnicalPrompt,
  buildHRPrompt,
  buildBehavioralPrompt,
  buildEvaluationPrompt,
}
