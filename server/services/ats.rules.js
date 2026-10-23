/**
 * Deterministic ATS scoring.
 *
 * The numbers are arithmetic over the resume text. The same text and level
 * always return the same scores. Nothing in this file calls a model.
 *
 * Two results, kept separate from the job-match score in services/ats/engine.js:
 * - compatibility: document processing, from services/ats/compatibility.js.
 *   That is the only ATS compatibility definition.
 * - overall: HireMinds level score for coaching. Freshers are not scored on
 *   experience. It is not a job match.
 */

const { scoreCompatibility } = require('./ats/compatibility')

const LEVEL_WEIGHTS = {
  fresher: {
    projects: 0.40,
    skills: 0.30,
    education: 0.20,
    certifications: 0.10,
    experience: 0,
  },
  intermediate: {
    experience: 0.30,
    skills: 0.30,
    projects: 0.25,
    education: 0.10,
    certifications: 0.05,
  },
  experienced: {
    experience: 0.40,
    skills: 0.30,
    projects: 0.15,
    education: 0.10,
    certifications: 0.05,
  },
}

const LEVEL_ALIASES = {
  fresher: 'fresher',
  student: 'fresher',
  junior: 'intermediate',
  intermediate: 'intermediate',
  mid: 'experienced',
  senior: 'experienced',
  experienced: 'experienced',
}

const SECTION_RULES = [
  { id: 'summary', pattern: /^(professional\s+)?(summary|objective|profile|about(\s+me)?)\b/i },
  { id: 'education', pattern: /^(education|academics?|qualifications?)\b/i },
  { id: 'experience', pattern: /^(work\s+)?(experience|employment|internships?|professional\s+experience|work\s+history)\b/i },
  { id: 'projects', pattern: /^(personal\s+|academic\s+|key\s+)?projects?\b/i },
  { id: 'skills', pattern: /^(technical\s+|core\s+)?(skills|competencies|technologies)\b/i },
  { id: 'certifications', pattern: /^(certifications?|certificates?|licenses?|courses(\s+and\s+certifications)?)\b/i },
]

const ACTION_VERBS = new Set([
  'built', 'developed', 'designed', 'implemented', 'led', 'created', 'improved',
  'reduced', 'increased', 'automated', 'deployed', 'managed', 'analyzed',
  'analysed', 'collaborated', 'optimized', 'optimised', 'delivered', 'launched',
  'integrated', 'migrated', 'wrote', 'engineered', 'achieved', 'conducted',
  'presented', 'mentored', 'resolved', 'streamlined', 'architected', 'maintained',
  'tested', 'debugged', 'configured', 'published', 'trained', 'coordinated',
  'generated', 'extracted', 'owned', 'shipped', 'refactored', 'scaled',
  'automated', 'documented', 'researched', 'negotiated', 'facilitated',
  'established', 'spearheaded', 'volunteered', 'taught', 'debugged',
])

