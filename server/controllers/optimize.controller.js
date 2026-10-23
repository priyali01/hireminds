const Assessment = require('../models/assessment.model')
const OptimizerDraft = require('../models/optimizerDraft.model')
const { parseGitHubLogin, fetchPublicProfile } = require('../services/optimize/github')
const {
  beginConnect,
  completeInstall,
  listSharedRepos,
  fetchSharedRepos,
  clientRedirect,
  disconnect,
  connectionStatus,
} = require('../services/optimize/githubConnect')
const { proposeResumeEdits } = require('../services/optimize/propose')
const { decideChange, approvedText } = require('../services/optimize/apply')
const { exportResume } = require('../services/optimize/exportResume')
const { scoreResumeAgainstJob } = require('../services/ats/engine')
const { NotFoundError, ValidationError } = require('../utils/errors')

function present(draft) {
  return {
    id: draft._id,
    originalText: draft.originalText,
    approvedText: draft.approvedText,
    jobDescription: draft.jobDescription,
    changes: draft.changes,
    demonstratedSkills: draft.demonstratedSkills,
    suggestedToLearn: draft.suggestedToLearn,
    projects: draft.projects,
    report: draft.report,
  }
}

async function ownedDraft(userId, id) {
  const draft = await OptimizerDraft.findOne({ _id: id, userId })
  if (!draft) throw new NotFoundError('Draft')
  return draft
}

function manualRepos(list) {
  if (!Array.isArray(list) || list.length === 0) return []
  return list.slice(0, 8).map((item) => {
    const name = String(item?.name || '').trim()
    const details = String(item?.details || '').trim()
    if (name.length < 2 || name.length > 80) {
      throw new ValidationError('Each project needs a name.')
    }
    if (details.length < 10 || details.length > 4000) {
      throw new ValidationError('Describe what you built, in your own words.')
    }
    if (/ghp_|github_pat_|gho_|ghu_/i.test(`${name}\n${details}`)) {
      throw new ValidationError('Paste a project description, not a token.')
    }
    return {
      name,
      description: '',
      readme: details,
      language: '',
      languages: {},
      topics: [],
      pushedAt: null,
      files: [],
      private: false,
      htmlUrl: '',
    }
  })
}

async function startGitHubConnect(req, res, next) {
  try {
    const result = await beginConnect(req.user.userId)
    res.json({ success: true, url: result.url })
  } catch (err) {
    next(err)
  }
}

async function githubCallback(req, res) {
  try {
    const result = await completeInstall({
      state: req.query.state,
      installationId: req.query.installation_id,
      setupAction: req.query.setup_action,
    })
    res.redirect(clientRedirect(result.status === 'pending' ? 'pending' : 'connected'))
  } catch {
    res.redirect(clientRedirect('error'))
  }
}

async function githubStatus(req, res, next) {
  try {
    const status = await connectionStatus(req.user.userId)
    res.json({ success: true, ...status })
  } catch (err) {
    next(err)
  }
}

async function githubRepos(req, res, next) {
  try {
    const listed = await listSharedRepos(req.user.userId)
    res.json({ success: true, connected: listed.connected, accountLogin: listed.accountLogin || '', repos: listed.repos })
  } catch (err) {
    next(err)
  }
}

async function githubDisconnect(req, res, next) {
  try {
    await disconnect(req.user.userId)
    res.json({ success: true, connected: false })
  } catch (err) {
    next(err)
  }
}

async function loadGitHub(req, res, next) {
  try {
    const login = parseGitHubLogin(req.body.profile)
    const repos = await fetchPublicProfile(login)
    res.json({ success: true, login, repos })
  } catch (err) {
    next(err)
  }
}

async function createDraft(req, res, next) {
  try {
    if (req.body.profile != null && String(req.body.profile).trim()) {
      parseGitHubLogin(req.body.profile)
    }
    let jobDescription = req.body.jobDescription
    let resumeText = req.body.resumeText
    if (req.body.assessmentId) {
      const assessment = await Assessment.findOne({ _id: req.body.assessmentId, userId: req.user.userId })
      if (!assessment) throw new NotFoundError('Assessment')
      jobDescription = jobDescription || assessment.jobDescription
      resumeText = resumeText || assessment.resumeText
    }
    if (!resumeText || String(resumeText).trim().length < 20) {
      throw new ValidationError('Resume text is too short to tailor.')
    }
    if (!jobDescription || String(jobDescription).trim().length < 20) {
      throw new ValidationError('Paste a job description before tailoring.')
    }
    const supplied = Array.isArray(req.body.repos) ? req.body.repos.slice(0, 8) : []
    const selected = Array.isArray(req.body.repoNames)
      ? await fetchSharedRepos(req.user.userId, req.body.repoNames)
      : []
    const repos = [...selected, ...manualRepos(req.body.manualProjects), ...supplied].slice(0, 8)
    const proposal = proposeResumeEdits({ resumeText, jobDescription, repos })
    const draft = await OptimizerDraft.create({
      userId: req.user.userId,
      jobDescription,
      originalText: proposal.originalText,
      approvedText: approvedText(proposal),
      changes: proposal.changes,
      demonstratedSkills: proposal.demonstratedSkills,
      suggestedToLearn: proposal.suggestedToLearn,
      projects: proposal.projects,
    })
    res.status(201).json({ success: true, draft: present(draft) })
  } catch (err) {
    next(err)
  }
}

async function getDraft(req, res, next) {
  try {
    const draft = await ownedDraft(req.user.userId, req.params.id)
    res.json({ success: true, draft: present(draft) })
  } catch (err) {
    next(err)
  }
}

async function reviewChange(req, res, next) {
  try {
    const draft = await ownedDraft(req.user.userId, req.params.id)
    const nextDraft = decideChange(draft.toObject(), req.params.changeId, req.body || {})
    draft.changes = nextDraft.changes
    draft.originalText = nextDraft.originalText
    draft.approvedText = approvedText(nextDraft)
    draft.markModified('changes')
    await draft.save()
    res.json({ success: true, draft: present(draft) })
  } catch (err) {
    next(err)
  }
}

async function rescoreDraft(req, res, next) {
  try {
    const draft = await ownedDraft(req.user.userId, req.params.id)
    const report = scoreResumeAgainstJob(draft.approvedText, draft.jobDescription)
    draft.report = report
    draft.markModified('report')
    await draft.save()
    res.json({ success: true, report, draft: present(draft) })
  } catch (err) {
    next(err)
  }
}

async function exportDraft(req, res, next) {
  try {
    const format = String(req.query.format || '')
    const draft = await ownedDraft(req.user.userId, req.params.id)
    const file = await exportResume(draft.approvedText, format)
    const type = format === 'pdf'
      ? 'application/pdf'
      : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    res.set('Content-Type', type)
    res.set('Content-Disposition', `attachment; filename="resume.${format}"`)
    res.send(file)
  } catch (err) {
    next(err)
  }
}

module.exports = {
  loadGitHub,
  startGitHubConnect,
  githubCallback,
  githubStatus,
  githubRepos,
  githubDisconnect,
  createDraft,
  getDraft,
  reviewChange,
  rescoreDraft,
  exportDraft,
}
