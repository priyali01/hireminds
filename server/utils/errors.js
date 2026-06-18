/**
 * Custom error classes for HireMinds API.
 * Each class extends AppError which extends the native Error.
 * The global error handler reads these classes to build the correct HTTP response.
 */

class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message)
    this.name = this.constructor.name
    this.statusCode = statusCode
    this.code = code || 'APP_ERROR'
    this.isOperational = true // Distinguishes expected errors from programming bugs
    Error.captureStackTrace(this, this.constructor)
  }
}

class ValidationError extends AppError {
  constructor(message, details) {
    super(message, 422, 'VALIDATION_ERROR')
    this.details = details || []
  }
}

class AuthError extends AppError {
  constructor(message) {
    super(message || 'Not authenticated', 401, 'AUTH_ERROR')
  }
}

class ForbiddenError extends AppError {
  constructor(message) {
    super(message || 'Access forbidden', 403, 'FORBIDDEN')
  }
}

class NotFoundError extends AppError {
  constructor(resource) {
    super(`${resource || 'Resource'} not found`, 404, 'NOT_FOUND')
  }
}

class QuotaError extends AppError {
  constructor(resetAt) {
    super('Usage quota exceeded for your plan', 429, 'QUOTA_EXCEEDED')
    this.upgradeRequired = true
    this.resetAt = resetAt || null
  }
}

class AIError extends AppError {
  constructor(message) {
    super(message || 'AI service failed to produce a valid response', 502, 'AI_ERROR')
  }
}

module.exports = {
  AppError,
  ValidationError,
  AuthError,
  ForbiddenError,
  NotFoundError,
  QuotaError,
  AIError,
}
