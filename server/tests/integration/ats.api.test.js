const request = require('supertest')
const { PDFDocument, StandardFonts } = require('pdf-lib')
const JSZip = require('jszip')
const app = require('../../app')
const { setupTestDB, clearDB, teardownTestDB } = require('../helpers/db.helper')

const JD = `
Backend Developer

Requirements
- JavaScript
- Node.js
- MongoDB
- REST API
- Bachelor degree

Preferred
- Docker

Responsibilities
- Build REST APIs for campus applications
- Design MongoDB schemas for student records
`

const GOOD_LINES = [
  'Priya Sharma',
  'priya@example.com',
  'Education',
  'B.Tech Computer Science, National Institute of Technology, 2022 - 2026',
  'Projects',
  '- Built REST APIs in Node.js and JavaScript for 200 campus applications',
  '- Designed MongoDB schemas for student records',
  '- Shipped the service with Docker',
  'Experience',
  'Backend intern, College Lab, 2025 - 2026',
  '- Built REST APIs in Node.js for campus applications',
  '- Designed MongoDB schemas used by 15 staff',
  'Skills',
  'JavaScript, Node.js, MongoDB, Docker, Git',
]

const WEAK_LINES = [
  'Asha Verma',
  'asha@example.com',
  'Summary',
  'Strong communication and teamwork for college events and newsletters.',
  'Education',
  'B.A. English, City College, 2022 - 2026',
  'Experience',
  'Club volunteer, 2024 - 2025',
  '- Organized weekly meetings for 30 students',
]

beforeAll(async () => {
  process.env.JWT_SECRET = 'test_jwt_secret_minimum_32_characters_long'
  process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_minimum_32_chars_xx'
  process.env.GEMINI_API_KEY = 'test-key'
  await setupTestDB()
})

afterEach(async () => {
  await clearDB()
})

afterAll(async () => {
  await teardownTestDB()
})

async function makePdf(lines) {
  const doc = await PDFDocument.create()
  const page = doc.addPage()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  let y = 760
  for (const line of lines) {
    page.drawText(line, { x: 48, y, size: 11, font })
    y -= 16
  }
  return Buffer.from(await doc.save())
}

async function makeDocx(lines) {
  const zip = new JSZip()
  zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`)
  zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`)
  const body = lines.map((line) => {
    const safe = line.replace(/&/g, '&amp;').replace(/</g, '&lt;')
    return `<w:p><w:r><w:t xml:space="preserve">${safe}</w:t></w:r></w:p>`
  }).join('')
  zip.file('word/document.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}</w:body></w:document>`)
  return zip.generateAsync({ type: 'nodebuffer' })
}

async function register(email) {
  const res = await request(app).post('/auth/register').send({
    fullName: 'Priya Sharma',
    email,
    password: 'Password1',
    consentGiven: true,
  })
  return res.body.accessToken
}

function assess(token, file, filename, jd = JD) {
  return request(app)
    .post('/ats/assess')
    .set('Authorization', `Bearer ${token}`)
    .field('jobDescription', jd)
    .attach('resume', file, filename)
}

