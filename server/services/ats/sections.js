const RESUME_HEADINGS = [
  { id: 'summary', pattern: /^(professional\s+)?(summary|objective|profile|about(\s+me)?)\b/i },
  { id: 'education', pattern: /^education\b/i },
  { id: 'experience', pattern: /^(work\s+)?(experience|employment|internships?|professional\s+experience|work\s+history)\b/i },
  { id: 'projects', pattern: /^(personal\s+|academic\s+|key\s+)?projects?\b/i },
  { id: 'skills', pattern: /^(technical\s+|core\s+)?(skills|competencies|technologies)\b/i },
  { id: 'certifications', pattern: /^(certifications?|certificates?|licenses?)\b/i },
]

const JD_HEADINGS = [
  { id: 'required', pattern: /^(requirements?|required(\s+\w+){0,3}|must[- ]haves?|qualifications?|(?:minimum|basic|key)\s+qualifications?|what you(?:'|’)ll need|we require|(?:technical|key|core)\s+skills|skills|skill set|tools|tech stack|technologies|what we(?:'|’)re looking for|what you(?:'|’)ll bring)\b/i },
  { id: 'preferred', pattern: /^(preferred(?:\s+skills)?|nice to have|nice-to-have|good to have|bonus|plus|optional|familiarity)\b/i },
  { id: 'responsibilities', pattern: /^(responsibilities|what you(?:'|’)ll do|role and responsibilities|about the role|the role|duties|in this role|day to day)\b/i },
  { id: 'education', pattern: /^education\b/i },
]

function cleanHeading(line) {
  return line.trim().replace(/[:|\-–—]+$/g, '').trim()
}

function matchHeading(line, rules) {
  const text = cleanHeading(line)
  if (!text || text.length > 60) return null
  if (text.split(/\s+/).length > 8) return null
  const rule = rules.find((item) => item.pattern.test(text))
  return rule ? rule.id : null
}

function splitByHeadings(rawText, rules) {
  const text = String(rawText || '').replace(/\r\n/g, '\n')
  const sections = {}
  const detected = []
  let current = null

  for (const line of text.split('\n')) {
    const id = matchHeading(line, rules)
    if (id) {
      current = id
      if (!detected.includes(id)) detected.push(id)
      if (!sections[current]) sections[current] = ''
      continue
    }
    if (current) sections[current] += `${line}\n`
  }

  return { text: text.trim(), sections, detected }
}

function splitResume(rawText) {
  return splitByHeadings(rawText, RESUME_HEADINGS)
}

function splitJobDescription(rawText) {
  return splitByHeadings(rawText, JD_HEADINGS)
}

function sectionForLine(line) {
  const id = matchHeading(line, JD_HEADINGS)
  if (!id) return null
  const text = cleanHeading(line)
  const rule = JD_HEADINGS.find((item) => item.id === id)
  const rest = text.replace(rule.pattern, '').replace(/^[:|\-–—\s]+/, '').trim()
  if (rest) return null
  return id
}

module.exports = {
  splitResume,
  splitJobDescription,
  sectionForLine,
}
