const GROUP_LABELS = {
  requiredSkills: 'Required technical skills',
  projectsExperience: 'Relevant projects and experience',
  responsibilities: 'Role responsibilities',
  educationEligibility: 'Education and eligibility',
  preferred: 'Preferred keywords',
  softSkills: 'Soft skills',
}

const COMPAT_LABELS = {
  extraction: 'Text extraction and reading order',
  sections: 'Section identification',
  contact: 'Contact fields',
  chronology: 'Education, experience and dates',
  layout: 'Layout and formatting',
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

function ScoreCard({ label, score, detail }) {
  return (
    <div className="card result-score-card glass-card">
      <p className="result-section-label">{label}</p>
      <div className="overall-score">
        <span className={`score-big ${tone(score)}`}>{score == null ? '—' : score}</span>
        <span className="score-denom">/100</span>
      </div>
      <p className="score-explain">{detail}</p>
    </div>
  )
}

export default function AtsReport({ assessment }) {
  const gate = assessment.gate
  const compatibility = assessment.compatibility
  const coverage = assessment.keywordCoverage
  const eligibility = assessment.eligibility
  const confidence = assessment.evidenceConfidence

  return (
    <div className="result-grid">
      <div className="score-pair">
        <ScoreCard
          label="Job match"
          score={assessment.scoreDisplay}
          detail="Match against the job description you pasted. This is the score the practice gate uses."
        />
        <ScoreCard
          label="Document compatibility"
          score={compatibility?.scoreDisplay}
          detail="How much of the file the parser could read. This is not added to the job match."
        />
      </div>

      <div className="card glass-card">
        <p className="score-explain">{assessment.disclaimer}</p>
        {gate && (
          <p className={`gate-status ${gate.unlocked ? 'gate-open' : 'gate-locked'}`}>
            {gate.unlocked ? 'Practice gate open' : 'Practice gate locked'}
            {gate.message ? ` · ${gate.message}` : ''}
          </p>
        )}
      </div>

      <div className="card glass-card">
        <h3 className="result-section-title">Job match categories</h3>
        <p className="score-explain">A category with nothing to assess is left out, and the remaining weights are renormalized. The same evidence is not added in two categories.</p>
        <div className="breakdown-list">
          {Object.entries(assessment.categories || {}).map(([key, category]) => (
            <div key={key} className="score-bar-row">
              <div className="score-bar-meta">
                <span className="score-bar-label">{GROUP_LABELS[key] || key} · {category.weight}%</span>
                <span className={`score-bar-value ${tone(category.score)}`}>
                  {category.scoreDisplay == null ? 'Not assessed' : `${category.scoreDisplay}/100`}
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

      {compatibility?.components && (
        <div className="card glass-card">
          <h3 className="result-section-title">Document compatibility</h3>
          <p className="score-explain">Text extraction 30%, sections 20%, contact 15%, education and dates 15%, layout 20%. Columns, fonts and margins are not measured.</p>
          <div className="breakdown-list">
            {Object.entries(compatibility.components).map(([key, component]) => (
              <div key={key} className="score-bar-row">
                <div className="score-bar-meta">
                  <span className="score-bar-label">{COMPAT_LABELS[key] || key} · {component.weight}%</span>
                  <span className={`score-bar-value ${tone(component.score)}`}>
                    {component.score == null ? 'Not assessed' : `${Math.round(component.score)}/100`}
                  </span>
                </div>
                <div className="score-bar-track">
                  <div className={`score-bar-fill bg-${tone(component.score)}`} style={{ width: `${component.score || 0}%` }} />
                </div>
                {component.reasons?.[0] && <p className="score-bar-note">{component.reasons[0]}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card glass-card">
        <h3 className="result-section-title">Required skills</h3>
        <EvidenceList title="Matched" items={assessment.categories?.requiredSkills?.matched} empty="No required skill was matched." />
        <EvidenceList title="Missing" items={assessment.categories?.requiredSkills?.missing} />
        <EvidenceList title="Could not verify" items={assessment.categories?.requiredSkills?.uncertain} />
      </div>

      <div className="card glass-card">
        <h3 className="result-section-title">Preferred keywords and soft skills</h3>
        <EvidenceList title="Preferred, matched" items={assessment.categories?.preferred?.matched} empty="No preferred keywords were listed, or none were found." />
        <EvidenceList title="Preferred, not found" items={assessment.categories?.preferred?.missing} />
        <EvidenceList title="Soft skills, matched" items={assessment.categories?.softSkills?.matched} empty="No soft skills were named in the job description." />
        <EvidenceList title="Soft skills, not found" items={assessment.categories?.softSkills?.missing} />
      </div>

      <div className="card glass-card">
        <h3 className="result-section-title">Experience, projects and responsibilities</h3>
        <EvidenceList title="Work record" items={assessment.categories?.projectsExperience?.matched} />
        <EvidenceList title="Work record gaps" items={assessment.categories?.projectsExperience?.missing} />
        <EvidenceList title="Responsibilities" items={assessment.categories?.responsibilities?.matched} />
        <EvidenceList title="Responsibilities not found" items={assessment.categories?.responsibilities?.missing} />
      </div>

      <div className="card glass-card">
        <h3 className="result-section-title">Mandatory eligibility</h3>
        <p className="score-explain">Confirmed misses block the practice gate. Unverified conditions stay unknown and do not.</p>
        <EvidenceList title="Confirmed" items={eligibility?.meets} empty="No eligibility condition was confirmed." />
        <EvidenceList title="Confirmed unmet" items={eligibility?.unmet} empty="No confirmed eligibility miss." />
        <EvidenceList title="Unverified" items={eligibility?.unverified} empty="Nothing was left unverified." />
      </div>

      <div className="card glass-card">
        <h3 className="result-section-title">Supporting metrics</h3>
        <p className="score-explain">
          Keyword coverage: {coverage?.total ? `${coverage.found} of ${coverage.total} (${coverage.percent}%). ` : 'Not calculated. '}
          {coverage?.note}
        </p>
        <p className="score-explain">
          Evidence confidence: {confidence?.score == null ? '—' : `${confidence.score}/100`}. {confidence?.reason}
        </p>
        <p className="score-explain">{assessment.semanticMatching?.note}</p>
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
