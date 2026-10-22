const { combineScores } = require('../../services/ats/engine')
const { scoreResumeAgainstJob } = require('../../services/ats/engine')
const { assertWeights } = require('../../config/ats.config')
const { findAlias } = require('../../services/ats/match')

const GOOD_JD = `
Backend Developer

Requirements
- JavaScript
- Node.js
- MongoDB
- REST API
- Bachelor degree

Preferred
- Docker

Responsibilities
- Build REST APIs for campus applications
- Design MongoDB schemas for student records
`

const GOOD_RESUME = `
Priya Sharma
priya@example.com
9999999999

Summary
Backend student building campus tools.

Education
B.Tech Computer Science, National Institute of Technology, 2022 - 2026

Projects
Campus API
- Built REST APIs in Node.js and JavaScript for 200 campus applications
- Designed MongoDB schemas for student records
- Shipped the service with Docker
https://github.com/priya/campus-api

Experience
Backend intern, College Lab, Jan 2025 - Apr 2025
- Built REST APIs in Node.js for campus applications
- Designed MongoDB schemas used by 15 staff

Skills
JavaScript, Node.js, MongoDB, Git
`

const WEAK_RESUME = `
Asha Verma
asha@example.com

Summary
Strong communication and teamwork. I enjoy capacity planning for college events.

Education
B.A. English, City College, 2022 - 2026

Experience
Club volunteer, 2024 - 2025
- Organized weekly meetings for 30 students
`

describe('combineScores', () => {
  it('weights 80, 70, 90, 60 and 100 to 79', () => {
    const result = combineScores({
      requiredSkills: 80,
      experience: 70,
      projects: 90,
      preferred: 60,
      educationReadability: 100,
    })
    expect(result.scoreExact).toBeCloseTo(79, 5)
    expect(result.scoreDisplay).toBe(79)
    expect(result.passesThreshold).toBe(true)
  })

  it('keeps a score just under 75 locked when the displayed value would round up', () => {
    const result = combineScores({
      requiredSkills: 74.96,
      experience: 74.96,
      projects: 74.96,
      preferred: 74.96,
      educationReadability: 74.96,
    })
    expect(result.scoreDisplay).toBe(75)
    expect(result.passesThreshold).toBe(false)
  })

  it('unlocks at exactly 75 and above', () => {
    const at = combineScores({
      requiredSkills: 75,
      experience: 75,
      projects: 75,
      preferred: 75,
      educationReadability: 75,
    })
    const above = combineScores({
      requiredSkills: 75.01,
      experience: 75.01,
      projects: 75.01,
      preferred: 75.01,
      educationReadability: 75.01,
    })
    expect(at.passesThreshold).toBe(true)
    expect(above.passesThreshold).toBe(true)
  })

  it('rejects weights that do not sum to 100', () => {
    expect(() => assertWeights({
      requiredSkills: 35,
      experience: 20,
      projects: 20,
      preferred: 15,
      educationReadability: 5,
    })).toThrow(/sum to 100/)
  })
})

describe('whole-word skill matching', () => {
  it('does not treat the letter c inside communication as the C language', () => {
    expect(findAlias('Strong communication skills', 'c')).toBeNull()
    expect(findAlias('Languages: C, Python', 'c')).not.toBeNull()
    expect(findAlias('Wrote services in C++', 'c')).toBeNull()
  })

  it('does not treat JavaScript as Java', () => {
    expect(findAlias('Built a JavaScript app', 'java')).toBeNull()
    expect(findAlias('Built a Java service', 'java')).not.toBeNull()
  })

  it('treats JS as JavaScript', () => {
    const result = scoreResumeAgainstJob(
      'Projects\n- Built the portal in JS and Node.js with MongoDB and a REST API\nEducation\nB.Tech Computer Science\nSkills\nJS, Node.js, MongoDB',
      'Requirements\n- JavaScript\n- Node.js\n- MongoDB\n- REST API'
    )
    const matched = result.categories.requiredSkills.matched.map((item) => item.name)
    expect(matched).toEqual(expect.arrayContaining(['javascript', 'node.js', 'mongodb', 'rest api']))
    expect(result.categories.requiredSkills.missing.map((item) => item.name)).not.toContain('javascript')
  })
})

describe('scoreResumeAgainstJob', () => {
  it('gives a relevant resume evidence and a higher score than a resume that misses the required skills', () => {
    const good = scoreResumeAgainstJob(GOOD_RESUME, GOOD_JD, { nowYear: 2026 })
    const weak = scoreResumeAgainstJob(WEAK_RESUME, GOOD_JD, { nowYear: 2026 })

    expect(good.status).toBe('completed')
    expect(good.scoreExact).toBeGreaterThan(weak.scoreExact)
    expect(good.categories.requiredSkills.matched.map((item) => item.name)).toEqual(
      expect.arrayContaining(['javascript', 'node.js', 'mongodb', 'rest api'])
    )
    expect(good.categories.requiredSkills.matched.every((item) => item.snippet.length > 0)).toBe(true)
    expect(weak.categories.requiredSkills.missing.map((item) => item.name)).toEqual(
      expect.arrayContaining(['javascript', 'node.js', 'mongodb', 'rest api'])
    )
    expect(weak.scoreExact).toBeLessThan(75)
    expect(good.passesThreshold).toBe(true)
  })

  it('keeps preferred skills out of the required miss list', () => {
    const withoutDocker = GOOD_RESUME.replace('- Shipped the service with Docker\n', '')
    const result = scoreResumeAgainstJob(withoutDocker, GOOD_JD, { nowYear: 2026 })
    expect(result.categories.requiredSkills.missing.map((item) => item.name)).not.toContain('docker')
    expect(result.categories.preferred.missing.map((item) => item.name)).toContain('docker')
  })

  it('gives a skill shown in a project more required-skill credit than the same skill only in a list', () => {
    const jd = 'Requirements\n- Docker'
    const listed = scoreResumeAgainstJob('Skills\nDocker, Git\nEducation\nB.Tech Computer Science, 2022 - 2026\nProjects\n- Built a notes app', jd)
    const used = scoreResumeAgainstJob('Skills\nGit\nEducation\nB.Tech Computer Science, 2022 - 2026\nProjects\n- Built a notes app and shipped it with Docker', jd)
    const listedCredit = listed.categories.requiredSkills.matched.find((item) => item.name === 'docker').credit
    const usedCredit = used.categories.requiredSkills.matched.find((item) => item.name === 'docker').credit
    expect(listedCredit).toBe(60)
    expect(usedCredit).toBe(100)
    expect(used.categories.requiredSkills.score).toBeGreaterThan(listed.categories.requiredSkills.score)
  })

  it('does not invent a score when the job description has no verifiable required skills', () => {
    const result = scoreResumeAgainstJob(GOOD_RESUME, 'We are a friendly team that likes curious people and clear writing every day.')
    expect(result.status).toBe('incomplete')
    expect(result.scoreExact).toBeNull()
    expect(result.gateEligible).toBe(false)
    expect(result.passesThreshold).toBe(false)
  })

  it('returns the same score for the same resume and job', () => {
    const first = scoreResumeAgainstJob(GOOD_RESUME, GOOD_JD, { nowYear: 2026 })
    const second = scoreResumeAgainstJob(GOOD_RESUME, GOOD_JD, { nowYear: 2026 })
    expect(second.scoreExact).toBeCloseTo(first.scoreExact, 5)
    expect(second.categories.requiredSkills.score).toBeCloseTo(first.categories.requiredSkills.score, 5)
  })
})
