const express = require('express')

const {
  getCategories,
  getAdminCategories,
  getAdminCategoryById,
  createAdminCategory,
  updateAdminCategory,
  deleteAdminCategory,
  getCategoryBySlug,
} = require('../controllers/category.controller')

const { authenticate } = require('../middleware/auth.middleware')
const { requireAdmin } = require('../middleware/admin.middleware')

const router = express.Router()

router.get(
  '/admin',
  authenticate,
  requireAdmin,
  getAdminCategories,
)

router.get(
  '/admin/:id',
  authenticate,
  requireAdmin,
  getAdminCategoryById,
)

router.post(
  '/admin',
  authenticate,
  requireAdmin,
  createAdminCategory,
)

router.put(
  '/admin/:id',
  authenticate,
  requireAdmin,
  updateAdminCategory,
)

router.patch(
  '/admin/:id',
  authenticate,
  requireAdmin,
  updateAdminCategory,
)

router.delete(
  '/admin/:id',
  authenticate,
  requireAdmin,
  deleteAdminCategory,
)

router.get('/', getCategories)
router.get('/:slug', getCategoryBySlug)

module.exports = router
