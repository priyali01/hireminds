/**
 * HireMinds ATS rubric H01.
 * Weights are product settings. Change them here. The engine checks that they sum to 100.
 * This is not an employer's ATS and it does not claim to reproduce one.
 */

const ATS_CONFIG = {
  rubricVersion: 'h01-v1',
  gateThreshold: 75,
  maxFileBytes: 5 * 1024 * 1024,
  weights: {
    requiredSkills: 35,
    experience: 20,
    projects: 20,
    preferred: 15,
    educationReadability: 10,
  },
  disclaimer:
    'This score uses HireMinds rubric h01-v1. It is a practice match against the job description you pasted. It is not an employer ATS and it does not guarantee a company will accept the file.',
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

assertWeights(ATS_CONFIG.weights)

module.exports = {
  ATS_CONFIG,
  assertWeights,
}
