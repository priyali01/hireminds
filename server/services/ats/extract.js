const path = require('path')
const { pathToFileURL } = require('url')
const mammoth = require('mammoth')
const { ATS_CONFIG } = require('../../config/ats.config')
const { ValidationError } = require('../../utils/errors')

const STANDARD_FONTS = pathToFileURL(
  path.join(path.dirname(require.resolve('pdfjs-dist/package.json')), 'standard_fonts/')
).href

async function extractPdfText(buffer) {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
  const doc = await pdfjs.getDocument({
    data: new Uint8Array(buffer),
    disableWorker: true,
    isEvalSupported: false,
    standardFontDataUrl: STANDARD_FONTS,
  }).promise

  const pages = []
  for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber += 1) {
    const page = await doc.getPage(pageNumber)
    const content = await page.getTextContent()
    const rows = new Map()
    for (const item of content.items) {
      if (!item.str || !item.str.trim()) continue
      const y = Math.round(item.transform[5])
      if (!rows.has(y)) rows.set(y, [])
      rows.get(y).push({ x: item.transform[4], str: item.str })
    }
    const lines = [...rows.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([, parts]) => parts.sort((a, b) => a.x - b.x).map((part) => part.str).join(' ').trim())
      .filter(Boolean)
    pages.push(lines.join('\n'))
  }
  return pages.join('\n')
}

function normalizeText(text) {
  return String(text || '')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function looksLikePdf(buffer) {
  return buffer.slice(0, 5).toString('utf8').startsWith('%PDF')
}

function looksLikeDocx(buffer) {
  const zip = buffer.slice(0, 2).toString('utf8') === 'PK'
  const marker = buffer.includes(Buffer.from('word/document.xml'))
  return zip && marker
}

function looksLikeLegacyDoc(buffer) {
  return buffer.length >= 4 && buffer[0] === 0xd0 && buffer[1] === 0xcf && buffer[2] === 0x11 && buffer[3] === 0xe0
}

function extensionOf(name) {
  const match = String(name || '').toLowerCase().match(/\.([a-z0-9]+)$/)
  return match ? match[1] : ''
}

function assertUpload(file) {
  if (!file || !file.buffer) {
    throw new ValidationError('A resume file is required', [
      { field: 'resume', message: 'Upload a PDF or DOCX resume.' },
    ])
  }

  if (file.size > ATS_CONFIG.maxFileBytes) {
    throw new ValidationError('File is too large', [
      { field: 'resume', message: 'The file must be 5 MB or smaller.' },
    ])
  }

  const extension = extensionOf(file.originalname)
  if (!['pdf', 'docx'].includes(extension)) {
    throw new ValidationError('Unsupported file type', [
      { field: 'resume', message: 'Upload a PDF or DOCX file. Images, TXT, and old .doc files are not scored.' },
    ])
  }

  if (extension === 'pdf' && !looksLikePdf(file.buffer)) {
    throw new ValidationError('The file is not a readable PDF', [
      { field: 'resume', message: 'The extension says PDF, but the file contents are not a PDF.' },
    ])
  }

  if (extension === 'docx' && looksLikeLegacyDoc(file.buffer)) {
    throw new ValidationError('Old Word .doc files are not supported', [
      { field: 'resume', message: 'Save the resume as DOCX or PDF and upload that.' },
    ])
  }

  if (extension === 'docx' && !looksLikeDocx(file.buffer)) {
    throw new ValidationError('The file is not a readable DOCX', [
      { field: 'resume', message: 'The extension says DOCX, but the file contents are not a Word document.' },
    ])
  }
}

function unreadable(kind) {
  const message = kind === 'pdf'
    ? 'No readable text was found. This PDF may be a scan or an image. OCR is not implemented, so no score was created. Export a text PDF and upload that.'
    : 'No readable text was found in this document, so no score was created. Upload a text-based PDF or DOCX.'
  return new ValidationError(message, [
    { field: 'resume', message, code: 'UNREADABLE_DOCUMENT' },
  ])
}

async function extractResumeText(file) {
  assertUpload(file)
  const extension = extensionOf(file.originalname)

  try {
    if (extension === 'pdf') {
      const text = normalizeText(await extractPdfText(file.buffer))
      if ((text.match(/[A-Za-z]/g) || []).length < 40) throw unreadable('pdf')
      return { text, kind: 'pdf' }
    }

    const parsed = await mammoth.extractRawText({ buffer: file.buffer })
    const text = normalizeText(parsed.value)
    if ((text.match(/[A-Za-z]/g) || []).length < 40) throw unreadable('docx')
    return { text, kind: 'docx' }
  } catch (err) {
    if (err instanceof ValidationError || err.name === 'ValidationError') throw err
    const encrypted = /password|encrypt/i.test(err.message || '')
    throw new ValidationError(
      encrypted
        ? 'This file is encrypted or password-protected, so no score was created.'
        : 'The file could not be read, so no score was created. Upload a text-based PDF or DOCX.',
      [{ field: 'resume', message: err.message || 'Unreadable file', code: 'UNREADABLE_DOCUMENT' }]
    )
  }
}

module.exports = {
  normalizeText,
  assertUpload,
  extractResumeText,
  looksLikePdf,
  looksLikeDocx,
}
