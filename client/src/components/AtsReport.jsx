const GROUP_LABELS = {
  requiredSkills: 'Required skills',
  experience: 'Relevant experience',
  projects: 'Project relevance',
  preferred: 'Preferred skills',
  educationReadability: 'Education and readability',
}

function tone(score) {
  if (score == null) return 'score-mid'
  if (score >= 75) return 'score-high'
  if (score >= 50) return 'score-mid'
  return 'score-low'
}

function EvidenceList({ title, items, empty }) {
  if (!items?.length) {
    return empty ? <p className="score-explain">{empty}</p> : null
  }
  return (
    <div className="ats-block">
      <h4 className="ats-block-title">{title}</h4>
      <ul className="result-list">
        {items.map((item) => (
          <li key={`${title}-${item.name}`}>
            <strong>{item.name}</strong>
            {item.section ? ` · ${item.section}` : ''}
            {item.credit != null ? ` · ${item.credit}/100` : ''}
            <div className="check-detail">{item.reason}</div>
            {item.snippet ? <div className="check-detail">“{item.snippet}”</div> : null}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function AtsReport({ assessment }) {
  const gate = assessment.gate
  const score = assessment.scoreDisplay
  return (
    <div className="result-grid">
      <div className="card result-score-card glass-card">
        <p className="result-section-label">Job match score</p>
        <div className="overall-score">
          <span className={`score-big ${tone(score)}`}>{score == null ? '—' : score}</span>
          <span className="score-denom">/100</span>
        </div>
        <p className="score-explain">{assessment.disclaimer}</p>
        {gate && (
          <p className={`gate-status ${gate.unlocked ? 'gate-open' : 'gate-locked'}`}>
            {gate.unlocked ? 'Practice gate open' : 'Practice gate locked'}
            {gate.message ? ` · ${gate.message}` : ''}
          </p>
        )}
      </div>

      <div className="card glass-card">
        <h3 className="result-section-title">Category scores</h3>
        <p className="score-explain">Required skills 35%, experience 20%, projects 20%, preferred skills 15%, education and readability 10%.</p>
        <div className="breakdown-list">
          {Object.entries(assessment.categories || {}).map(([key, category]) => (
            <div key={key} className="score-bar-row">
              <div className="score-bar-meta">
                <span className="score-bar-label">{GROUP_LABELS[key] || key} · {category.weight}%</span>
                <span className={`score-bar-value ${tone(category.score)}`}>
                  {category.scoreDisplay == null ? 'Not scored' : `${category.scoreDisplay}/100`}
                </span>
              </div>
              <div className="score-bar-track">
                <div
                  className={`score-bar-fill bg-${tone(category.score)}`}
                  style={{ width: `${category.score || 0}%` }}
                />
              </div>
              {category.reasons?.[0] && <p className="score-bar-note">{category.reasons[0]}</p>}
            </div>
          ))}
        </div>
      </div>

      <div className="card glass-card">
        <h3 className="result-section-title">Required skills</h3>
        <EvidenceList title="Matched" items={assessment.categories?.requiredSkills?.matched} empty="No required skill was matched." />
        <EvidenceList title="Missing" items={assessment.categories?.requiredSkills?.missing} />
        <EvidenceList title="Could not verify" items={assessment.categories?.requiredSkills?.uncertain} />
      </div>

      <div className="card glass-card">
        <h3 className="result-section-title">Preferred skills</h3>
        <EvidenceList title="Matched" items={assessment.categories?.preferred?.matched} empty="No preferred skills were listed, or none were found." />
        <EvidenceList title="Not found" items={assessment.categories?.preferred?.missing} />
      </div>

      <div className="card glass-card">
        <h3 className="result-section-title">Experience and projects</h3>
        <EvidenceList title="Experience evidence" items={assessment.categories?.experience?.matched} />
        <EvidenceList title="Unverified experience" items={assessment.categories?.experience?.uncertain} />
        <EvidenceList title="Projects" items={assessment.categories?.projects?.matched} />
        <EvidenceList title="Projects missing a required skill" items={assessment.categories?.projects?.missing} />
      </div>

      {assessment.warnings?.length > 0 && (
        <div className="card glass-card">
          <h3 className="result-section-title">Parsing warnings</h3>
          <ul className="result-list">
            {assessment.warnings.map((warning) => <li key={warning}>{warning}</li>)}
          </ul>
        </div>
      )}

      {assessment.recommendations?.length > 0 && (
        <div className="card fix-plan-card glass-card">
          <h3 className="result-section-title">What to change, then rescan</h3>
          <ol className="fix-plan-list">
            {assessment.recommendations.map((item) => <li key={item}>{item}</li>)}
          </ol>
        </div>
      )}
    </div>
  )
}
