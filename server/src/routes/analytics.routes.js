const express = require('express')

const {
  getAdminAnalytics,
} = require('../controllers/analytics.controller')

const {
  authenticate,
} = require('../middleware/auth.middleware')

const {
  requireAdmin,
} = require('../middleware/admin.middleware')

const router = express.Router()

router.get(
  '/admin',
  authenticate,
  requireAdmin,
  getAdminAnalytics,
)

router.get(
  '/admin/dashboard',
  authenticate,
  requireAdmin,
  getAdminAnalytics,
)

module.exports = router
