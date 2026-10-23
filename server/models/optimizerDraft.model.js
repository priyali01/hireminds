const mongoose = require('mongoose')

const evidenceSchema = new mongoose.Schema({
  source: { type: String, enum: ['resume', 'github'], required: true },
  quote: { type: String, required: true },
  ref: { type: String, default: '' },
}, { _id: false })

const changeSchema = new mongoose.Schema({
  id: { type: String, required: true },
  section: { type: String, required: true },
  action: { type: String, enum: ['revise', 'add', 'remove'], required: true },
  before: { type: String, default: '' },
  after: { type: String, default: '' },
  editedText: { type: String, default: '' },
  evidence: { type: [evidenceSchema], default: [] },
  status: { type: String, enum: ['pending', 'accepted', 'rejected', 'edited'], default: 'pending' },
}, { _id: false })

const optimizerDraftSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  jobDescription: { type: String, required: true },
  originalText: { type: String, required: true },
  approvedText: { type: String, required: true },
  changes: { type: [changeSchema], default: [] },
  demonstratedSkills: { type: [String], default: [] },
  suggestedToLearn: { type: [String], default: [] },
  projects: { type: [mongoose.Schema.Types.Mixed], default: [] },
  rubricVersion: { type: String, default: 'h02-projects-v1' },
  report: { type: mongoose.Schema.Types.Mixed, default: null },
}, { timestamps: true })

module.exports = mongoose.model('OptimizerDraft', optimizerDraftSchema)
