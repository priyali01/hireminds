const mongoose = require('mongoose')

/**
 * Resume model.
 *
 * Supports:
 * - Manual form-built resumes (structured sections)
 * - PDF-extracted resumes (rawText)
 * - ATS score results (levelAwareScore, breakdown, feedback, strengths, missingKeywords)
 * - Versioning (versionNumber incremented on each save)
 * - AI analysis metadata (promptVersion, modelUsed — so we know which AI produced which result)
 * - User feedback on AI results (thumbsUp/thumbsDown)
 *
 * Indexes:
 * - userId: frequent lookup for resume list
 * - userId + createdAt compound: fetch latest resume for a user
 */
const resumeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // --- Resume source ---
    title: {
      type: String,
      default: 'My Resume',
      trim: true,
    },
    source: {
      type: String,
      enum: ['manual', 'pdf_upload'],
      required: true,
    },

    // --- Raw text (from PDF extraction or manual stringification) ---
    rawText: {
      type: String,
      default: '',
    },

    // --- Structured sections (manual builder) ---
    sections: {
      personalInfo: {
        name: String,
        email: String,
        phone: String,
        linkedin: String,
        github: String,
        location: String,
      },
      summary: { type: String, default: '' },
      education: [
        {
          institution: String,
          degree: String,
          branch: String,
          cgpa: String,
          startYear: Number,
          endYear: Number,
        },
      ],
      experience: [
        {
          company: String,
          role: String,
          startDate: String,
          endDate: String,
          description: String,
          bullets: [String],
        },
      ],
      projects: [
        {
          name: String,
          description: String,
          techStack: [String],
          link: String,
          bullets: [String],
        },
      ],
      skills: {
        technical: [String],
        soft: [String],
        languages: [String],
        tools: [String],
      },
      certifications: [
        {
          name: String,
          issuer: String,
          year: Number,
          link: String,
        },
      ],
      achievements: [String],
    },

    // --- Versioning ---
    versionNumber: {
      type: Number,
      default: 1,
    },

    // --- Level context at time of analysis ---
    level: {
      type: String,
      enum: ['fresher', 'intermediate', 'experienced'],
      required: true,
    },

    // --- ATS Analysis Results ---
    atsScore: {
      overall: { type: Number, default: null },
      // Fresher weights: projects 40%, skills 30%, education 20%, certs 10%
      // Experienced weights: experience 40%, skills 30%, projects 15%, education 10%, certs 5%
      breakdown: {
        skills: { type: Number, default: null },
        projects: { type: Number, default: null },
        education: { type: Number, default: null },
        experience: { type: Number, default: null },
        certifications: { type: Number, default: null },
      },
      feedback: { type: [String], default: [] },
      strengths: { type: [String], default: [] },
      missingKeywords: { type: [String], default: [] },
      oneWeekFixPlan: { type: [String], default: [] },

      // Metadata about the AI call that produced this score
      promptVersion: { type: String, default: null },
      modelUsed: { type: String, default: null },
      analysedAt: { type: Date, default: null },
    },

    // --- User feedback on AI analysis ---
    feedback: {
      thumbsUp: { type: Boolean, default: null },
      comment: { type: String, default: '' },
      givenAt: { type: Date, default: null },
    },

    // --- PDF metadata (if source is pdf_upload) ---
    pdfMeta: {
      cloudinaryUrl: { type: String, default: null },
      originalFilename: { type: String, default: null },
      sizeBytes: { type: Number, default: null },
    },
  },
  {
    timestamps: true,
  }
)

// --- Indexes ---
resumeSchema.index({ userId: 1, createdAt: -1 }) // Latest resume per user
resumeSchema.index({ userId: 1, versionNumber: -1 }) // Version history

const Resume = mongoose.model('Resume', resumeSchema)

module.exports = Resume
