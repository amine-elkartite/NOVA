const express = require('express')

const {
  createAdminConversation,
  getAdminConversationById,
  getAdminConversations,
  sendAdminMessage,
  updateAdminConversation,
} = require('../controllers/message.controller')

const {
  authenticate,
} = require('../middleware/auth.middleware')

const {
  requireAdmin,
} = require('../middleware/admin.middleware')

const router = express.Router()

router.use(
  authenticate,
  requireAdmin,
)

router.get(
  '/admin/conversations',
  getAdminConversations,
)

router.post(
  '/admin/conversations',
  createAdminConversation,
)

router.get(
  '/admin/conversations/:id',
  getAdminConversationById,
)

router.patch(
  '/admin/conversations/:id',
  updateAdminConversation,
)

router.put(
  '/admin/conversations/:id',
  updateAdminConversation,
)

router.post(
  '/admin/conversations/:id/messages',
  sendAdminMessage,
)

module.exports = router
