const express = require('express')

const {
  getAdminNotifications,
  markAdminNotificationsRead,
  searchAdmin,
  uploadAdminImages,
} = require('../controllers/admin.controller')

const {
  authenticate,
} = require('../middleware/auth.middleware')

const {
  requireAdmin,
} = require('../middleware/admin.middleware')

const {
  uploadAdminImages: uploadAdminImagesMiddleware,
} = require('../middleware/upload.middleware')

const router = express.Router()

router.use(
  authenticate,
  requireAdmin,
)

router.get(
  '/search',
  searchAdmin,
)

router.get(
  '/notifications',
  getAdminNotifications,
)

router.patch(
  '/notifications/read',
  markAdminNotificationsRead,
)

router.post(
  '/uploads/images/:scope',
  uploadAdminImagesMiddleware.array(
    'images',
    4,
  ),
  uploadAdminImages,
)

module.exports = router
