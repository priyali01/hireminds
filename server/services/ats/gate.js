const { ATS_CONFIG } = require('../../config/ats.config')
const { scoreResumeAgainstJob } = require('./engine')

/**
 * The gate is decided here from the stored resume text and job description.
 * A score sent by the browser is never read.
 * Document compatibility is not the gate. The job match is.
 * Unverified eligibility does not lock the gate. A confirmed miss does.
 */
function decideGate(assessment, { isOwner, isLatest }) {
  const threshold = ATS_CONFIG.gateThreshold
  if (!assessment || !isOwner) {
    return { unlocked: false, reason: 'not_found', threshold }
  }

  if (!isLatest || assessment.superseded) {
    return {
      unlocked: false,
      reason: 'superseded',
      threshold,
      message: 'A newer assessment replaced this one. The gate uses the latest scan only.',
    }
  }

  if (assessment.rubricVersion !== ATS_CONFIG.rubricVersion) {
    return {
      unlocked: false,
      reason: 'rubric_changed',
      threshold,
      message: 'The scoring rubric changed after this scan. Run the assessment again.',
    }
  }

  const fresh = scoreResumeAgainstJob(assessment.resumeText, assessment.jobDescription)

  if (fresh.compatibility?.status !== 'scored') {
    return {
      unlocked: false,
      reason: 'parse_failed',
      threshold,
      scoreExact: null,
      message: fresh.warnings[0] || 'The resume could not be parsed, so no gate decision was made.',
    }
  }

  if (!fresh.gateEligible || fresh.scoreExact == null) {
    return {
      unlocked: false,
      reason: 'unverified',
      threshold,
      scoreExact: null,
      message: fresh.warnings[0] || 'The job description did not contain enough verifiable requirements.',
    }
  }

  const unmet = fresh.eligibility?.unmet || []
  if (unmet.length && fresh.scoreExact >= threshold) {
    return {
      unlocked: false,
      reason: 'eligibility_unmet',
      threshold,
      scoreExact: fresh.scoreExact,
      scoreDisplay: fresh.scoreDisplay,
      message: `${fresh.scoreDisplay} clears ${threshold}, but a confirmed eligibility condition is not met: ${unmet.map((item) => item.name).join(', ')}. Unverified conditions were not treated as failures.`,
    }
  }

  if (fresh.scoreExact < threshold) {
    const extra = unmet.length ? ` A confirmed eligibility condition is also not met: ${unmet[0].name}.` : ''
    return {
      unlocked: false,
      reason: 'below_threshold',
      threshold,
      scoreExact: fresh.scoreExact,
      scoreDisplay: fresh.scoreDisplay,
      message: `Job match ${fresh.scoreDisplay} is below the ${threshold} practice gate.${extra}`,
    }
  }

  const unknown = fresh.eligibility?.unverified?.length
    ? ` ${fresh.eligibility.unverified.length} eligibility condition(s) could not be verified and did not block the gate.`
    : ''
  return {
    unlocked: true,
    reason: 'meets_threshold',
    threshold,
    scoreExact: fresh.scoreExact,
    scoreDisplay: fresh.scoreDisplay,
    message: `Job match ${fresh.scoreDisplay} clears the ${threshold} practice gate.${unknown} This is not an employer ATS result.`,
  }
}

module.exports = { decideGate }
