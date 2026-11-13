const express = require('express')

const {
  getOrders,
  getOrderById,
  createOrder,
  getAdminOrders,
  getAdminOrderById,
  updateAdminOrderStatus,
} = require('../controllers/order.controller')

const {
  generateInvoice,
} = require('../controllers/invoice.controller')

const {
  authenticate,
} = require('../middleware/auth.middleware')

const {
  requireAdmin,
} = require('../middleware/admin.middleware')

const router = express.Router()

router.use(authenticate)

router.get(
  '/admin',
  requireAdmin,
  getAdminOrders,
)

router.get(
  '/admin/:id',
  requireAdmin,
  getAdminOrderById,
)

router.patch(
  '/admin/:id/status',
  requireAdmin,
  updateAdminOrderStatus,
)

router.put(
  '/admin/:id/status',
  requireAdmin,
  updateAdminOrderStatus,
)

router.get('/', getOrders)

/*
  مهم:
  /:id/invoice خاصها تكون قبل /:id
*/
router.get(
  '/:id/invoice',
  generateInvoice,
)

router.get(
  '/:id',
  getOrderById,
)

router.post(
  '/',
  createOrder,
)

module.exports = router
