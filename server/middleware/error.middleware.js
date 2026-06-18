const { ZodError } = require('zod')
const mongoose = require('mongoose')
const logger = require('../utils/logger')
const { AppError, ValidationError } = require('../utils/errors')

/**
 * Global error handler middleware.
 * Must be registered LAST in Express, with 4 arguments.
 *
 * Strategy:
 * - ZodError       → 422 ValidationError with field-level details
 * - Mongoose errors → normalised to AppError or ValidationError
 * - AppError       → use its own statusCode and code
 * - Unknown errors → 500, never expose stack traces in production
 *
 * What the client receives vs what gets logged:
 * - Client: { success: false, code, message, details? }
 * - Logs:   full error object including stack trace
 */
function errorMiddleware(err, req, res, next) { // eslint-disable-line no-unused-vars
  // 1. Normalise Zod validation errors
  // Using err.name check as a fallback to instanceof in case of multiple zod instances
  if (err instanceof ZodError || err.name === 'ZodError') {
    const issues = err.issues || err.errors || []
    const details = issues.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }))
    logger.warn('Validation error', { path: req.path, details })
    return res.status(422).json({
      success: false,
      code: 'VALIDATION_ERROR',
      message: 'Input validation failed',
      details,
    })
  }

  // 2. Normalise Mongoose duplicate key errors
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field'
    logger.warn('Duplicate key error', { field })
    return res.status(409).json({
      success: false,
      code: 'DUPLICATE_ERROR',
      message: `A record with that ${field} already exists`,
    })
  }

  // 3. Normalise Mongoose CastError (invalid ObjectId)
  if (err instanceof mongoose.Error.CastError) {
    logger.warn('Cast error', { path: err.path, value: err.value })
    return res.status(400).json({
      success: false,
      code: 'INVALID_ID',
      message: `Invalid value for field: ${err.path}`,
    })
  }

  // 4. Normalise Mongoose ValidationError
  if (err instanceof mongoose.Error.ValidationError) {
    const details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }))
    logger.warn('Mongoose validation error', { details })
    return res.status(422).json({
      success: false,
      code: 'VALIDATION_ERROR',
      message: 'Data validation failed',
      details,
    })
  }

  // 5. Handle known operational errors (AppError subclasses)
  if (err instanceof AppError) {
    logger.warn(`AppError [${err.code}]`, {
      message: err.message,
      statusCode: err.statusCode,
      path: req.path,
    })

    const response = {
      success: false,
      code: err.code,
      message: err.message,
    }

    // QuotaError includes extra fields for the client
    if (err.code === 'QUOTA_EXCEEDED') {
      response.upgradeRequired = err.upgradeRequired
      response.resetAt = err.resetAt
    }

    if (err.details) {
      response.details = err.details
    }

    return res.status(err.statusCode).json(response)
  }

  // 6. Unknown / unhandled errors — never expose internals to client
  logger.error('Unhandled error', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  })

  return res.status(500).json({
    success: false,
    code: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred. Please try again later.',
  })
}

module.exports = errorMiddleware
