const express = require('express')

const {
  getCart,
  addCartItem,
  updateCartItem,
  removeCartItem,
  clearCart,
} = require('../controllers/cart.controller')

const {
  authenticate,
} = require('../middleware/auth.middleware')

const router = express.Router()

router.use(authenticate)

router.get('/', getCart)

router.post('/items', addCartItem)

router.put('/items/:id', updateCartItem)

router.delete('/items/:id', removeCartItem)

router.delete('/', clearCart)

module.exports = router