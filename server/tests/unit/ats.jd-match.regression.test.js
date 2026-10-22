const { parseJobDescription } = require('../../services/ats/jdParser')
const { scoreResumeAgainstJob } = require('../../services/ats/engine')
const { ATS_CONFIG } = require('../../config/ats.config')
const { decideGate } = require('../../services/ats/gate')

const ML_RESUME = `
Priya Sharma
priya@example.com
9876543210

Summary
Machine learning student focused on applied research.

Education
B.Tech Computer Science, National Institute of Technology, 2021 - 2025

Projects
Malware classifier
- Trained a machine learning model in Python and PyTorch to flag suspicious files
- Evaluated precision on a labeled cybersecurity dataset from 2024

Experience
Research intern, College Lab, Jan 2024 - May 2025
- Built pandas pipelines for a machine learning study of network attacks
- Reported the model results to the research group

Skills
Python, PyTorch, pandas, machine learning
`

const ML_JD = `
ML Engineer

Requirements
- Python
- Machine learning
- PyTorch
- pandas

Responsibilities
- Train machine learning models for production datasets
- Evaluate model quality and report the results to the research group
`

const UI_JD = `
Senior UI/UX Designer

About the role
Shape the product interface for a consumer app.

Requirements
- Figma
- Adobe Photoshop
- Illustrator
- UX research
- usability testing
- interaction design
- design systems
- UI/UX

Responsibilities
- Create wireframes and prototypes for new product flows
- Run research sessions with participants and turn findings into interface changes
`

function gateFor(resume, jobDescription) {
  return decideGate({
    resumeText: resume,
    jobDescription,
    rubricVersion: ATS_CONFIG.rubricVersion,
    superseded: false,
  }, { isOwner: true, isLatest: true })
}

describe('job descriptions with a different domain', () => {
  it('scores an ML resume much lower against a UI/UX job than against an ML job', () => {
    const design = scoreResumeAgainstJob(ML_RESUME, UI_JD, { nowYear: 2026 })
    const machine = scoreResumeAgainstJob(ML_RESUME, ML_JD, { nowYear: 2026 })

    expect(design.status).toBe('completed')
    expect(machine.status).toBe('completed')
    expect(design.requirements.extraction.status).toBe('found')
    expect(design.requirements.required.map((item) => item.canonical)).toEqual(
      expect.arrayContaining(['figma', 'photoshop', 'illustrator', 'ux research', 'usability testing', 'interaction design', 'design systems', 'ui/ux'])
    )
    expect(design.categories.requiredSkills.score).toBeLessThan(40)
    expect(design.categories.projectsExperience.score).toBeLessThan(80)
    expect(design.categories.projectsExperience.score).toBeLessThan(machine.categories.projectsExperience.score)
    expect(design.scoreExact).toBeLessThan(50)
    expect(design.scoreExact).toBeLessThan(machine.scoreExact)
    expect(design.compatibility.scoreExact).toBeCloseTo(machine.compatibility.scoreExact, 5)
    expect(design.warnings.join(' ')).not.toMatch(/could not be verified/i)

    const gate = gateFor(ML_RESUME, UI_JD)
    expect(gate.unlocked).toBe(false)
    expect(gate.reason).toBe('below_threshold')
  })

  it('explains project relevance from the job domain instead of dated bullets alone', () => {
    const design = scoreResumeAgainstJob(ML_RESUME, UI_JD, { nowYear: 2026 })
    const category = design.categories.projectsExperience
    expect(category.reasons.join(' ')).toMatch(/domain|responsibilit/i)
    expect(category.reasons.join(' ')).not.toMatch(/described and dated work is a full match/i)
    expect(category.score).not.toBe(100)
  })
})

