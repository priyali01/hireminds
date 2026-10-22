const { ATS_CONFIG } = require('../../config/ats.config')
const { scoreResumeAgainstJob } = require('./engine')

/**
 * The gate is decided here from the stored resume text and job description.
 * A score sent by the browser is never read.
 */
function decideGate(assessment, { isOwner, isLatest }) {
  if (!assessment || !isOwner) {
    return { unlocked: false, reason: 'not_found', threshold: ATS_CONFIG.gateThreshold }
  }

  if (!isLatest || assessment.superseded) {
    return {
      unlocked: false,
      reason: 'superseded',
      threshold: ATS_CONFIG.gateThreshold,
      message: 'A newer assessment replaced this one. The gate uses the latest scan only.',
    }
  }

  if (assessment.rubricVersion !== ATS_CONFIG.rubricVersion) {
    return {
      unlocked: false,
      reason: 'rubric_changed',
      threshold: ATS_CONFIG.gateThreshold,
      message: 'The scoring rubric changed after this scan. Run the assessment again.',
    }
  }

  const fresh = scoreResumeAgainstJob(assessment.resumeText, assessment.jobDescription)

  if (!fresh.gateEligible || fresh.scoreExact == null) {
    return {
      unlocked: false,
      reason: 'unverified',
      threshold: ATS_CONFIG.gateThreshold,
      scoreExact: null,
      message: fresh.warnings[0] || 'The job description or resume did not contain enough verifiable information.',
    }
  }

  if (fresh.scoreExact < ATS_CONFIG.gateThreshold) {
    return {
      unlocked: false,
      reason: 'below_threshold',
      threshold: ATS_CONFIG.gateThreshold,
      scoreExact: fresh.scoreExact,
      scoreDisplay: fresh.scoreDisplay,
      message: `${fresh.scoreDisplay} is below the ${ATS_CONFIG.gateThreshold} practice gate.`,
    }
  }

  return {
    unlocked: true,
    reason: 'meets_threshold',
    threshold: ATS_CONFIG.gateThreshold,
    scoreExact: fresh.scoreExact,
    scoreDisplay: fresh.scoreDisplay,
    message: `${fresh.scoreDisplay} clears the ${ATS_CONFIG.gateThreshold} practice gate. This is not an employer ATS result.`,
  }
}

module.exports = { decideGate }
