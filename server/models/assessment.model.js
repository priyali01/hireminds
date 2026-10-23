const mongoose = require('mongoose')

/**
 * One resume-to-job assessment.
 * The uploaded file is not stored. Extracted text is stored so the owner can
 * reopen the evidence and so the gate can be recalculated without trusting the client.
 */
const assessmentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    rubricVersion: { type: String, required: true },
    resumeFileName: { type: String, default: '' },
    resumeHash: { type: String, required: true },
    jdHash: { type: String, required: true },
    jobDescription: { type: String, required: true },
    resumeText: { type: String, required: true },
    status: {
      type: String,
      enum: ['completed', 'incomplete'],
      required: true,
    },
    scoreExact: { type: Number, default: null },
    scoreDisplay: { type: Number, default: null },
    passesThreshold: { type: Boolean, default: false },
    gateEligible: { type: Boolean, default: false },
    threshold: { type: Number, required: true },
    weights: { type: mongoose.Schema.Types.Mixed, required: true },
    compatibilityWeights: { type: mongoose.Schema.Types.Mixed, default: null },
    categories: { type: mongoose.Schema.Types.Mixed, required: true },
    compatibility: { type: mongoose.Schema.Types.Mixed, default: null },
    keywordCoverage: { type: mongoose.Schema.Types.Mixed, default: null },
    eligibility: { type: mongoose.Schema.Types.Mixed, default: null },
    evidenceConfidence: { type: mongoose.Schema.Types.Mixed, default: null },
    semanticMatching: { type: mongoose.Schema.Types.Mixed, default: null },
    requirements: { type: mongoose.Schema.Types.Mixed, required: true },
    warnings: { type: [String], default: [] },
    recommendations: { type: [String], default: [] },
    sectionsDetected: { type: [String], default: [] },
    disclaimer: { type: String, default: '' },
    superseded: { type: Boolean, default: false },
    supersededBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assessment',
      default: null,
    },
  },
  { timestamps: true }
)

assessmentSchema.index({ userId: 1, createdAt: -1 })

module.exports = mongoose.model('Assessment', assessmentSchema)
