const express = require('express')

const {
  getAdminSettings,
  getPublicStorefrontSettings,
  getProfilePreferences,
  resetAdminSettings,
  updateAdminSettings,
  updateProfilePreferences,
} = require('../controllers/settings.controller')

const {
  authenticate,
} = require('../middleware/auth.middleware')

const {
  requireAdmin,
} = require('../middleware/admin.middleware')

const router = express.Router()

router.get(
  '/storefront',
  getPublicStorefrontSettings,
)

router.use(
  authenticate,
  requireAdmin,
)

router.get(
  '/admin',
  getAdminSettings,
)

router.put(
  '/admin',
  updateAdminSettings,
)

router.post(
  '/admin/reset',
  resetAdminSettings,
)

router.get(
  '/admin/profile-preferences',
  getProfilePreferences,
)

router.put(
  '/admin/profile-preferences',
  updateProfilePreferences,
)

module.exports = router
