/**
 * Whole-token and phrase matching.
 * A letter inside another word is not a hit. "c" does not match "communication".
 * "java" does not match "javascript". "c" does not match "c++" or "c#".
 */

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function aliasPattern(alias) {
  const lower = alias.toLowerCase().trim()
  const body = escapeRegExp(lower).replace(/\s+/g, '\\s+')
  if (lower === 'c') {
    return new RegExp(`(?<![a-z0-9])${body}(?![a-z0-9+#])`, 'i')
  }
  const plural = lower.endsWith('s') ? '' : 's?'
  return new RegExp(`(?<![a-z0-9])${body}(?:${plural})?(?![a-z0-9])`, 'i')
}

function findAlias(text, alias) {
  if (!text) return null
  const match = aliasPattern(alias).exec(text)
  if (!match) return null
  return { alias, index: match.index, text: match[0] }
}

function findSkill(text, skill) {
  const aliases = [...skill.aliases].sort((a, b) => b.length - a.length)
  for (const alias of aliases) {
    const found = findAlias(text, alias)
    if (found) return found
  }
  return null
}

function skillsPresent(text, dictionary) {
  return dictionary.filter((skill) => findSkill(text, skill))
}

function lineAround(text, index) {
  if (index == null || index < 0) return ''
  const start = text.lastIndexOf('\n', index) + 1
  const endBreak = text.indexOf('\n', index)
  const end = endBreak === -1 ? text.length : endBreak
  return text.slice(start, end).trim().slice(0, 180)
}

module.exports = {
  aliasPattern,
  findAlias,
  findSkill,
  skillsPresent,
  lineAround,
}
