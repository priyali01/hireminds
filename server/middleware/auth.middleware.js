const jwt = require('jsonwebtoken')
const { AuthError } = require('../utils/errors')

/**
 * JWT authentication middleware.
 *
 * Strategy:
 * - Reads the access token from the Authorization header: "Bearer <token>"
 * - On a valid token: attaches the decoded payload to req.user and calls next()
 * - On an expired access token: returns 401 with code TOKEN_EXPIRED.
 *   The client is responsible for calling /auth/refresh and retrying.
 *   We do NOT automatically refresh on the server because:
 *   (a) The refresh token is in an httpOnly cookie and accessible here, but
 *   (b) Automatically refreshing inside middleware creates ambiguity about
 *       which response the client receives. It's cleaner to have the client
 *       handle the refresh cycle via RTK Query baseQuery.
 * - On any other invalid token: returns 401 with code AUTH_ERROR.
 */
async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthError('Authorization header is missing or malformed')
    }

    const token = authHeader.split(' ')[1]

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // Attach the user payload to the request object
    // Shape: { userId, email, plan, role }
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      plan: decoded.plan,
      role: decoded.role,
    }

    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        code: 'TOKEN_EXPIRED',
        message: 'Access token has expired. Please refresh.',
      })
    }

    if (err instanceof AuthError) {
      return next(err)
    }

    // jwt.verify threw JsonWebTokenError (tampered/invalid token)
    return next(new AuthError('Invalid access token'))
  }
}

/**
 * Optional auth middleware. Attaches user if token exists, but does not block
 * requests without a token. Use for public routes that optionally personalise.
 */
async function optionalAuthMiddleware(req, res, next) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next()
  }

  try {
    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      plan: decoded.plan,
      role: decoded.role,
    }
  } catch {
    // Token invalid or expired — just continue without user
  }

  return next()
}

module.exports = { requireAuth: authMiddleware, optionalAuthMiddleware }
