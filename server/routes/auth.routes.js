const express = require('express')
const router = express.Router()
const { register, login, refresh, logout, me, completeOnboarding } = require('../controllers/auth.controller')
const { requireAuth } = require('../middleware/auth.middleware')

// POST /auth/register
router.post('/register', register)

// POST /auth/login
router.post('/login', login)

// POST /auth/refresh — reads from httpOnly cookie
router.post('/refresh', refresh)

// POST /auth/logout — requires valid access token
router.post('/logout', requireAuth, logout)

// GET /auth/me — returns current user profile
router.get('/me', requireAuth, me)

// PUT /auth/onboarding — saves 5-step onboarding data
router.put('/onboarding', requireAuth, completeOnboarding)

module.exports = router
