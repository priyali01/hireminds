import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  useGithubStatusQuery,
  useGithubReposQuery,
  useStartGitHubConnectMutation,
  useDisconnectGitHubMutation,
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
  const [params, setParams] = useSearchParams()
  const [draft, setDraft] = useState(null)
  const [edits, setEdits] = useState({})
  const [selected, setSelected] = useState([])
  const [projectName, setProjectName] = useState('')
  const [projectDetails, setProjectDetails] = useState('')
  const [manualProjects, setManualProjects] = useState([])
  const [error, setError] = useState(null)
  const { data: status, refetch: refetchStatus } = useGithubStatusQuery()
  const { data: shared, error: reposError } = useGithubReposQuery(undefined, { skip: !status?.connected })
  const [startConnect, { isLoading: connecting }] = useStartGitHubConnectMutation()
  const [disconnectGitHub, { isLoading: disconnecting }] = useDisconnectGitHubMutation()
  const [createDraft, { isLoading: drafting }] = useCreateOptimizerDraftMutation()
  const [reviewChange, { isLoading: reviewing }] = useReviewOptimizerChangeMutation()
  const [rescore, { isLoading: scoring }] = useRescoreOptimizerDraftMutation()
  const [exportDraft, { isLoading: exporting }] = useExportOptimizerDraftMutation()

  const busy = connecting || disconnecting || drafting || reviewing || scoring || exporting
  const repos = shared?.repos || []
  const assessmentId = assessment?.id

  useEffect(() => {
    setDraft(null)
    setEdits({})
  }, [assessmentId])

  useEffect(() => {
    const flag = params.get('github')
    if (!flag) return
    if (flag === 'connected') {
      refetchStatus()
      setError(null)
    } else if (flag === 'pending') {
      setError('GitHub is waiting for an owner to approve the app. You can add projects yourself until then.')
    } else if (flag === 'error') {
      setError('GitHub did not complete the connection. Start again from HirMind.')
    }
    const next = new URLSearchParams(params)
    next.delete('github')
    setParams(next, { replace: true })
  }, [params, refetchStatus, setParams])

  const connect = async () => {
    setError(null)
    try {
      const result = await startConnect().unwrap()
      if (!String(result.url || '').startsWith('https://github.com/')) {
        setError('GitHub did not return an authorization page.')
        return
      }
      window.location.assign(result.url)
    } catch (err) {
      setError(messageFrom(err, 'GitHub connection is not set up on the server yet. You can still add projects yourself.'))
    }
  }

  const disconnect = async () => {
    setError(null)
    setSelected([])
    try {
      await disconnectGitHub().unwrap()
      refetchStatus()
    } catch (err) {
      setError(messageFrom(err, 'GitHub could not be disconnected.'))
    }
  }

  const addProject = () => {
    const name = projectName.trim()
    const details = projectDetails.trim()
    if (name.length < 2 || details.length < 10) {
      setError('Name the project and describe what you actually built.')
      return
    }
    setManualProjects((current) => [...current, { name, details }].slice(0, 8))
    setProjectName('')
    setProjectDetails('')
    setError(null)
  }

  const tailor = async () => {
    if (!assessment?.id) return
    setError(null)
    try {
      const result = await createDraft({
        assessmentId: assessment.id,
        repoNames: selected,
        manualProjects,
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
        Proposed lines are copied from your resume, a repository you chose on GitHub, or a project you describe yourself. Skills that are not demonstrated stay on a learn list.
      </p>

      <div className="optimize-row">
        {status?.connected ? (
          <>
            <p className="optimize-note">Connected{status.accountLogin ? ` as ${status.accountLogin}` : ''}. Choose which shared repositories to analyze.</p>
            <button type="button" className="btn btn-ghost" disabled={busy} onClick={disconnect}>Disconnect</button>
          </>
        ) : (
          <button type="button" className="btn btn-secondary" disabled={busy} onClick={connect}>
            {connecting ? 'Opening GitHub…' : 'Connect GitHub'}
          </button>
        )}
      </div>
      {error && <div className="server-error">{error}</div>}
      {reposError && <div className="server-error">{messageFrom(reposError, 'GitHub could not list the repositories you shared.')}</div>}
      {repos.length > 0 && (
        <ul className="optimize-projects">
          {repos.map((repo) => (
            <li key={`${repo.owner}/${repo.name}`}>
              <label>
                    <input
                      type="checkbox"
                      checked={selected.includes(repo.name)}
                      onChange={() => setSelected((current) => (
                        current.includes(repo.name)
                          ? current.filter((name) => name !== repo.name)
                          : [...current, repo.name].slice(0, 8)
                      ))}
                    />
                {' '}{repo.name}{repo.private ? ' · private, shared by you' : ''}
              </label>
            </li>
          ))}
        </ul>
      )}

      <h3>Or describe a project yourself</h3>
      <label className="form-label" htmlFor="project-name">Project name</label>
      <input id="project-name" className="form-input" value={projectName} placeholder="Campus API" onChange={(event) => setProjectName(event.target.value)} />
      <label className="form-label" htmlFor="project-details">What you built</label>
      <textarea
        id="project-details"
        className="jd-input"
        value={projectDetails}
        placeholder="Write what you actually built. HirMind will not add metrics or tools you do not mention."
        onChange={(event) => setProjectDetails(event.target.value)}
      />
      <button type="button" className="btn btn-ghost" onClick={addProject}>Add this project</button>
      {manualProjects.length > 0 && (
        <ul className="optimize-projects">
          {manualProjects.map((project, index) => (
            <li key={`${project.name}-${index}`}>
              <strong>{project.name}</strong>
              <button type="button" className="btn btn-ghost" onClick={() => setManualProjects((current) => current.filter((_, itemIndex) => itemIndex !== index))}>Remove</button>
            </li>
          ))}
        </ul>
      )}
      {!assessment ? (
        <p className="optimize-note">The ATS checker above still works on its own. Score a resume before preparing edits.</p>
      ) : (
        <button type="button" className="btn btn-primary" disabled={busy} onClick={tailor}>
          {drafting ? 'Preparing edits…' : 'Prepare edits'}
        </button>
      )}

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
