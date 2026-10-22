const { scoreResume, weightedOverall, normalizeLevel } = require('../../services/ats.rules')

const STRONG_FRESHER = `
Priya Sharma
priya.sharma@example.com | +91 9876543210 | Bengaluru, India
https://linkedin.com/in/priya-sharma
https://github.com/priya-sharma

Summary
Final-year computer science student looking for a software role.

Education
B.Tech Computer Science, National Institute of Technology Karnataka, 2022 - 2026
CGPA: 8.6

Projects
Campus ATS
- Built a resume checker in React and Node.js used by 120 students
- Developed keyword gap reports that cut review time by 30%
- https://github.com/priya-sharma/campus-ats
Placement tracker
- Implemented a MongoDB tracker for 40 campus applications
- Automated weekly status emails with Python

Skills
JavaScript, React, Node.js, MongoDB, Python, SQL, Git, HTML, CSS, Data Structures

Internships
Software intern, College Lab, Jan 2025 - Apr 2025
- Built an internal admin page in React for 15 staff
- Reduced manual data entry by 25%

Certifications
AWS Cloud Practitioner, Amazon, 2025
`

function without(text, pattern) {
  return text.replace(pattern, '')
}

function byId(result, id) {
  return result.checks.find((item) => item.id === id)
}

describe('scoreResume', () => {
  it('returns the same result for the same resume', () => {
    expect(scoreResume(STRONG_FRESHER, 'fresher')).toEqual(scoreResume(STRONG_FRESHER, 'fresher'))
  })

  it('makes the level score the weighted sum of the section scores', () => {
    const result = scoreResume(STRONG_FRESHER, 'fresher')
    expect(result.overall).toBe(weightedOverall(result.breakdown, result.weights))
    expect(result.weights.experience).toBe(0)
    expect(result.weights.projects).toBe(0.40)
  })

  it('makes compatibility the stated mix of search, headings, impact, and skills', () => {
    const result = scoreResume(STRONG_FRESHER, 'fresher')
    expect(result.compatibility).toBe(weightedOverall(
      {
        search: result.compatibilityBreakdown.searchability,
        headings: result.compatibilityBreakdown.headings,
        impact: result.compatibilityBreakdown.impact,
        skillcoverage: result.compatibilityBreakdown.skills,
      },
      { search: 0.30, headings: 0.25, impact: 0.25, skillcoverage: 0.20 }
    ))
  })

  it('scores a project-heavy fresher above the same text scored as experienced', () => {
    const fresher = scoreResume(STRONG_FRESHER, 'fresher')
    const experienced = scoreResume(STRONG_FRESHER, 'experienced')
    expect(fresher.overall).toBeGreaterThan(experienced.overall)
    expect(fresher.breakdown).toEqual(experienced.breakdown)
    expect(experienced.weights.experience).toBe(0.40)
  })

  it('maps junior to the intermediate weights', () => {
    expect(normalizeLevel('junior')).toBe('intermediate')
    const junior = scoreResume(STRONG_FRESHER, 'junior')
    const intermediate = scoreResume(STRONG_FRESHER, 'intermediate')
    expect(junior.level).toBe('intermediate')
    expect(junior.overall).toBe(intermediate.overall)
    expect(junior.weights).toEqual(intermediate.weights)
  })

  it('lowers compatibility when the email is removed', () => {
    const withEmail = scoreResume(STRONG_FRESHER, 'fresher')
    const noEmail = scoreResume(without(STRONG_FRESHER, /priya\.sharma@example\.com/), 'fresher')
    expect(byId(withEmail, 'email').passed).toBe(true)
    expect(byId(withEmail, 'email').earned).toBe(25)
    expect(byId(noEmail, 'email').passed).toBe(false)
    expect(noEmail.compatibility).toBeLessThan(withEmail.compatibility)
  })

  it('keeps every check inside its max and both scores inside 0-100', () => {
    const result = scoreResume(STRONG_FRESHER, 'fresher')
    expect(result.overall).toBeGreaterThanOrEqual(0)
    expect(result.overall).toBeLessThanOrEqual(100)
    expect(result.compatibility).toBeGreaterThanOrEqual(0)
    expect(result.compatibility).toBeLessThanOrEqual(100)
    for (const item of result.checks) {
      expect(item.earned).toBeGreaterThanOrEqual(0)
      expect(item.earned).toBeLessThanOrEqual(item.max)
      expect(item.passed).toBe(item.earned === item.max)
    }
  })

  it('gives a strong fresher resume a higher level score than a blank page of text', () => {
    const strong = scoreResume(STRONG_FRESHER, 'fresher')
    const blank = scoreResume('A'.repeat(80), 'fresher')
    expect(strong.overall).toBeGreaterThan(blank.overall)
    expect(strong.compatibility).toBeGreaterThan(blank.compatibility)
    expect(blank.strengths.length).toBeGreaterThan(0)
    expect(blank.feedback.length).toBeGreaterThan(0)
  })

  it('detects the sections, the phone, and a project link on the sample resume', () => {
    const result = scoreResume(STRONG_FRESHER, 'fresher')
    expect(result.sectionsDetected).toEqual(expect.arrayContaining([
      'summary', 'education', 'projects', 'skills', 'experience', 'certifications',
    ]))
    expect(result.signals.email).toBe(true)
    expect(result.signals.phone).toBe(true)
    expect(result.signals.github).toBe(true)
    expect(byId(result, 'project_link').passed).toBe(true)
    expect(byId(result, 'degree').passed).toBe(true)
    expect(result.formula).toContain('projects 40%')
    expect(result.formula).toContain('experience is not counted')
  })
})
