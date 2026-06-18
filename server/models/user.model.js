const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

/**
 * User model.
 *
 * Covers:
 * - Authentication (email, password, tokens)
 * - Onboarding data (level, targetRoles, skills, college, branch, graduationYear)
 * - Plan and role for quota enforcement
 * - DPDP Act 2023 consent tracking (consentGiven, consentAt, consentVersion)
 * - Refresh token rotation (refreshToken stored hashed, old tokens invalid after rotation)
 *
 * Indexes:
 * - email: unique (primary lookup)
 * - plan + role: compound (quota middleware lookup)
 */
const userSchema = new mongoose.Schema(
  {
    // --- Auth ---
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Enter a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // never returned in queries unless explicitly asked
    },
    refreshToken: {
      type: String,
      select: false, // stored hashed, never exposed in responses
    },

    // --- Profile ---
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },

    // --- Plan ---
    plan: {
      type: String,
      enum: ['free', 'pro', 'campus'],
      default: 'free',
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'tpo'],
      default: 'user',
    },
    planExpiresAt: {
      type: Date,
      default: null,
    },

    // --- Onboarding (5-step wizard) ---
    onboardingComplete: {
      type: Boolean,
      default: false,
    },
    level: {
      type: String,
      enum: ['fresher', 'intermediate', 'experienced'],
      default: null,
    },
    targetRoles: {
      type: [String],
      default: [],
    },
    skills: {
      type: [String],
      default: [],
    },
    college: {
      type: String,
      default: null,
    },
    branch: {
      type: String,
      default: null,
    },
    graduationYear: {
      type: Number,
      min: 2000,
      max: 2035,
      default: null,
    },

    // --- Usage Quotas (reset daily by cron) ---
    aiUsageToday: {
      type: Number,
      default: 0,
    },
    analysesThisMonth: {
      type: Number,
      default: 0,
    },
    interviewsThisWeek: {
      type: Number,
      default: 0,
    },
    lastQuotaReset: {
      type: Date,
      default: Date.now,
    },

    // --- DPDP Act 2023 Compliance ---
    consentGiven: {
      type: Boolean,
      required: true,
      default: false,
    },
    consentAt: {
      type: Date,
      default: null,
    },
    consentVersion: {
      type: String,
      default: '1.0', // Bump when privacy policy changes
    },
    dataExportRequestedAt: {
      type: Date,
      default: null,
    },
    deletionRequestedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt managed automatically
  }
)

// --- Indexes ---
userSchema.index({ plan: 1, role: 1 }) // Quota middleware lookups
userSchema.index({ lastQuotaReset: 1 }) // Daily reset cron query

// --- Pre-save hook: hash password before saving ---
userSchema.pre('save', async function () {
  // Only hash if the password field was modified
  if (!this.isModified('password')) return
  const salt = await bcrypt.genSalt(12)
  this.password = await bcrypt.hash(this.password, salt)
})

// --- Instance method: compare plain-text password against hash ---
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password)
}

// --- Instance method: return a safe public profile (no password/tokens) ---
userSchema.methods.toPublicProfile = function () {
  return {
    id: this._id,
    email: this.email,
    fullName: this.fullName,
    plan: this.plan,
    role: this.role,
    level: this.level,
    targetRoles: this.targetRoles,
    skills: this.skills,
    college: this.college,
    branch: this.branch,
    graduationYear: this.graduationYear,
    onboardingComplete: this.onboardingComplete,
    consentGiven: this.consentGiven,
    createdAt: this.createdAt,
  }
}

const User = mongoose.model('User', userSchema)

module.exports = User
