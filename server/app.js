const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const cookieParser = require('cookie-parser')
require('dotenv').config()

const authRoutes = require('./routes/auth.routes')
const resumeRoutes = require('./routes/resume.routes')
const errorMiddleware = require('./middleware/error.middleware')
const logger = require('./utils/logger')

const app = express()

/**
 * Middleware order is non-negotiable:
 *
 * 1. helmet — sets security headers FIRST, before any response is sent
 * 2. cors — must come before routes so preflight OPTIONS requests are handled
 * 3. morgan — request logger (before body parsing so we see all requests)
 * 4. express.json — parse request bodies before routes read req.body
 * 5. cookieParser — parse cookies before auth reads req.cookies
 * 6. Routes
 * 7. Health check (simple, no middleware overhead)
 * 8. 404 handler
 * 9. Global error handler — MUST be last, requires 4 args
 */

// 1. Security headers
app.use(
  helmet({
    crossOriginEmbedderPolicy: false, // allows embedding Cloudinary PDFs
  })
)

// 2. CORS — allow credentials so the httpOnly refresh cookie is sent cross-origin
const allowedOrigins = [
  'http://localhost:5173', // Vite dev server
  process.env.CLIENT_URL,  // Production frontend URL
].filter(Boolean)

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, curl)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true)
      }
      callback(new Error(`CORS policy: origin ${origin} not allowed`))
    },
    credentials: true, // Required for cookies to be sent cross-origin
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
)

// 3. Request logging
app.use(
  morgan('combined', {
    stream: { write: (message) => logger.info(message.trim()) },
    skip: (req) => req.url === '/health', // Skip health check noise
  })
)

// 4. Body parsing
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true, limit: '1mb' }))

// 5. Cookie parsing (for refresh token httpOnly cookie)
app.use(cookieParser())

// 6. API Routes
app.use('/auth', authRoutes)
app.use('/resumes', resumeRoutes)
const interviewRoutes = require('./routes/interview.routes')
app.use('/interviews', interviewRoutes)

// 7. Health check endpoint
// Railway uses this to verify the service is healthy after deploy
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  })
})

// 8. 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    code: 'NOT_FOUND',
    message: `Route ${req.method} ${req.path} not found`,
  })
})

// 9. Global error handler — 4 arguments tells Express it's an error handler
app.use(errorMiddleware)

module.exports = app
