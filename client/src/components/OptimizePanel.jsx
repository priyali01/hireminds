import { useState } from 'react'
import {
  useLoadGitHubProfileMutation,
  useCreateOptimizerDraftMutation,
  useReviewOptimizerChangeMutation,
  useRescoreOptimizerDraftMutation,
  useExportOptimizerDraftMutation,
} from '../store/api'

const LABELS = {
  highlight: 'Highlight',
  keep: 'Keep',
  shorten: 'Shorten',
  remove: 'Remove from the resume',
}

function messageFrom(err, fallback) {
  return err?.data?.message || fallback
}

export default function OptimizePanel({ assessment }) {
  const [profile, setProfile] = useState('')
  const [repos, setRepos] = useState(null)
  const [draft, setDraft] = useState(null)
  const [edits, setEdits] = useState({})
  const [error, setError] = useState(null)
  const [loadGitHub, { isLoading: loadingGit }] = useLoadGitHubProfileMutation()
  const [createDraft, { isLoading: drafting }] = useCreateOptimizerDraftMutation()
  const [reviewChange, { isLoading: reviewing }] = useReviewOptimizerChangeMutation()
  const [rescore, { isLoading: scoring }] = useRescoreOptimizerDraftMutation()
  const [exportDraft, { isLoading: exporting }] = useExportOptimizerDraftMutation()

  const busy = loadingGit || drafting || reviewing || scoring || exporting

  const loadProfile = async () => {
    setError(null)
    try {
      const result = await loadGitHub({ profile }).unwrap()
      setRepos(result.repos || [])
    } catch (err) {
      setRepos(null)
      setError(messageFrom(err, 'That public profile could not be read.'))
    }
  }

  const tailor = async () => {
    if (!assessment?.id) return
    setError(null)
    try {
      const result = await createDraft({
        assessmentId: assessment.id,
        repos: repos || [],
      }).unwrap()
      setDraft(result.draft)
      setEdits({})
    } catch (err) {
      setError(messageFrom(err, 'The resume could not be tailored.'))
    }
  }

  const review = async (change, action, text) => {
    setError(null)
    try {
      const result = await reviewChange({
        id: draft.id,
        changeId: change.id,
        action,
        text,
      }).unwrap()
      setDraft(result.draft)
    } catch (err) {
      setError(messageFrom(err, 'That edit was not saved.'))
    }
  }

  const runRescore = async () => {
    setError(null)
    try {
      const result = await rescore(draft.id).unwrap()
      setDraft(result.draft)
    } catch (err) {
      setError(messageFrom(err, 'The approved resume could not be scored.'))
    }
  }

  const download = async (format) => {
    setError(null)
    try {
      const blob = await exportDraft({ id: draft.id, format }).unwrap()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `resume.${format}`
      link.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(messageFrom(err, 'The file could not be exported.'))
    }
  }

  return (
    <section className="optimize-panel glass-card">
      <h2>Tailor this resume</h2>
      <p className="optimize-note">
        Proposed lines are copied from this resume or a public repository. Skills that are not already demonstrated are listed to learn, and they are not written onto the resume.
      </p>

      {!assessment ? (
        <p className="optimize-note">Score a resume against a job description first. Tailoring uses that saved text.</p>
      ) : (
        <>
          <label className="form-label" htmlFor="github-profile">Public GitHub profile</label>
          <div className="optimize-row">
            <input
              id="github-profile"
              className="form-input"
              value={profile}
              placeholder="github.com/your-name"
              onChange={(event) => setProfile(event.target.value)}
            />
            <button type="button" className="btn btn-secondary" disabled={busy || !profile.trim()} onClick={loadProfile}>
              {loadingGit ? 'Reading…' : 'Load repositories'}
            </button>
          </div>
          {repos && (
            <p className="optimize-note">{repos.length} public {repos.length === 1 ? 'repository' : 'repositories'} loaded. Private repositories are not requested.</p>
          )}
          <button type="button" className="btn btn-primary" disabled={busy} onClick={tailor}>
            {drafting ? 'Preparing edits…' : 'Prepare edits'}
          </button>
        </>
      )}

      {error && <div className="server-error">{error}</div>}

      {draft && (
        <div className="optimize-results">
          <div className="optimize-split">
            <div>
              <h3>Shown in the work</h3>
              <p>{draft.demonstratedSkills.length ? draft.demonstratedSkills.join(', ') : 'None of the listed skills were found in the resume or repositories.'}</p>
            </div>
            <div>
              <h3>Still to learn</h3>
              <p>{draft.suggestedToLearn.length ? draft.suggestedToLearn.join(', ') : 'Nothing left from the job description.'}</p>
            </div>
          </div>

          {draft.projects?.length > 0 && (
            <ul className="optimize-projects">
              {draft.projects.map((project) => (
                <li key={project.name}>
                  <strong>{project.name}</strong>
                  <span>{LABELS[project.recommendation] || project.recommendation}</span>
                  <span>{project.reasons?.[0]}</span>
                </li>
              ))}
            </ul>
          )}

          {draft.changes.length === 0 && (
            <p className="optimize-note">No sourced edit was available. The original resume is unchanged.</p>
          )}

          {draft.changes.map((change) => (
            <article key={change.id} className="optimize-change">
              <header>
                <strong>{change.section}</strong>
                <span>{change.status}</span>
              </header>
              <div className="optimize-split">
                <pre>{change.before || 'Nothing in the original for this line.'}</pre>
                <pre>{change.status === 'edited' ? change.editedText : change.after || 'Remove this line.'}</pre>
              </div>
              <ul className="optimize-evidence">
                {change.evidence.map((item) => (
                  <li key={`${item.source}-${item.ref}-${item.quote}`}>
                    {item.source === 'github' ? 'Repository' : 'Resume'} · {item.ref}: {item.quote}
                  </li>
                ))}
              </ul>
              <div className="optimize-row">
                <button type="button" className="btn btn-primary" disabled={busy} onClick={() => review(change, 'accept')}>Accept</button>
                <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => review(change, 'reject')}>Reject</button>
              </div>
              <textarea
                className="jd-input"
                value={edits[change.id] ?? change.after}
                onChange={(event) => setEdits((current) => ({ ...current, [change.id]: event.target.value }))}
              />
              <button
                type="button"
                className="btn btn-secondary"
                disabled={busy}
                onClick={() => review(change, 'edit', edits[change.id] ?? change.after)}
              >
                Save edit
              </button>
            </article>
          ))}

          <details>
            <summary>Original resume</summary>
            <pre>{draft.originalText}</pre>
          </details>
          <h3>Approved resume</h3>
          <pre>{draft.approvedText}</pre>

          <div className="optimize-row">
            <button type="button" className="btn btn-primary" disabled={busy} onClick={runRescore}>
              {scoring ? 'Scoring…' : 'Score the approved resume'}
            </button>
            <button type="button" className="btn btn-secondary" disabled={busy} onClick={() => download('pdf')}>PDF</button>
            <button type="button" className="btn btn-secondary" disabled={busy} onClick={() => download('docx')}>DOCX</button>
          </div>
          {draft.report && (
            <p className="optimize-note">
              Job match {draft.report.scoreDisplay ?? 'not scored'} / 100 on this rubric. This is not an employer ATS result.
            </p>
          )}
        </div>
      )}
    </section>
  )
}
