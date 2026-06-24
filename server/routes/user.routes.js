const express = require('express')
const router = express.Router()
const { updateProfile, changePassword, deleteAccount } = require('../controllers/user.controller')
const { requireAuth } = require('../middleware/auth.middleware')

// All routes require authentication
router.use(requireAuth)

// PUT /api/users/profile
router.put('/profile', updateProfile)

// POST /api/users/change-password
router.post('/change-password', changePassword)

// DELETE /api/users/account
router.delete('/account', deleteAccount)

module.exports = router
