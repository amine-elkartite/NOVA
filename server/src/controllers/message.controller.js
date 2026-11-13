const pool = require('../config/db')

const allowedConversationStatuses = [
  'open',
  'pending',
  'resolved',
  'archived',
]

function parseNumericId(value) {
  const id =
    Number(value)

  return Number.isInteger(id) &&
    id > 0
    ? id
    : null
}

function getInitials(name) {
  return String(name || '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('')
}

function formatTime(value) {
  if (!value) {
    return ''
  }

  const date =
    new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

async function getConversationMessages(
  conversationId,
) {
  const [messages] =
    await pool.query(
      `
      SELECT
        id,
        conversation_id,
        sender_type,
        sender_user_id,
        body,
        attachment_url,
        read_at,
        created_at
      FROM support_messages
      WHERE conversation_id = ?
      ORDER BY created_at ASC, id ASC
      `,
      [conversationId],
    )

  return messages.map((message) => ({
    id:
      message.id,
    conversationId:
      message.conversation_id,
    sender:
      message.sender_type,
    senderUserId:
      message.sender_user_id,
    text:
      message.body,
    attachmentUrl:
      message.attachment_url,
    read:
      Boolean(message.read_at),
    time:
      formatTime(message.created_at),
    createdAt:
      message.created_at,
  }))
}

async function getConversationTags(
  conversationId,
) {
  const [rows] =
    await pool.query(
      `
      SELECT tag
      FROM support_conversation_tags
      WHERE conversation_id = ?
      ORDER BY tag ASC
      `,
      [conversationId],
    )

  return rows.map((row) => row.tag)
}

async function fetchConversationRows() {
  const [rows] =
    await pool.query(
      `
      SELECT
        c.id,
        c.customer_id,
        c.created_by_admin_id,
        c.subject,
        c.status,
        c.unread_count,
        c.last_message_at,
        c.created_at,
        c.updated_at,

        u.first_name,
        u.last_name,
        u.email,
        u.phone,
        u.city,
        u.country,
        u.avatar_url,
        u.created_at AS customer_created_at,

        COALESCE(os.orders_count, 0) AS orders_count,
        COALESCE(os.total_spent, 0) AS total_spent,
        lo.order_number AS latest_order_number

      FROM support_conversations c

      LEFT JOIN users u
        ON u.id = c.customer_id

      LEFT JOIN (
        SELECT
          user_id,
          COUNT(*) AS orders_count,
          COALESCE(
            SUM(
              CASE
                WHEN status = 'cancelled' THEN 0
                ELSE total
              END
            ),
            0
          ) AS total_spent
        FROM orders
        GROUP BY user_id
      ) os
        ON os.user_id = c.customer_id

      LEFT JOIN (
        SELECT o1.user_id, o1.order_number
        FROM orders o1
        INNER JOIN (
          SELECT user_id, MAX(created_at) AS latest_created_at
          FROM orders
          GROUP BY user_id
        ) latest
          ON latest.user_id = o1.user_id
          AND latest.latest_created_at = o1.created_at
      ) lo
        ON lo.user_id = c.customer_id

      ORDER BY
        COALESCE(c.last_message_at, c.updated_at, c.created_at) DESC,
        c.id DESC
      `,
    )

  return rows
}

async function fetchConversationById(
  conversationId,
) {
  const rows =
    await fetchConversationRows()

  return rows.find(
    (row) =>
      Number(row.id) === Number(conversationId),
  ) || null
}

async function normalizeConversation(row) {
  const name =
    `${row.first_name || ''} ${row.last_name || ''}`.trim() ||
    row.subject ||
    `Conversation #${row.id}`

  const [
    messages,
    tags,
  ] = await Promise.all([
    getConversationMessages(row.id),
    getConversationTags(row.id),
  ])

  const lastMessage =
    messages[messages.length - 1]

  return {
    id:
      row.id,
    customerId:
      row.customer_id,
    name,
    avatar:
      row.avatar_url || '',
    initials:
      getInitials(name),
    preview:
      lastMessage?.text ||
      row.subject,
    time:
      formatTime(
        row.last_message_at ||
          row.updated_at ||
          row.created_at,
      ),
    unread:
      Number(row.unread_count || 0),
    status:
      row.status,
    online:
      false,
    order:
      row.latest_order_number
        ? `Commande ${row.latest_order_number}`
        : 'Sans commande',
    customerSince:
      row.customer_created_at
        ? `Client depuis ${formatTime(row.customer_created_at)}`
        : 'Contact admin',
    email:
      row.email || '',
    phone:
      row.phone || '',
    location:
      [row.city, row.country]
        .filter(Boolean)
        .join(', ') || 'Non renseigne',
    orderCount:
      Number(row.orders_count || 0),
    spent:
      `${Number(row.total_spent || 0).toLocaleString('fr-FR')} DH`,
    tags,
    messages,
    createdAt:
      row.created_at,
    updatedAt:
      row.updated_at,
  }
}

async function getAdminConversations(
  req,
  res,
  next,
) {
  try {
    const rows =
      await fetchConversationRows()

    const conversations =
      await Promise.all(
        rows.map(normalizeConversation),
      )

    res.json({
      conversations,
      stats: {
        total:
          conversations.length,
        unread:
          conversations.reduce(
            (total, conversation) =>
              total + Number(conversation.unread || 0),
            0,
          ),
        active:
          conversations.filter(
            (conversation) =>
              ![
                'resolved',
                'archived',
              ].includes(
                conversation.status,
              ),
          ).length,
        pending:
          conversations.filter(
            (conversation) =>
              conversation.status === 'pending',
          ).length,
      },
    })
  } catch (error) {
    next(error)
  }
}

async function getAdminConversationById(
  req,
  res,
  next,
) {
  try {
    const conversationId =
      parseNumericId(req.params.id)

    if (!conversationId) {
      return res.status(400).json({
        message:
          'Identifiant de conversation invalide.',
      })
    }

    const row =
      await fetchConversationById(
        conversationId,
      )

    if (!row) {
      return res.status(404).json({
        message:
          'Conversation introuvable.',
      })
    }

    res.json({
      conversation:
        await normalizeConversation(row),
    })
  } catch (error) {
    next(error)
  }
}

async function createAdminConversation(
  req,
  res,
  next,
) {
  const connection =
    await pool.getConnection()

  try {
    const customerId =
      req.body?.customerId
        ? parseNumericId(req.body.customerId)
        : null

    const subject =
      String(
        req.body?.subject ||
          'Conversation client',
      ).trim()

    const message =
      String(
        req.body?.message ||
          '',
      ).trim()

    const status =
      allowedConversationStatuses.includes(
        req.body?.status,
      )
        ? req.body.status
        : 'open'

    if (!subject) {
      return res.status(400).json({
        message:
          'Le sujet est requis.',
      })
    }

    if (customerId) {
      const [customerRows] =
        await connection.query(
          `
          SELECT id
          FROM users
          WHERE id = ?
            AND role = 'customer'
          LIMIT 1
          `,
          [customerId],
        )

      if (customerRows.length === 0) {
        return res.status(404).json({
          message:
            'Client introuvable.',
        })
      }
    }

    await connection.beginTransaction()

    const [result] =
      await connection.query(
        `
        INSERT INTO support_conversations (
          customer_id,
          created_by_admin_id,
          subject,
          status,
          last_message_at
        )
        VALUES (?, ?, ?, ?, NOW())
        `,
        [
          customerId,
          req.user.id,
          subject,
          status,
        ],
      )

    if (message) {
      await connection.query(
        `
        INSERT INTO support_messages (
          conversation_id,
          sender_type,
          sender_user_id,
          body,
          read_at
        )
        VALUES (?, 'admin', ?, ?, NOW())
        `,
        [
          result.insertId,
          req.user.id,
          message,
        ],
      )
    }

    await connection.commit()

    const row =
      await fetchConversationById(
        result.insertId,
      )

    res.status(201).json({
      message:
        'Conversation creee.',
      conversation:
        await normalizeConversation(row),
    })
  } catch (error) {
    try {
      await connection.rollback()
    } catch {
      // Transaction already closed.
    }

    next(error)
  } finally {
    connection.release()
  }
}

async function sendAdminMessage(
  req,
  res,
  next,
) {
  const connection =
    await pool.getConnection()

  try {
    const conversationId =
      parseNumericId(req.params.id)

    if (!conversationId) {
      return res.status(400).json({
        message:
          'Identifiant de conversation invalide.',
      })
    }

    const body =
      String(
        req.body?.body ||
          req.body?.message ||
          '',
      ).trim()

    if (!body) {
      return res.status(400).json({
        message:
          'Le message est requis.',
      })
    }

    const row =
      await fetchConversationById(
        conversationId,
      )

    if (!row) {
      return res.status(404).json({
        message:
          'Conversation introuvable.',
      })
    }

    await connection.beginTransaction()

    await connection.query(
      `
      INSERT INTO support_messages (
        conversation_id,
        sender_type,
        sender_user_id,
        body,
        attachment_url,
        read_at
      )
      VALUES (?, 'admin', ?, ?, ?, NOW())
      `,
      [
        conversationId,
        req.user.id,
        body,
        req.body?.attachmentUrl || null,
      ],
    )

    await connection.query(
      `
      UPDATE support_conversations
      SET
        status = 'open',
        unread_count = 0,
        last_message_at = NOW()
      WHERE id = ?
      `,
      [conversationId],
    )

    await connection.commit()

    const nextRow =
      await fetchConversationById(
        conversationId,
      )

    res.status(201).json({
      message:
        'Message envoye.',
      conversation:
        await normalizeConversation(nextRow),
    })
  } catch (error) {
    try {
      await connection.rollback()
    } catch {
      // Transaction already closed.
    }

    next(error)
  } finally {
    connection.release()
  }
}

async function updateAdminConversation(
  req,
  res,
  next,
) {
  const connection =
    await pool.getConnection()

  try {
    const conversationId =
      parseNumericId(req.params.id)

    if (!conversationId) {
      return res.status(400).json({
        message:
          'Identifiant de conversation invalide.',
      })
    }

    const row =
      await fetchConversationById(
        conversationId,
      )

    if (!row) {
      return res.status(404).json({
        message:
          'Conversation introuvable.',
      })
    }

    const status =
      req.body?.status

    if (
      status &&
      !allowedConversationStatuses.includes(
        status,
      )
    ) {
      return res.status(400).json({
        message:
          'Statut de conversation invalide.',
      })
    }

    await connection.beginTransaction()

    if (status) {
      await connection.query(
        `
        UPDATE support_conversations
        SET status = ?,
            unread_count = CASE
              WHEN ? IN ('resolved', 'archived') THEN 0
              ELSE unread_count
            END
        WHERE id = ?
        `,
        [
          status,
          status,
          conversationId,
        ],
      )
    }

    if (req.body?.read === true) {
      await connection.query(
        `
        UPDATE support_messages
        SET read_at = COALESCE(read_at, NOW())
        WHERE conversation_id = ?
          AND sender_type = 'customer'
        `,
        [conversationId],
      )

      await connection.query(
        `
        UPDATE support_conversations
        SET unread_count = 0
        WHERE id = ?
        `,
        [conversationId],
      )
    }

    if (Array.isArray(req.body?.tags)) {
      await connection.query(
        `
        DELETE FROM support_conversation_tags
        WHERE conversation_id = ?
        `,
        [conversationId],
      )

      const tags =
        Array.from(
          new Set(
            req.body.tags
              .map((tag) => String(tag || '').trim())
              .filter(Boolean)
              .slice(0, 12),
          ),
        )

      for (const tag of tags) {
        await connection.query(
          `
          INSERT INTO support_conversation_tags (
            conversation_id,
            tag
          )
          VALUES (?, ?)
          `,
          [
            conversationId,
            tag.slice(0, 80),
          ],
        )
      }
    }

    await connection.commit()

    const nextRow =
      await fetchConversationById(
        conversationId,
      )

    res.json({
      message:
        'Conversation mise a jour.',
      conversation:
        await normalizeConversation(nextRow),
    })
  } catch (error) {
    try {
      await connection.rollback()
    } catch {
      // Transaction already closed.
    }

    next(error)
  } finally {
    connection.release()
  }
}

module.exports = {
  getAdminConversations,
  getAdminConversationById,
  createAdminConversation,
  sendAdminMessage,
  updateAdminConversation,
}
