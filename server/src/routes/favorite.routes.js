const express = require('express')

const {
  getFavorites,
  addFavorite,
  removeFavorite,
} = require('../controllers/favorite.controller')

const { authenticate } = require('../middleware/auth.middleware')

const router = express.Router()

router.use(authenticate)

router.get('/', getFavorites)
router.post('/:productId', addFavorite)
router.delete('/:productId', removeFavorite)

module.exports = router