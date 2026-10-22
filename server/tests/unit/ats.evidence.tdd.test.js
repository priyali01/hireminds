const { scoreResumeAgainstJob } = require('../../services/ats/engine')
const { weightedScore } = require('../../services/ats/compatibility')

/**
 * Scoring contract. Change this file before changing the engine.
 * A skill mention is scored once, by how it is used, not by how often it is repeated.
 */

function creditFor(resume) {
  const result = scoreResumeAgainstJob(resume, 'Requirements\n- Docker')
  const row = result.categories.requiredSkills.matched.find((item) => item.name === 'docker')
  return { result, row }
}

const EDUCATION = 'Education\nB.Tech Computer Science, National Institute of Technology, 2022 - 2026'

describe('evidence strength', () => {
  it('scores a demonstrated bullet above a bare skill name, and ignores repeated mentions', () => {
    const bare = creditFor(`Projects\nDocker\n${EDUCATION}`)
    const repeated = creditFor(`Projects\nDocker\nDocker\nDocker\nDocker\n${EDUCATION}`)
    const used = creditFor(`
Projects
Docker
Experience
- Shipped the campus portal with Docker for 200 students
${EDUCATION}`)
    const listed = creditFor(`Skills\nDocker, Git\n${EDUCATION}`)

    expect(used.row.credit).toBe(100)
    expect(used.row.section).toBe('experience')
    expect(used.row.snippet).toMatch(/campus portal/i)
    expect(bare.row.credit).toBe(70)
    expect(bare.row.section).toBe('projects')
    expect(bare.row.credit).toBeGreaterThan(listed.row.credit)
    expect(listed.row.credit).toBe(60)
    expect(repeated.row.credit).toBe(bare.row.credit)
    expect(repeated.result.categories.requiredSkills.score).toBe(bare.result.categories.requiredSkills.score)
  })

  it('keeps keyword coverage, evidence confidence and document compatibility out of the job match', () => {
    const result = scoreResumeAgainstJob(`
Projects
- Shipped the campus portal with Docker for 200 students
${EDUCATION}
Skills
Docker`, `Requirements
- Docker

Responsibilities
- Keep the on-call rotation healthy for the platform`)
    const categoryScores = Object.fromEntries(
      Object.entries(result.categories).map(([key, category]) => [key, category.score])
    )
    expect(result.scoreExact).toBeCloseTo(weightedScore(categoryScores, result.weights), 5)
    expect(result.evidenceConfidence.score).not.toBe(result.scoreExact)
    expect(result.compatibility.scoreExact).not.toBe(result.scoreExact)
    expect(result.keywordCoverage.percent).not.toBe(result.scoreExact)
  })
})
