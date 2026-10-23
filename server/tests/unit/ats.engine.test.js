const { combineScores, scoreResumeAgainstJob } = require('../../services/ats/engine')
const { assertWeights, ATS_CONFIG } = require('../../config/ats.config')
const { findAlias } = require('../../services/ats/match')
const { scoreCompatibility, weightedScore } = require('../../services/ats/compatibility')
const { decideGate } = require('../../services/ats/gate')

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
  it('weights the six job-match categories to 78', () => {
    const result = combineScores({
      requiredSkills: 80,
      projectsExperience: 70,
      responsibilities: 90,
      educationEligibility: 60,
      preferred: 100,
      softSkills: 50,
    })
    expect(result.scoreExact).toBeCloseTo(78, 5)
    expect(result.scoreDisplay).toBe(78)
    expect(result.passesThreshold).toBe(true)
  })

  it('drops categories that were not assessed and renormalizes', () => {
    const result = combineScores({
      requiredSkills: 80,
      projectsExperience: 70,
      responsibilities: 90,
      educationEligibility: 60,
      preferred: null,
      softSkills: null,
    })
    expect(result.scoreExact).toBeCloseTo((30 * 80 + 25 * 70 + 20 * 90 + 10 * 60) / 85, 5)
    expect(result.scoreDisplay).toBe(77.1)
  })

  it('keeps a score just under 75 locked when the displayed value would round up', () => {
    const scores = {
      requiredSkills: 74.96,
      projectsExperience: 74.96,
      responsibilities: 74.96,
      educationEligibility: 74.96,
      preferred: 74.96,
      softSkills: 74.96,
    }
    const result = combineScores(scores)
    expect(result.scoreDisplay).toBe(75)
    expect(result.passesThreshold).toBe(false)
  })

  it('unlocks at exactly 75 and above', () => {
    const at = combineScores({
      requiredSkills: 75,
      projectsExperience: 75,
      responsibilities: 75,
      educationEligibility: 75,
      preferred: 75,
      softSkills: 75,
    })
    const above = combineScores({
      requiredSkills: 75.01,
      projectsExperience: 75.01,
      responsibilities: 75.01,
      educationEligibility: 75.01,
      preferred: 75.01,
      softSkills: 75.01,
    })
    expect(at.passesThreshold).toBe(true)
    expect(above.passesThreshold).toBe(true)
  })

  it('rejects weights that do not sum to 100', () => {
    expect(() => assertWeights({
      requiredSkills: 30,
      projectsExperience: 25,
      responsibilities: 20,
      educationEligibility: 10,
      preferred: 10,
      softSkills: 4,
    })).toThrow(/sum to 100/)
  })
})