describe('skill extraction', () => {
  it('reads skills from bullets, headings, and inline qualifications', () => {
    const bullets = parseJobDescription(`
Senior UI/UX Designer for the product team.

- Figma
- Adobe Photoshop
- Illustrator
- UX research
- usability testing
- interaction design
- design systems
`)
    expect(bullets.extraction.status).toBe('found')
    expect(bullets.required.map((item) => item.canonical)).toEqual(
      expect.arrayContaining(['figma', 'photoshop', 'illustrator', 'ux research', 'usability testing', 'interaction design', 'design systems'])
    )

    const inline = parseJobDescription(`
Senior UI/UX Designer
We are looking for a designer with experience in UX/UI, Figma, and Adobe Photoshop.
`)
    expect(inline.required.map((item) => item.canonical)).toEqual(
      expect.arrayContaining(['ui/ux', 'figma', 'photoshop'])
    )
  })

  it('treats UI/UX and UX/UI as the same skill and keeps preferred skills out of required', () => {
    const parsed = parseJobDescription(`
Qualifications
- UX/UI
- Figma

Nice to have
- Adobe Photoshop
- Illustrator
`)
    expect(parsed.required.map((item) => item.canonical)).toEqual(expect.arrayContaining(['ui/ux', 'figma']))
    expect(parsed.required.map((item) => item.canonical)).not.toEqual(expect.arrayContaining(['photoshop', 'illustrator']))
    expect(parsed.preferred.map((item) => item.canonical)).toEqual(expect.arrayContaining(['photoshop', 'illustrator']))

    const scored = scoreResumeAgainstJob(`
Skills
UI/UX, Photoshop
Projects
- Designed the campus portal in Figma
`, `
Qualifications
- UI/UX
- Figma

Preferred
- Photoshop
`)
    expect(scored.categories.requiredSkills.matched.map((item) => item.name)).toEqual(
      expect.arrayContaining(['ui/ux', 'figma'])
    )
    expect(scored.categories.preferred.matched.map((item) => item.name)).toContain('photoshop')
    expect(scored.categories.requiredSkills.missing.map((item) => item.name)).not.toContain('photoshop')
  })

  it('does not turn a responsibility sentence into a required skill', () => {
    const parsed = parseJobDescription(`
Office tools role for a growing campus team.

Responsibilities
- Build marketing pages in Figma and write the handoff notes for engineering
`)
    expect(parsed.required.map((item) => item.canonical)).not.toContain('figma')
    expect(parsed.responsibilities.join(' ')).toMatch(/Figma/)

    const listed = parseJobDescription(`
Design role for a product team that ships a consumer app.

Responsibilities
- Figma
- Build marketing pages in Illustrator and write the handoff notes
`)
    expect(listed.required.map((item) => item.canonical)).toContain('figma')
    expect(listed.required.map((item) => item.canonical)).not.toContain('illustrator')
  })

  it('distinguishes a job with no technical skills from a job that could not be read', () => {
    const plain = scoreResumeAgainstJob(ML_RESUME, `
Office coordinator

Responsibilities
- Schedule weekly team meetings and keep the shared calendar current
- Write clear notes after each meeting for the whole group
`)
    expect(plain.requirements.extraction.status).toBe('none_stated')
    expect(plain.categories.requiredSkills.score).toBeNull()
    expect(plain.categories.requiredSkills.included).toBe(false)
    expect(plain.warnings.join(' ')).toMatch(/no required technical skills were stated/i)
    expect(plain.warnings.join(' ')).not.toMatch(/could not be verified|extraction failure/i)
    expect(plain.status).toBe('completed')
    expect(plain.scoreExact).toBeLessThan(75)
    expect(plain.categories.projectsExperience.score).not.toBe(100)

    const empty = scoreResumeAgainstJob(ML_RESUME, 'UI role')
    expect(empty.status).toBe('incomplete')
    expect(empty.scoreExact).toBeNull()
    expect(empty.requirements.extraction.status).toBe('failed')
    expect(empty.warnings.join(' ')).toMatch(/extraction failure/i)
    expect(empty.warnings.join(' ')).not.toMatch(/could not be verified/i)
    expect(empty.compatibility.status).toBe('scored')
    expect(gateFor(ML_RESUME, 'UI role').reason).toBe('unverified')
  })
})
