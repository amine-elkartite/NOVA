const express = require('express')

const {
  getPromotions,
  getPromotionById,
  createPromotion,
  updatePromotion,
  deletePromotion,
  validatePromotion,
} = require('../controllers/promotion.controller')

const { authenticate } = require('../middleware/auth.middleware')
const { requireAdmin } = require('../middleware/admin.middleware')

const router = express.Router()

// Public route used by customers to validate a promotion code
router.post(
  '/validate',
  validatePromotion,
)

// Admin-only routes
router.get(
  '/',
  authenticate,
  requireAdmin,
  getPromotions,
)

router.get(
  '/:id',
  authenticate,
  requireAdmin,
  getPromotionById,
)

router.post(
  '/',
  authenticate,
  requireAdmin,
  createPromotion,
)

router.put(
  '/:id',
  authenticate,
  requireAdmin,
  updatePromotion,
)

router.patch(
  '/:id',
  authenticate,
  requireAdmin,
  updatePromotion,
)

router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  deletePromotion,
)

module.exports = router
