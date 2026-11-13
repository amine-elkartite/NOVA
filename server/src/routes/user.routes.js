const express = require('express')

const {
  getMyProfile,
  updateMyProfile,
  uploadMyAvatar,
  deleteMyAvatar,
  getAdminCustomers,
  getAdminCustomerById,
  updateAdminCustomerStatus,
} = require('../controllers/user.controller')

const {
  authenticate,
} = require('../middleware/auth.middleware')

const {
  requireAdmin,
} = require('../middleware/admin.middleware')

const {
  uploadAvatar,
} = require('../middleware/upload.middleware')

const router = express.Router()

router.get(
  '/admin/customers',
  authenticate,
  requireAdmin,
  getAdminCustomers,
)

router.get(
  '/admin/customers/:id',
  authenticate,
  requireAdmin,
  getAdminCustomerById,
)

router.patch(
  '/admin/customers/:id/status',
  authenticate,
  requireAdmin,
  updateAdminCustomerStatus,
)

router.put(
  '/admin/customers/:id/status',
  authenticate,
  requireAdmin,
  updateAdminCustomerStatus,
)

router.get(
  '/me',
  authenticate,
  getMyProfile,
)

router.put(
  '/me',
  authenticate,
  updateMyProfile,
)

router.post(
  '/me/avatar',
  authenticate,
  uploadAvatar.single('avatar'),
  uploadMyAvatar,
)

router.delete(
  '/me/avatar',
  authenticate,
  deleteMyAvatar,
)

module.exports = router
