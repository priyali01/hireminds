const { ValidationError, NotFoundError } = require('../../utils/errors')
const { SKILL_DICTIONARY } = require('../ats/dictionary')
const { skillsPresent } = require('../ats/match')

function numbersIn(text) {
  return [...String(text || '').matchAll(/\d+(?:\.\d+)?%?/g)].map((match) => match[0])
}

function allowedText(change) {
  return `${change.before || ''}\n${(change.evidence || []).map((item) => item.quote || '').join('\n')}`
}

function assertSupported(text, change) {
  const allowed = allowedText(change)
  for (const number of numbersIn(text)) {
    if (!allowed.includes(number)) {
      throw new ValidationError(`The edit includes ${number}, which is not in the resume or the repository evidence.`)
    }
  }
  const allowedLower = allowed.toLowerCase()
  for (const skill of skillsPresent(text, SKILL_DICTIONARY)) {
    const known = skill.aliases.some((alias) => allowedLower.includes(alias.toLowerCase()))
    if (!known) {
      throw new ValidationError(`The edit names ${skill.canonical}, which is not in the evidence.`)
    }
  }
}

function decideChange(draft, changeId, decision) {
  if (!draft.changes.some((change) => change.id === changeId)) throw new NotFoundError('Change')
  const action = decision && decision.action
  const changes = draft.changes.map((change) => {
    if (change.id !== changeId) return change
    if (action === 'reject') return { ...change, status: 'rejected' }
    if (action === 'accept') return { ...change, status: 'accepted' }
    if (action === 'edit') {
      const text = String(decision.text || '')
      assertSupported(text, change)
      return { ...change, status: 'edited', editedText: text }
    }
    throw new ValidationError('Choose accept, edit, or reject.')
  })
  return { ...draft, originalText: draft.originalText, changes }
}

function approvedText(draft) {
  let text = draft.originalText
  for (const change of draft.changes) {
    const next = change.status === 'edited' ? change.editedText : change.status === 'accepted' ? change.after : null
    if (next == null) continue
    if (change.action === 'remove') {
      if (change.before) text = text.replace(change.before, '')
      continue
    }
    if (change.before && text.includes(change.before)) text = text.replace(change.before, next)
    else if (!change.before) text = `${text.trim()}\n${next}`
  }
  return text
}

module.exports = { decideChange, approvedText }