// Order matters only where a shorter word is a prefix of a longer one.
// Patterns use boundaries so "java" does not match "javascript".
const SKILL_PATTERNS = [
  { id: 'javascript', re: /\bjavascript\b/i },
  { id: 'typescript', re: /\btypescript\b/i },
  { id: 'python', re: /\bpython\b/i },
  { id: 'java', re: /\bjava\b/i },
  { id: 'c++', re: /\bc\+\+/i },
  { id: 'c#', re: /\bc#/i },
  { id: 'golang', re: /\bgolang\b/i },
  { id: 'sql', re: /\bsql\b/i },
  { id: 'mysql', re: /\bmysql\b/i },
  { id: 'postgresql', re: /\bpostgres(?:ql)?\b/i },
  { id: 'mongodb', re: /\bmongodb\b/i },
  { id: 'redis', re: /\bredis\b/i },
  { id: 'react', re: /\breact(?:\.js)?\b/i },
  { id: 'next.js', re: /\bnext\.?js\b/i },
  { id: 'node.js', re: /\bnode(?:\.js)?\b/i },
  { id: 'express', re: /\bexpress(?:\.js)?\b/i },
  { id: 'html', re: /\bhtml5?\b/i },
  { id: 'css', re: /\bcss3?\b/i },
  { id: 'tailwind', re: /\btailwind(?:\s*css)?\b/i },
  { id: 'git', re: /\bgit\b/i },
  { id: 'docker', re: /\bdocker\b/i },
  { id: 'kubernetes', re: /\bkubernetes\b|\bk8s\b/i },
  { id: 'aws', re: /\baws\b/i },
  { id: 'azure', re: /\bazure\b/i },
  { id: 'gcp', re: /\bgcp\b|\bgoogle cloud\b/i },
  { id: 'linux', re: /\blinux\b/i },
  { id: 'oops', re: /\boops\b|\bobject[- ]oriented\b/i },
  { id: 'data structures', re: /\bdata structures?\b|\bdsa\b/i },
  { id: 'algorithms', re: /\balgorithms?\b|\bdsa\b/i },
  { id: 'dbms', re: /\bdbms\b|\bdatabase management\b/i },
  { id: 'operating systems', re: /\boperating systems?\b/i },
  { id: 'computer networks', re: /\bcomputer networks?\b|\bcomputernetworks?\b/i },
  { id: 'machine learning', re: /\bmachine learning\b|\bdeep learning\b/i },
  { id: 'pandas', re: /\bpandas\b/i },
  { id: 'numpy', re: /\bnumpy\b/i },
  { id: 'tensorflow', re: /\btensorflow\b/i },
  { id: 'pytorch', re: /\bpytorch\b/i },
  { id: 'django', re: /\bdjango\b/i },
  { id: 'flask', re: /\bflask\b/i },
  { id: 'spring boot', re: /\bspring boot\b/i },
  { id: 'spring', re: /\bspring\b/i },
  { id: 'graphql', re: /\bgraphql\b/i },
  { id: 'rest api', re: /\brest(?:ful)? api\b|\brestful\b/i },
  { id: 'firebase', re: /\bfirebase\b/i },
  { id: 'figma', re: /\bfigma\b/i },
  { id: 'excel', re: /\bexcel\b/i },
  { id: 'power bi', re: /\bpower bi\b/i },
  { id: 'tableau', re: /\btableau\b/i },
  { id: 'selenium', re: /\bselenium\b/i },
  { id: 'jest', re: /\bjest\b/i },
  { id: 'postman', re: /\bpostman\b/i },
  { id: 'jenkins', re: /\bjenkins\b/i },
  { id: 'ci/cd', re: /\bci\/cd\b/i },
]

const COMMON_JD_KEYWORDS = [
  'javascript', 'python', 'java', 'sql', 'git', 'data structures', 'algorithms',
  'oops', 'dbms', 'operating systems', 'react', 'node.js', 'mongodb', 'docker',
  'aws', 'linux', 'html', 'css', 'rest api',
]

const DEGREE_RE = /\b(b\.?\s?tech|m\.?\s?tech|b\.?\s?e\.?\b|m\.?\s?e\.?\b|b\.?\s?sc|m\.?\s?sc|b\.?\s?ca|b\.?\s?com|bachelor|master|btech|mtech|ph\.?\s?d|diploma)\b/i
const CGPA_RE = /\b(cgpa|gpa|cpi|percentage)\b|\d+(?:\.\d+)?\s*%/i
const YEAR_RE = /\b(19|20)\d{2}\b/
const INSTITUTION_RE = /\b(university|college|institute|iit|nit|iiit|bits)\b/i
const MONTH_RE = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\b/i
const CERT_NAME_RE = /\b(aws|azure|gcp|google|microsoft|oracle|cisco|nptel|coursera|udemy|ibm|meta|tensorflow|hackerrank|leetcode|certified|certificate)\b/i

function normalizeLevel(level) {
  return LEVEL_ALIASES[String(level || '').toLowerCase()] || 'fresher'
}

function roundScore(n) {
  return Math.max(0, Math.min(100, Math.round(n)))
}

function weightedOverall(breakdown, weights) {
  const raw = Object.entries(weights).reduce((sum, [key, weight]) => {
    return sum + (breakdown[key] || 0) * Math.round(weight * 100)
  }, 0)
  return Math.round(raw / 100)
}

function formulaFor(level, weights) {
  const parts = Object.entries(weights)
    .filter(([, weight]) => weight > 0)
    .map(([key, weight]) => `${key} ${Math.round(weight * 100)}%`)
  const ignored = Object.entries(weights)
    .filter(([, weight]) => weight === 0)
    .map(([key]) => key)
  const base = parts.join(' + ')
  if (!ignored.length) return `${level} score = ${base}`
  return `${level} score = ${base}. ${ignored.join(', ')} is not counted.`
}

function check(id, group, label, max, earned, detail) {
  const safe = Math.max(0, Math.min(max, earned))
  return {
    id,
    group,
    label,
    max,
    earned: safe,
    passed: safe === max,
    detail,
  }
}

function groupScore(checks, group) {
  const items = checks.filter((item) => item.group === group)
  const earned = items.reduce((sum, item) => sum + item.earned, 0)
  const max = items.reduce((sum, item) => sum + item.max, 0)
  if (!max) return 0
  return roundScore((earned / max) * 100)
}

function cleanHeading(line) {
  return line.trim().replace(/[:|\-–—]+$/g, '').trim()
}

function headingId(line) {
  const text = cleanHeading(line)
  if (!text || text.length > 48) return null
  if (text.split(/\s+/).length > 6) return null
  const rule = SECTION_RULES.find((item) => item.pattern.test(text))
  return rule ? rule.id : null
}

function splitSections(resumeText) {
  const lines = String(resumeText || '').replace(/\r\n/g, '\n').split('\n')
  const sections = {
    summary: '',
    education: '',
    experience: '',
    projects: '',
    skills: '',
    certifications: '',
  }
  let current = null
  const detected = []

  for (const line of lines) {
    const id = headingId(line)
    if (id) {
      current = id
      if (!detected.includes(id)) detected.push(id)
      continue
    }
    if (current) sections[current] += `${line}\n`
  }

  return { sections, detected, lines }
}

function isMarkerBullet(line) {
  return /^\s*(?:[-•*●▪‣]|\d+[.)])\s+\S/.test(line)
}