describe('ATS assessment API', () => {
  it('rejects anonymous access', async () => {
    const pdf = await makePdf(GOOD_LINES)
    const res = await request(app).post('/ats/assess').field('jobDescription', JD).attach('resume', pdf, 'resume.pdf')
    expect(res.status).toBe(401)
  })

  it('scores a relevant PDF and a DOCX with evidence, offline', async () => {
    const token = await register('good@test.com')
    const pdf = await makePdf(GOOD_LINES)
    const pdfRes = await assess(token, pdf, 'resume.pdf')
    expect(pdfRes.status).toBe(201)
    expect(pdfRes.body.assessment.scoreExact).toBeGreaterThan(75)
    expect(pdfRes.body.assessment.compatibility.scoreExact).toBeGreaterThan(0)
    expect(pdfRes.body.assessment.categories.projectsExperience).toBeDefined()
    expect(pdfRes.body.assessment.categories.educationReadability).toBeUndefined()
    expect(pdfRes.body.assessment.keywordCoverage.note).toMatch(/not added/i)
    expect(pdfRes.body.assessment.gate.unlocked).toBe(true)
    expect(pdfRes.body.assessment.categories.requiredSkills.matched.length).toBeGreaterThan(0)
    expect(pdfRes.body.assessment.disclaimer).toMatch(/not an employer ATS/i)

    const docx = await makeDocx(GOOD_LINES)
    const docxRes = await assess(token, docx, 'resume.docx')
    expect(docxRes.status).toBe(201)
    expect(docxRes.body.assessment.scoreExact).toBeGreaterThan(75)
  })

  it('names missing required skills and stays locked', async () => {
    const token = await register('weak@test.com')
    const pdf = await makePdf(WEAK_LINES)
    const res = await assess(token, pdf, 'weak.pdf')
    expect(res.status).toBe(201)
    expect(res.body.assessment.scoreExact).toBeLessThan(75)
    const missing = res.body.assessment.categories.requiredSkills.missing.map((item) => item.name)
    expect(missing).toEqual(expect.arrayContaining(['javascript', 'node.js', 'mongodb']))
    expect(res.body.assessment.gate.unlocked).toBe(false)
    expect(res.body.assessment.gate.reason).toBe('below_threshold')
  })

  it('refuses a fake client score and does not unlock a weak assessment', async () => {
    const token = await register('fake@test.com')
    const pdf = await makePdf(WEAK_LINES)
    const created = await assess(token, pdf, 'weak.pdf')
    const advance = await request(app)
      .post('/ats/advance')
      .set('Authorization', `Bearer ${token}`)
      .send({ assessmentId: created.body.assessment.id, score: 100, passesThreshold: true })
    expect(advance.status).toBe(200)
    expect(advance.body.ignoredClientScore).toBe(true)
    expect(advance.body.gate.unlocked).toBe(false)
    expect(advance.body.gate.scoreExact).toBeLessThan(75)
  })

  it('supersedes the previous assessment when a revised resume is uploaded', async () => {
    const token = await register('revise@test.com')
    const first = await assess(token, await makePdf(WEAK_LINES), 'weak.pdf')
    const second = await assess(token, await makePdf(GOOD_LINES), 'better.pdf')
    expect(second.body.assessment.id).not.toBe(first.body.assessment.id)
    expect(second.body.assessment.gate.unlocked).toBe(true)

    const oldGate = await request(app)
      .post('/ats/advance')
      .set('Authorization', `Bearer ${token}`)
      .send({ assessmentId: first.body.assessment.id, score: 100 })
    expect(oldGate.body.gate.unlocked).toBe(false)
    expect(oldGate.body.gate.reason).toBe('superseded')

    const fetched = await request(app)
      .get(`/ats/assessments/${first.body.assessment.id}`)
      .set('Authorization', `Bearer ${token}`)
    expect(fetched.body.assessment.superseded).toBe(true)
  })

  it('hides an assessment from a different user', async () => {
    const owner = await register('owner@test.com')
    const other = await register('other@test.com')
    const created = await assess(owner, await makePdf(GOOD_LINES), 'resume.pdf')
    const res = await request(app)
      .get(`/ats/assessments/${created.body.assessment.id}`)
      .set('Authorization', `Bearer ${other}`)
    expect(res.status).toBe(404)
  })

  it('rejects unsupported, corrupt, empty, and oversized files without a score', async () => {
    const token = await register('files@test.com')

    const txt = await request(app)
      .post('/ats/assess')
      .set('Authorization', `Bearer ${token}`)
      .field('jobDescription', JD)
      .attach('resume', Buffer.from('hello this is a plain text resume with lots of words about javascript'), 'resume.txt')
    expect(txt.status).toBe(422)
    expect(txt.body.assessment).toBeUndefined()

    const corrupt = await request(app)
      .post('/ats/assess')
      .set('Authorization', `Bearer ${token}`)
      .field('jobDescription', JD)
      .attach('resume', Buffer.from('not a real pdf document at all, just bytes'), 'resume.pdf')
    expect(corrupt.status).toBe(422)

    const blank = await makePdf([' '])
    const empty = await assess(token, blank, 'blank.pdf')
    expect(empty.status).toBe(422)
    expect(empty.body.code).toBe('VALIDATION_ERROR')
    expect(empty.body.message).toMatch(/OCR|readable text/i)

    const big = Buffer.alloc(5 * 1024 * 1024 + 10, 1)
    big.write('%PDF')
    const oversized = await request(app)
      .post('/ats/assess')
      .set('Authorization', `Bearer ${token}`)
      .field('jobDescription', JD)
      .attach('resume', big, 'big.pdf')
    expect(oversized.status).toBe(422)
    expect(oversized.body.message).toMatch(/5 MB/i)
  })
})
