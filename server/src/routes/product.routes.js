const express = require('express')

const {
  getProducts,
  getAdminProducts,
  getAdminProductById,
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
  getProductBySlug,
} = require('../controllers/product.controller')

const { authenticate } = require('../middleware/auth.middleware')
const { requireAdmin } = require('../middleware/admin.middleware')

const router = express.Router()

router.get(
  '/admin',
  authenticate,
  requireAdmin,
  getAdminProducts,
)

router.get(
  '/admin/:id',
  authenticate,
  requireAdmin,
  getAdminProductById,
)

router.post(
  '/admin',
  authenticate,
  requireAdmin,
  createAdminProduct,
)

router.put(
  '/admin/:id',
  authenticate,
  requireAdmin,
  updateAdminProduct,
)

router.patch(
  '/admin/:id',
  authenticate,
  requireAdmin,
  updateAdminProduct,
)

router.delete(
  '/admin/:id',
  authenticate,
  requireAdmin,
  deleteAdminProduct,
)

router.get('/', getProducts)
router.get('/:slug', getProductBySlug)

module.exports = router
