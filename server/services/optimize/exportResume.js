const { PDFDocument, StandardFonts } = require('pdf-lib')
const JSZip = require('jszip')
const { ValidationError } = require('../../utils/errors')

function ascii(text) {
  return String(text || '').replace(/[^\x09\x0A\x0D\x20-\x7E]/g, ' ')
}

async function toPdf(text) {
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const lines = ascii(text).split('\n')
  let page = doc.addPage()
  let y = 740
  for (const line of lines) {
    const chunks = line.match(/.{1,90}/g) || ['']
    for (const chunk of chunks) {
      if (y < 48) {
        page = doc.addPage()
        y = 740
      }
      page.drawText(chunk, { x: 50, y, size: 11, font })
      y -= 16
    }
  }
  return Buffer.from(await doc.save())
}

function xmlEscape(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

async function toDocx(text) {
  const zip = new JSZip()
  const paragraphs = xmlEscape(String(text || '')).split('\n').map((line) => (
    `<w:p><w:r><w:t xml:space="preserve">${line}</w:t></w:r></w:p>`
  )).join('')
  zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`)
  zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`)
  zip.file('word/document.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${paragraphs}</w:body></w:document>`)
  return zip.generateAsync({ type: 'nodebuffer' })
}

function exportResume(text, format) {
  if (format === 'pdf') return toPdf(text)
  if (format === 'docx') return toDocx(text)
  throw new ValidationError('Export the resume as pdf or docx.')
}

module.exports = { exportResume }
