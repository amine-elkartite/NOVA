const express = require('express')

const {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} = require('../controllers/address.controller')

const {
  authenticate,
} = require('../middleware/auth.middleware')

const router = express.Router()

router.get('/', authenticate, getAddresses)

router.post('/', authenticate, createAddress)

router.put('/:id', authenticate, updateAddress)

router.delete('/:id', authenticate, deleteAddress)

router.put(
  '/:id/default',
  authenticate,
  setDefaultAddress,
)

module.exports = router