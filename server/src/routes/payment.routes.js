const express = require('express')

const {
  createCardPaymentSession,
  handlePaymentWebhook,
} = require(
  '../controllers/payment.controller',
)

const {
  authenticate,
} = require(
  '../middleware/auth.middleware',
)

const router = express.Router()


/* =========================
   CARD PAYMENT SESSION
========================= */

router.post(
  '/card/session',
  authenticate,
  createCardPaymentSession,
)


/* =========================
   PAYMENT WEBHOOK
========================= */

router.post(
  '/webhook',
  handlePaymentWebhook,
)


module.exports = router