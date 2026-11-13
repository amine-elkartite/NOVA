const express = require('express')

const {
  getProductReviews,
  createReview,
  getMyProductReview,
} = require('../controllers/review.controller')

const {
  authenticate,
} = require('../middleware/auth.middleware')

const router = express.Router()

router.get(
  '/product/:productId',
  getProductReviews,
)

router.get(
  '/product/:productId/me',
  authenticate,
  getMyProductReview,
)

router.post(
  '/',
  authenticate,
  createReview,
)

module.exports = router