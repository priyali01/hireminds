const KEYS = ['relevance', 'depth', 'structure', 'completeness']

const EXERCISES = {
  relevance: 'Name the skill in the question, then one piece of your own work that used it. Do not memorize a script.',
  depth: 'Add one reason from your own work and one trade-off you actually made. Do not memorize a script.',
  structure: 'Use the situation, what you did, and what happened, from your own work. Do not memorize a script.',
  completeness: 'Before you stop, check the question for a skill you skipped and answer it from your own work. Do not memorize a script.',
}

function coachPlan(evaluations) {
  const list = evaluations || []
  const averages = {}
  for (const key of KEYS) {
    const scores = list.map((item) => item?.dimensions?.[key]?.score).filter((score) => typeof score === 'number')
    averages[key] = scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0
  }
  const ordered = [...KEYS].sort((a, b) => averages[a] - averages[b] || KEYS.indexOf(a) - KEYS.indexOf(b))
  return {
    averages,
    weaknesses: ordered.slice(0, 3).map((key) => ({
      dimension: key,
      score: averages[key],
      exercise: EXERCISES[key],
    })),
  }
}

function compareProgress(earlier, later) {
  const deltas = {}
  const improved = []
  const declined = []
  for (const key of KEYS) {
    deltas[key] = later.averages[key] - earlier.averages[key]
    if (deltas[key] > 0) improved.push(key)
    if (deltas[key] < 0) declined.push(key)
  }
  return { deltas, improved, declined }
}

module.exports = { coachPlan, compareProgress }