describe('document compatibility', () => {
  it('uses the available-weight formula', () => {
    const weights = { extraction: 30, sections: 20, contact: 15, chronology: 15, layout: 20 }
    expect(weightedScore({
      extraction: 100, sections: 100, contact: 100, chronology: 100, layout: null,
    }, weights)).toBe(100)
    expect(weightedScore({
      extraction: 50, sections: 50, contact: 50, chronology: 50, layout: 50,
    }, weights)).toBe(50)
  })

  it('does not invent a score when almost no text was extracted', () => {
    const result = scoreCompatibility('short')
    expect(result.status).toBe('inconclusive')
    expect(result.scoreExact).toBeNull()
  })

  it('scores a readable resume and ignores a job description', () => {
    const result = scoreCompatibility(GOOD_RESUME)
    expect(result.status).toBe('scored')
    expect(result.scoreExact).toBeGreaterThan(50)
    expect(result.components.contact.reasons.join(' ')).toMatch(/email/i)
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
    expect(second.compatibility.scoreExact).toBeCloseTo(first.compatibility.scoreExact, 5)
    expect(second.categories.requiredSkills.score).toBeCloseTo(first.categories.requiredSkills.score, 5)
  })

  it('does not add keyword coverage back into the job match', () => {
    const jd = 'Requirements\n- Docker'
    const listed = scoreResumeAgainstJob('Skills\nDocker, Git\nEducation\nB.Tech Computer Science, 2022 - 2026\nProjects\n- Built a notes app for the campus notice board', jd)
    expect(listed.keywordCoverage.percent).toBe(100)
    expect(listed.categories.requiredSkills.score).toBe(60)
    expect(listed.scoreExact).not.toBe(listed.keywordCoverage.percent)
  })

  it('does not give project credit a second time for a skill already scored as required', () => {
    const base = `
Education
B.Tech Computer Science, 2022 - 2026
Projects
- Built a notes app for campus students and shipped the first version
Experience
Intern, College Lab, 2025 - 2026
- Kept the lab machines running for the student staff
`
    const listed = scoreResumeAgainstJob(`${base}\nSkills\nDocker`, 'Requirements\n- Docker')
    const used = scoreResumeAgainstJob(base.replace('first version', 'first version with Docker'), 'Requirements\n- Docker')
    expect(listed.categories.projectsExperience.score).toBe(used.categories.projectsExperience.score)
    expect(used.categories.requiredSkills.score).toBeGreaterThan(listed.categories.requiredSkills.score)
  })

  it('leaves unverified years unknown and still allows the gate when the job match clears 75', () => {
    const jd = `${GOOD_JD}\nMinimum 3 years of experience`
    const result = scoreResumeAgainstJob(GOOD_RESUME, jd, { nowYear: 2026 })
    expect(result.eligibility.unverified.map((item) => item.name)).toEqual(expect.arrayContaining(['3 years of experience']))
    expect(result.eligibility.unmet).toHaveLength(0)
    expect(result.scoreExact).toBeGreaterThanOrEqual(75)
    const gate = decideGate({
      resumeText: GOOD_RESUME,
      jobDescription: jd,
      rubricVersion: ATS_CONFIG.rubricVersion,
      superseded: false,
    }, { isOwner: true, isLatest: true })
    expect(gate.unlocked).toBe(true)
    expect(gate.reason).toBe('meets_threshold')
  })

  it('locks the gate on a confirmed eligibility miss even when the job match clears 75', () => {
    const jd = GOOD_JD.replace('Bachelor degree', "Master's degree")
    const result = scoreResumeAgainstJob(GOOD_RESUME, jd, { nowYear: 2026 })
    expect(result.eligibility.unmet.map((item) => item.name)).toEqual(expect.arrayContaining(["master's degree"]))
    expect(result.scoreExact).toBeGreaterThanOrEqual(75)
    expect(result.passesThreshold).toBe(false)
    const gate = decideGate({
      resumeText: GOOD_RESUME,
      jobDescription: jd,
      rubricVersion: ATS_CONFIG.rubricVersion,
      superseded: false,
    }, { isOwner: true, isLatest: true })
    expect(gate.unlocked).toBe(false)
    expect(gate.reason).toBe('eligibility_unmet')
  })

  it('does not change the score when semantic matching is requested without a local model', () => {
    const plain = scoreResumeAgainstJob(GOOD_RESUME, GOOD_JD, { nowYear: 2026 })
    const asked = scoreResumeAgainstJob(GOOD_RESUME, GOOD_JD, { nowYear: 2026, semanticMatching: true })
    expect(asked.scoreExact).toBeCloseTo(plain.scoreExact, 5)
    expect(asked.semanticMatching.applied).toBe(false)
    expect(asked.warnings.join(' ')).toMatch(/no external API/i)
  })

  it('treats an unreadable resume as inconclusive instead of a zero job match', () => {
    const result = scoreResumeAgainstJob('hi', GOOD_JD)
    expect(result.status).toBe('incomplete')
    expect(result.scoreExact).toBeNull()
    expect(result.compatibility.status).toBe('inconclusive')
    const gate = decideGate({
      resumeText: 'hi',
      jobDescription: GOOD_JD,
      rubricVersion: ATS_CONFIG.rubricVersion,
      superseded: false,
    }, { isOwner: true, isLatest: true })
    expect(gate.unlocked).toBe(false)
    expect(gate.reason).toBe('parse_failed')
  })
})
