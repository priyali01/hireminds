/**
 * TDD: ATS service unit tests.
 * These tests verify the level-aware scoring weights and prompt construction,
 * and mock Gemini API calls so tests never hit real APIs.
 */
const { setupTestDB, clearDB, teardownTestDB } = require('../helpers/db.helper')
const { buildATSPrompt, LEVEL_WEIGHTS, analyseResume } = require('../../services/ats.service')

// ---- Mock the Gemini SDK ----
// We mock @google/generative-ai so no real API calls are made in tests.
// The mock always returns a valid ATS JSON response.
jest.mock('@google/generative-ai', () => {
  const mockGenerateContent = jest.fn().mockResolvedValue({
    response: {
      text: () => JSON.stringify({
        overall_score: 72,
        breakdown: {
          skills: 80,
          projects: 70,
          education: 65,
          experience: 0,
          certifications: 60,
        },
        feedback: ['Add more project descriptions', 'Include GitHub links'],
        strengths: ['Strong technical skills', 'Relevant project experience'],
        missing_keywords: ['Docker', 'CI/CD'],
        one_week_fix_plan: ['Day 1-2: Add project bullet points', 'Day 3: Add GitHub links'],
      }),
    },
  })

  return {
    GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
      getGenerativeModel: jest.fn().mockReturnValue({
        generateContent: mockGenerateContent,
      }),
    })),
  }
})

beforeAll(async () => {
  process.env.GEMINI_API_KEY = 'test_key_not_real'
  await setupTestDB()
})

afterEach(async () => {
  await clearDB()
})

afterAll(async () => {
  await teardownTestDB()
})

// ==========================================
// LEVEL_WEIGHTS
// ==========================================
describe('LEVEL_WEIGHTS', () => {
  it('fresher weights sum to 1.0', () => {
    const total = Object.values(LEVEL_WEIGHTS.fresher).reduce((a, b) => a + b, 0)
    expect(total).toBeCloseTo(1.0, 5)
  })

  it('intermediate weights sum to 1.0', () => {
    const total = Object.values(LEVEL_WEIGHTS.intermediate).reduce((a, b) => a + b, 0)
    expect(total).toBeCloseTo(1.0, 5)
  })

  it('experienced weights sum to 1.0', () => {
    const total = Object.values(LEVEL_WEIGHTS.experienced).reduce((a, b) => a + b, 0)
    expect(total).toBeCloseTo(1.0, 5)
  })

  it('fresher gives 40% weight to projects', () => {
    expect(LEVEL_WEIGHTS.fresher.projects).toBe(0.40)
  })

  it('fresher gives 0% weight to experience', () => {
    expect(LEVEL_WEIGHTS.fresher.experience).toBe(0)
  })

  it('experienced gives 40% weight to experience', () => {
    expect(LEVEL_WEIGHTS.experienced.experience).toBe(0.40)
  })

  it('experienced gives only 15% to projects (vs 40% for fresher)', () => {
    expect(LEVEL_WEIGHTS.experienced.projects).toBe(0.15)
  })
})

// ==========================================
// buildATSPrompt
// ==========================================
describe('buildATSPrompt', () => {
  const sampleResume = 'John Doe\nB.Tech CS\nProjects: Built a MERN app\nSkills: React, Node.js'

  it('includes the candidate level in the prompt', () => {
    const prompt = buildATSPrompt(sampleResume, 'fresher')
    expect(prompt).toContain('FRESHER')
  })

  it('includes the resume content after a clear delimiter', () => {
    const prompt = buildATSPrompt(sampleResume, 'fresher')
    // Resume content must come AFTER the delimiter to prevent prompt injection
    const delimIndex = prompt.indexOf('--- RESUME CONTENT BELOW THIS LINE ---')
    const resumeIndex = prompt.indexOf(sampleResume)
    expect(delimIndex).toBeGreaterThan(0)
    expect(resumeIndex).toBeGreaterThan(delimIndex)
  })

  it('specifies return ONLY valid JSON', () => {
    const prompt = buildATSPrompt(sampleResume, 'fresher')
    expect(prompt).toContain('Return ONLY valid JSON')
  })

  it('shows fresher weight breakdown in the prompt', () => {
    const prompt = buildATSPrompt(sampleResume, 'fresher')
    expect(prompt).toContain('projects: 40%')
    expect(prompt).toContain('skills: 30%')
    expect(prompt).toContain('education: 20%')
  })

  it('shows experienced weight breakdown for experienced level', () => {
    const prompt = buildATSPrompt(sampleResume, 'experienced')
    expect(prompt).toContain('experience: 40%')
    expect(prompt).toContain('skills: 30%')
  })

  it('does not include experience weight for freshers (0% not shown)', () => {
    const prompt = buildATSPrompt(sampleResume, 'fresher')
    // experience: 0% should be filtered out (filter(([, w]) => w > 0))
    expect(prompt).not.toContain('experience:')
  })
})

// ==========================================
// analyseResume (with mocked Gemini)
// ==========================================
describe('analyseResume', () => {
  const sampleText = 'A'.repeat(100) // Minimum 50 chars

  it('returns an overall score as a number', async () => {
    const result = await analyseResume(sampleText, 'fresher')
    expect(typeof result.overall).toBe('number')
    expect(result.overall).toBeGreaterThanOrEqual(0)
    expect(result.overall).toBeLessThanOrEqual(100)
  })

  it('returns breakdown with all expected fields', async () => {
    const result = await analyseResume(sampleText, 'fresher')
    expect(result.breakdown).toHaveProperty('skills')
    expect(result.breakdown).toHaveProperty('projects')
    expect(result.breakdown).toHaveProperty('education')
    expect(result.breakdown).toHaveProperty('experience')
    expect(result.breakdown).toHaveProperty('certifications')
  })

  it('returns non-empty feedback array', async () => {
    const result = await analyseResume(sampleText, 'fresher')
    expect(Array.isArray(result.feedback)).toBe(true)
    expect(result.feedback.length).toBeGreaterThan(0)
  })

  it('returns non-empty strengths array', async () => {
    const result = await analyseResume(sampleText, 'fresher')
    expect(Array.isArray(result.strengths)).toBe(true)
    expect(result.strengths.length).toBeGreaterThan(0)
  })

  it('records promptVersion and modelUsed', async () => {
    const result = await analyseResume(sampleText, 'fresher')
    expect(result.promptVersion).toBe('ats-v1.0')
    expect(typeof result.modelUsed).toBe('string')
  })

  it('records analysedAt as a Date object', async () => {
    const result = await analyseResume(sampleText, 'fresher')
    expect(result.analysedAt).toBeInstanceOf(Date)
  })
})
