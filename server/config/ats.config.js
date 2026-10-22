/**
 * HireMinds rubric h02.
 * Two independent scores. Change the weights here. Each set must sum to 100.
 * These are product heuristics, not an employer's ATS and not a hiring standard.
 *
 * Job match is the only match score. ATS compatibility measures whether the
 * file can be parsed. Keyword coverage, eligibility and evidence confidence
 * are reported beside the scores and are not added into either one.
 */

const ATS_CONFIG = {
  rubricVersion: 'h02-v1',
  gateThreshold: 75,
  maxFileBytes: 5 * 1024 * 1024,
  // No local model is configured. Leaving this false keeps scoring on exact
  // phrases and the skill dictionary. It must not be wired to an external API.
  semanticMatching: false,
  compatibilityWeights: {
    extraction: 30,
    sections: 20,
    contact: 15,
    chronology: 15,
    layout: 20,
  },
  jobMatchWeights: {
    requiredSkills: 30,
    projectsExperience: 25,
    responsibilities: 20,
    educationEligibility: 10,
    preferred: 10,
    softSkills: 5,
  },
  disclaimer:
    'HireMinds rubric h02-v1 calculates two separate scores in this app: document compatibility, and a job match against the description you pasted. This is not an employer ATS, and it does not guarantee that a company will accept the file.',
}

function assertWeights(weights) {
  const values = Object.values(weights)
  if (values.some((value) => typeof value !== 'number' || value < 0)) {
    throw new Error('ATS weights must be non-negative numbers')
  }
  const total = values.reduce((sum, value) => sum + value, 0)
  if (total !== 100) {
    throw new Error(`ATS weights must sum to 100. They sum to ${total}.`)
  }
}

assertWeights(ATS_CONFIG.compatibilityWeights)
assertWeights(ATS_CONFIG.jobMatchWeights)

module.exports = {
  ATS_CONFIG,
  assertWeights,
}
