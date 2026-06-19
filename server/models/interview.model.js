const mongoose = require('mongoose')

/**
 * InterviewSession model.
 *
 * Tracks individual interview prep sessions or full mock placement drives.
 * Includes AI-generated questions and AI evaluations for each answer.
 *
 * Indexes:
 * - userId + createdAt: list history
 * - userId + type: filter history by type
 * - userId + status: active session tracking
 */
const interviewSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // --- Session Setup ---
    type: {
      type: String,
      enum: ['technical', 'hr', 'behavioral', 'placement_drive'],
      required: true,
    },
    role: {
      type: String, // Target job role (e.g. "Frontend Developer")
      required: true,
    },
    roundType: {
      type: String, // e.g. "DSA + System Design" or "React Specific"
      default: null,
    },
    company: {
      type: String, // Optional target company
      default: null,
    },
    resumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resume', // Optional context for questions
      default: null,
    },

    // --- Core Interview Content ---
    questions: [
      {
        text: String,
        category: String,
        difficulty: String, // 'easy', 'medium', 'hard'
        aiGenerated: { type: Boolean, default: true },
      },
    ],
    answers: [
      {
        questionIndex: Number,
        userAnswer: String,
        evaluation: {
          score: Number, // 1-10
          feedback: String,
          missingElements: [String],
          improvedAnswer: String,
          toneAssessment: String, // Usually for HR/Behavioral
        },
        evaluatedAt: { type: Date, default: Date.now },
      },
    ],

    // --- Mock Placement Drive Config ---
    driveConfig: {
      driveType: {
        type: String,
        enum: ['tcs_nqt', 'infosys_infytq', 'amcat', 'wipro_nlth', 'cognizant_genc'],
      },
      sections: [
        {
          name: String, // e.g., 'Verbal', 'Quantitative'
          timeLimitSeconds: Number,
          questionCount: Number,
        },
      ],
      timeLimit: Number, // Total drive time limit in seconds
      currentSection: { type: Number, default: 0 },
    },
    driveResults: {
      predictedScore: { type: Number, default: null }, // Out of 100
      percentile: { type: Number, default: null },
      studyPlan: { type: [String], default: [] },
      sectionScores: [
        {
          sectionName: String,
          score: Number, // Out of 100
        },
      ],
    },

    // --- Session State ---
    status: {
      type: String,
      enum: ['setup', 'in_progress', 'completed', 'abandoned'],
      default: 'setup',
    },
    overallScore: {
      type: Number, // Calculated at the end of the session (1-10 or 1-100)
      default: null,
    },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    sessionDurationSeconds: { type: Number, default: 0 },

    // --- AI Metadata ---
    promptVersion: { type: String, default: null },
    modelUsed: { type: String, default: null },
  },
  {
    timestamps: true,
  }
)

// Indexes
interviewSessionSchema.index({ userId: 1, createdAt: -1 })
interviewSessionSchema.index({ userId: 1, type: 1 })
interviewSessionSchema.index({ userId: 1, status: 1 })

const InterviewSession = mongoose.model('InterviewSession', interviewSessionSchema)

module.exports = InterviewSession