function bulletBody(line) {
  return line.trim().replace(/^(?:[-•*●▪‣]|\d+[.)])\s+/, '').trim()
}

function firstWord(line) {
  const match = bulletBody(line).toLowerCase().match(/^[a-z]+/)
  return match ? match[0] : ''
}

function collectBullets(lines) {
  const bullets = []
  for (const line of lines) {
    const body = bulletBody(line)
    if (!body) continue
    const marked = isMarkerBullet(line)
    const verb = ACTION_VERBS.has(firstWord(line))
    const soft = !marked && verb && body.length >= 20 && body.length <= 220 && !headingId(line)
    if (marked || soft) bullets.push(body)
  }
  return bullets
}

function hasMetric(text) {
  const withoutYears = text.replace(/\b(19|20)\d{2}\b/g, '')
  return /\d/.test(withoutYears)
}

function findSkills(text) {
  const found = []
  for (const skill of SKILL_PATTERNS) {
    if (skill.re.test(text) && !found.includes(skill.id)) found.push(skill.id)
  }
  return found
}

function tokenizeListedSkills(sectionText) {
  return sectionText
    .split(/[,|•·▪\n]+/)
    .map((token) => token.replace(/^[\-*]\s*/, '').replace(/\s+/g, ' ').trim())
    .filter((token) => token.length >= 2 && token.length <= 40 && !/^\d+$/.test(token))
}

function hasEmail(text) {
  return /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(text)
}

function hasPhone(text) {
  const matches = text.match(/(?:\+\d{1,3}[\s-]?)?(?:\(?\d{2,5}\)?[\s.-]?)?\d[\d\s().-]{8,}\d/g) || []
  return matches.some((match) => {
    const digits = (match.match(/\d/g) || []).length
    return digits >= 10 && digits <= 15
  })
}

function hasLinkedIn(text) {
  return /linkedin\.com\/in\/[a-z0-9-]+/i.test(text)
}

function hasGitHub(text) {
  return /github\.com\/[a-z0-9-]+/i.test(text)
}

function hasInstitution(section) {
  if (INSTITUTION_RE.test(section)) return true
  return section.split('\n').some((raw) => {
    const line = raw.trim()
    if (line.length < 8 || line.length > 90) return false
    const remainder = line
      .replace(DEGREE_RE, ' ')
      .replace(YEAR_RE, ' ')
      .replace(/\b(cgpa|gpa|cpi|percentage)\b/gi, ' ')
    return /[A-Za-z]{4,}/.test(remainder)
  })
}

function wordCount(text) {
  return (text.match(/[A-Za-z0-9][A-Za-z0-9+.#/]*/g) || []).length
}

function isReadable(text) {
  if (!text.trim()) return false
  const odd = text.match(/[^\p{L}\p{N}\s@.,:;+|()\-/&%#'’"“”•·▪–—_]/gu) || []
  return odd.length / text.length < 0.05
}

function pointsForWords(count) {
  if (count >= 250 && count <= 900) return 30
  if (count >= 180 && count <= 1100) return 22
  if (count >= 120) return 14
  if (count >= 60) return 6
  return 0
}

function pointsForBullets(count) {
  if (count >= 8) return 30
  if (count >= 5) return 22
  if (count >= 3) return 14
  if (count >= 1) return 6
  return 0
}

function pointsForBreadth(count) {
  if (count >= 10) return 50
  if (count >= 7) return 38
  if (count >= 4) return 24
  if (count >= 2) return 12
  return 0
}

function pointsForReuse(count) {
  if (count >= 4) return 30
  if (count >= 2) return 18
  if (count >= 1) return 8
  return 0
}

function pointsForProjectBullets(count) {
  if (count >= 4) return 15
  if (count >= 2) return 10
  if (count >= 1) return 5
  return 0
}

function pointsForProjectTech(count) {
  if (count >= 3) return 20
  if (count >= 1) return 10
  return 0
}

function pointsForProjectMetrics(count) {
  if (count >= 2) return 10
  if (count >= 1) return 6
  return 0
}

function tierLabel(max, earned, full, partial, empty) {
  if (earned === max) return full
  if (earned > 0) return partial
  return empty
}

function buildChecks(text, sections, detected) {
  const lines = text.split('\n')
  const bullets = collectBullets(lines)
  const quantified = bullets.filter(hasMetric)
  const action = bullets.filter((body) => ACTION_VERBS.has((body.match(/^[a-z]+/i) || [''])[0].toLowerCase()))
  const skillsFound = findSkills(text)
  const listed = tokenizeListedSkills(sections.skills)
  const projectBullets = collectBullets(sections.projects.split('\n'))
  const projectQuant = projectBullets.filter(hasMetric)
  const projectActions = projectBullets.filter((body) => ACTION_VERBS.has((body.match(/^[a-z]+/i) || [''])[0].toLowerCase()))
  const projectTech = findSkills(sections.projects)
  const projectLinks = sections.projects.match(/https?:\/\/\S+|github\.com\/[a-z0-9-]+/gi) || []
  const experienceBullets = collectBullets(sections.experience.split('\n'))
  const experienceQuant = experienceBullets.filter(hasMetric)
  const experienceActions = experienceBullets.filter((body) => ACTION_VERBS.has((body.match(/^[a-z]+/i) || [''])[0].toLowerCase()))
  const reused = findSkills(`${sections.projects}\n${sections.experience}`)
  const words = wordCount(text)
  const email = hasEmail(text)
  const phone = hasPhone(text)
  const linkedin = hasLinkedIn(text)
  const github = hasGitHub(text)
  const readable = isReadable(text)
  const wordPoints = pointsForWords(words)
  const bulletPoints = pointsForBullets(bullets.length)
  const actionPoints = bullets.length ? Math.round((action.length / bullets.length) * 40) : 0
  const metricPoints = bullets.length ? Math.round((quantified.length / bullets.length) * 30) : 0
  const breadthPoints = pointsForBreadth(skillsFound.length)
  const listedPoints = listed.length >= 8 ? 35 : listed.length >= 5 ? 22 : listed.length >= 3 ? 12 : 0
  const specificPoints = skillsFound.length >= 6 ? 25 : skillsFound.length >= 3 ? 15 : skillsFound.length >= 1 ? 8 : 0
  const reusePoints = pointsForReuse(reused.length)

  const checks = [
    check(
      'word_count',
      'search',
      'Enough readable text',
      30,
      wordPoints,
      tierLabel(
        30,
        wordPoints,
        `${words} words. A one-page resume usually lands between 250 and 900, which parsers handle cleanly.`,
        `${words} words. Usable, but thin or long. Online checkers prefer about 250–900 words.`,
        `${words} words. This is too short to score. A scanned PDF often extracts almost nothing.`
      )
    ),
    check(
      'email',
      'search',
      'Email address',
      25,
      email ? 25 : 0,
      email
        ? 'A plain email address is on the resume, so an ATS can file the application.'
        : 'No email found. Put a plain-text email in the header. An address that exists only inside a logo is invisible to a parser.'
    ),
    check(
      'phone',
      'search',
      'Phone number',
      20,
      phone ? 20 : 0,
      phone
        ? 'A phone number with at least 10 digits is on the resume.'
        : 'No phone number found. Add a 10-digit mobile number in the header, not only inside an image.'
    ),
    check(
      'profile_link',
      'search',
      'LinkedIn or GitHub link',
      15,
      linkedin || github ? 15 : 0,
      linkedin || github
        ? `Profile link found${linkedin ? ' (LinkedIn)' : ''}${github ? ' (GitHub)' : ''}.`
        : 'No LinkedIn or GitHub link. Add the full URL, for example linkedin.com/in/your-name or github.com/your-name.'
    ),
    check(
      'readable_text',
      'search',
      'Parser-readable characters',
      10,
      readable ? 10 : 0,
      readable
        ? 'The text is ordinary letters, numbers, and punctuation a parser can keep.'
        : 'A lot of unusual characters survived extraction. Re-export the resume as a text PDF instead of a scan or a designed image.'
    ),
    check(
      'heading_education',
      'headings',
      'Education heading',
      25,
      detected.includes('education') ? 25 : 0,
      detected.includes('education')
        ? 'An Education heading is present. Parsers look for that exact kind of label.'
        : 'No Education heading. Add a line that says Education, on its own.'
    ),
    check(
      'heading_skills',
      'headings',
      'Skills heading',
      25,
      detected.includes('skills') ? 25 : 0,
      detected.includes('skills')
        ? 'A Skills heading is present.'
        : 'No Skills heading. Add a line that says Skills, then list tools separated by commas.'
    ),
    check(
      'heading_projects',
      'headings',
      'Projects heading',
      20,
      detected.includes('projects') ? 20 : 0,
      detected.includes('projects')
        ? 'A Projects heading is present.'
        : 'No Projects heading. Freshers should add a line that says Projects, on its own.'
    ),
    check(
      'heading_experience',
      'headings',
      'Experience or internship heading',
      20,
      detected.includes('experience') ? 20 : 0,
      detected.includes('experience')
        ? 'An Experience or Internships heading is present. Online checkers look for this even for students.'
        : 'No Experience or Internships heading. Online ATS checkers deduct for this. Internships belong under Internships. The HireMinds fresher score does not use this heading.'
    ),
    check(
      'heading_summary',
      'headings',
      'Summary heading',
      10,
      detected.includes('summary') ? 10 : 0,
      detected.includes('summary')
        ? 'A Summary or Objective heading is present.'
        : 'No Summary heading. A two-line Summary under that label is enough.'
    ),
    check(
      'bullet_count',
      'impact',
      'Bullet points',
      30,
      bulletPoints,
      bullets.length
        ? `${bullets.length} bullet${bullets.length === 1 ? '' : 's'} found. Checkers want about 8 short bullets across projects and experience.`
        : 'No bullets found. Start each achievement on its own line with a dash or a dot.'
    ),
    check(
      'action_verbs',
      'impact',
      'Bullets start with an action verb',
      40,
      actionPoints,
      bullets.length
        ? `${action.length} of ${bullets.length} bullets start with an action verb such as built, developed, led, or reduced.`
        : 'No bullets to judge. Start lines with built, developed, led, reduced, or a similar verb.'
    ),
    check(
      'quantified',
      'impact',
      'Bullets contain a metric',
      30,
      metricPoints,
      bullets.length
        ? `${quantified.length} of ${bullets.length} bullets contain a metric. A year by itself does not count. Use a count, a percentage, or a time.`
        : 'No bullets contain a metric yet. Add a number that is not just a date, such as 120 users or 30% faster.'
    ),
    check(
      'skill_breadth',
      'skillcoverage',
      'Specific tools in the resume',
      50,
      breadthPoints,
      skillsFound.length
        ? `Found ${skillsFound.length} specific tools: ${skillsFound.slice(0, 12).join(', ')}.`
        : 'No specific tools found. Name languages and tools, not only soft skills.'
    ),
    check(
      'skill_section_present',
      'skillcoverage',
      'Skills live in their own section',
      20,
      detected.includes('skills') ? 20 : 0,
      detected.includes('skills')
        ? 'Tools are gathered under a Skills heading, which is what a parser indexes.'
        : 'Tools are not gathered under a Skills heading.'
    ),
    check(
      'skills_used_in_work',
      'skillcoverage',
      'Skills also appear in projects or experience',
      30,
      reusePoints,
      reused.length
        ? `${reused.length} tool${reused.length === 1 ? '' : 's'} from the skill list also appear in projects or experience: ${reused.slice(0, 8).join(', ')}.`
        : 'None of the detected tools are repeated in a project or experience bullet. A skills list with no proof is easy for a checker to ignore.'
    ),
    check(
      'project_section',
      'projects',
      'Projects section',
      30,
      detected.includes('projects') ? 30 : 0,
      detected.includes('projects')
        ? 'Projects are in their own section.'
        : 'Projects section is missing. For a fresher this is 40% of the level score, so add the heading and at least two projects.'
    ),
    check(
      'project_link',
      'projects',
      'Project link',
      15,
      projectLinks.length ? 15 : 0,
      projectLinks.length
        ? `${projectLinks.length} project link${projectLinks.length === 1 ? '' : 's'} found.`
        : 'No project link. Add a GitHub or live URL under the project it belongs to.'
    ),
    check(
      'project_bullets',
      'projects',
      'Project bullets',
      15,
      pointsForProjectBullets(projectBullets.length),
      projectBullets.length
        ? `${projectBullets.length} bullet${projectBullets.length === 1 ? '' : 's'} under Projects.`
        : 'No bullets under Projects. Give each project two or three lines that start with a verb.'
    ),
    check(
      'project_tech',
      'projects',
      'Tools named inside projects',
      20,
      pointsForProjectTech(projectTech.length),
      projectTech.length
        ? `Projects name ${projectTech.length} tool${projectTech.length === 1 ? '' : 's'}: ${projectTech.slice(0, 8).join(', ')}.`
        : 'Projects do not name any specific tool. Say which language or framework you used.'
    ),
    check(
      'project_metrics',
      'projects',
      'Project metrics',
      10,
      pointsForProjectMetrics(projectQuant.length),
      projectQuant.length
        ? `${projectQuant.length} project bullet${projectQuant.length === 1 ? '' : 's'} include a metric.`
        : 'No project bullet has a metric. Add users, a percentage, latency, or a count.'
    ),
    check(
      'project_actions',
      'projects',
      'Project bullets start with a verb',
      10,
      projectBullets.length && projectActions.length / projectBullets.length >= 0.5 ? 10 : projectActions.length ? 5 : 0,
      projectActions.length
        ? `${projectActions.length} of ${projectBullets.length} project bullets start with an action verb.`
        : 'Project bullets do not start with an action verb.'
    ),
    check(
      'skills_heading',
      'skills',
      'Skills section',
      25,
      detected.includes('skills') ? 25 : 0,
      detected.includes('skills')
        ? 'The Skills section exists.'
        : 'The Skills section is missing.'
    ),
    check(
      'skills_listed',
      'skills',
      'Skills listed',
      35,
      listedPoints,
      listed.length
        ? `${listed.length} skill item${listed.length === 1 ? '' : 's'} listed under Skills.`
        : 'The Skills section has no comma-separated items.'
    ),
    check(
      'skills_specific',
      'skills',
      'Specific tools, not only soft skills',
      25,
      specificPoints,
      skillsFound.length
        ? `${skillsFound.length} specific tool${skillsFound.length === 1 ? '' : 's'} recognised in the whole resume.`
        : 'No specific tool was recognised. Add names such as Java, SQL, React, or Python.'
    ),
    check(
      'skills_reused',
      'skills',
      'Skills proven in projects or experience',
      15,
      reused.length >= 3 ? 15 : reused.length >= 1 ? 8 : 0,
      reused.length
        ? `${reused.length} skill${reused.length === 1 ? '' : 's'} also show up in projects or experience.`
        : 'Skills are not repeated in projects or experience, so they read as a list without proof.'
    ),
    check(
      'edu_heading',
      'education',
      'Education section',
      20,
      detected.includes('education') ? 20 : 0,
      detected.includes('education')
        ? 'Education is in its own section.'
        : 'Education section is missing.'
    ),
    check(
      'degree',
      'education',
      'Degree',
      25,
      DEGREE_RE.test(sections.education) ? 25 : 0,
      DEGREE_RE.test(sections.education)
        ? 'A degree such as B.Tech, B.E., or B.Sc. is written in Education.'
        : 'No degree found under Education. Write B.Tech, B.E., B.Sc., or the full bachelor wording.'
    ),
    check(
      'edu_year',
      'education',
      'Education dates',
      15,
      YEAR_RE.test(sections.education) ? 15 : 0,
      YEAR_RE.test(sections.education)
        ? 'A year is written in Education.'
        : 'No year under Education. Add a start year and an end year or "expected".'
    ),
    check(
      'edu_score',
      'education',
      'CGPA, CPI, or percentage',
      20,
      CGPA_RE.test(sections.education) ? 20 : 0,
      CGPA_RE.test(sections.education)
        ? 'A CGPA, CPI, or percentage is written in Education.'
        : 'No CGPA, CPI, or percentage under Education. Indian campus screens look for this.'
    ),
    check(
      'institution',
      'education',
      'College or university',
      20,
      hasInstitution(sections.education) ? 20 : 0,
      hasInstitution(sections.education)
        ? 'A college or degree line with a name is written under Education.'
        : 'Education does not name a college. Put the college on the degree line.'
    ),
    check(
      'exp_heading',
      'experience',
      'Experience section',
      25,
      detected.includes('experience') ? 25 : 0,
      detected.includes('experience')
        ? 'Experience or Internships is its own section.'
        : 'Experience section is missing. This does not change a fresher level score. It does change compatibility, and it matters for intermediate and experienced scoring.'
    ),
    check(
      'exp_dates',
      'experience',
      'Experience dates',
      20,
      detected.includes('experience') && (YEAR_RE.test(sections.experience) || MONTH_RE.test(sections.experience)) ? 20 : 0,
      YEAR_RE.test(sections.experience) || MONTH_RE.test(sections.experience)
        ? 'Dates are written in Experience.'
        : 'No dates under Experience. Use a month and year for each role.'
    ),
    check(
      'exp_bullets',
      'experience',
      'Experience bullets',
      20,
      experienceBullets.length >= 3 ? 20 : experienceBullets.length >= 1 ? 10 : 0,
      experienceBullets.length
        ? `${experienceBullets.length} bullet${experienceBullets.length === 1 ? '' : 's'} under Experience.`
        : 'No bullets under Experience.'
    ),
    check(
      'exp_metrics',
      'experience',
      'Experience metrics',
      20,
      experienceQuant.length >= 1 ? 20 : 0,
      experienceQuant.length
        ? `${experienceQuant.length} experience bullet${experienceQuant.length === 1 ? '' : 's'} include a metric.`
        : 'No experience bullet has a metric other than a year.'
    ),
    check(
      'exp_actions',
      'experience',
      'Experience bullets start with a verb',
      15,
      experienceBullets.length && experienceActions.length / experienceBullets.length >= 0.5 ? 15 : experienceActions.length ? 8 : 0,
      experienceActions.length
        ? `${experienceActions.length} of ${experienceBullets.length} experience bullets start with an action verb.`
        : 'Experience bullets do not start with an action verb.'
    ),
    check(
      'cert_heading',
      'certifications',
      'Certifications section',
      40,
      detected.includes('certifications') ? 40 : 0,
      detected.includes('certifications')
        ? 'Certifications are in their own section.'
        : 'No Certifications section. If you have none, this stays 0. For a fresher that is 10% of the level score.'
    ),
    check(
      'cert_named',
      'certifications',
      'Named certificate',
      40,
      CERT_NAME_RE.test(sections.certifications) ? 40 : 0,
      CERT_NAME_RE.test(sections.certifications)
        ? 'A certificate name or issuer is written under Certifications.'
        : 'No named certificate under Certifications. Write the course and the issuer, such as AWS Cloud Practitioner or an NPTEL course.'
    ),
    check(
      'cert_year',
      'certifications',
      'Certificate year',
      20,
      YEAR_RE.test(sections.certifications) ? 20 : 0,
      YEAR_RE.test(sections.certifications)
        ? 'A year is written on a certificate.'
        : 'No year on the certificates.'
    ),
  ]

  return {
    checks,
    signals: {
      wordCount: words,
      email,
      phone,
      linkedin,
      github,
      bulletCount: bullets.length,
      quantifiedBullets: quantified.length,
      actionVerbBullets: action.length,
      skillsFound,
      listedSkillCount: listed.length,
    },
  }
}

function missingKeywords(skillsFound) {
  if (skillsFound.length < 3) return []
  return COMMON_JD_KEYWORDS.filter((keyword) => !skillsFound.includes(keyword)).slice(0, 8)
}

function scoreResume(resumeText, rawLevel = 'fresher') {
  const level = normalizeLevel(rawLevel)
  const weights = LEVEL_WEIGHTS[level]
  const text = String(resumeText || '').replace(/\r\n/g, '\n').trim()
  const { sections, detected } = splitSections(text)
  const { checks, signals } = buildChecks(text, sections, detected)

  const breakdown = {
    projects: groupScore(checks, 'projects'),
    skills: groupScore(checks, 'skills'),
    education: groupScore(checks, 'education'),
    experience: groupScore(checks, 'experience'),
    certifications: groupScore(checks, 'certifications'),
  }

  const compatibilityResult = scoreCompatibility(text)
  const compatibility = compatibilityResult.scoreExact

  const overall = weightedOverall(breakdown, weights)
  const failed = checks
    .filter((item) => !item.passed)
    .sort((a, b) => (b.max - b.earned) - (a.max - a.earned))
  const passed = checks
    .filter((item) => item.passed && item.max >= 15)
    .sort((a, b) => b.max - a.max)

  const feedback = failed.slice(0, 6).map((item) => item.detail)
  if (!feedback.length) {
    feedback.push('Every check passed. Paste a job description next so the resume can be matched to one role.')
  }

  const strengths = passed.slice(0, 4).map((item) => item.detail)
  if (!strengths.length) {
    strengths.push('Nothing strong stood out yet. The checklist is the whole reason for both scores.')
  }

  const keywords = missingKeywords(signals.skillsFound)
  const oneWeekFixPlan = failed.slice(0, 5).map((item, index) => `Day ${index + 1}: ${item.detail}`)
  if (!oneWeekFixPlan.length) {
    oneWeekFixPlan.push('Keep this version. Next, paste a job description and rescore against that role.')
  }

  return {
    overall,
    compatibility,
    level,
    formula: formulaFor(level, weights),
    weights: { ...weights },
    breakdown,
    compatibilityBreakdown: compatibilityResult,
    checks,
    findings: failed.map((item) => item.detail),
    sectionsDetected: detected,
    signals,
    feedback,
    strengths,
    missingKeywords: keywords,
    keywordNote: keywords.length
      ? 'These words show up often on Indian software job descriptions. They are not from a job you pasted.'
      : 'Keyword gaps against a real job need a job description. This phase only flags common software terms, and only when the resume already looks technical.',
    oneWeekFixPlan,
    scoringMethod: 'deterministic-rules',
  }
}

module.exports = {
  LEVEL_WEIGHTS,
  normalizeLevel,
  weightedOverall,
  scoreResume,
  hasEmail,
  hasPhone,
}
