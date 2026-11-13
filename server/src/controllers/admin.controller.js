const path = require('path')

const pool = require('../config/db')
const {
  scopedUploadDirectories,
} = require('../middleware/upload.middleware')

function parseLimit(value, fallback = 5) {
  const limit =
    Number(value)

  if (
    !Number.isInteger(limit) ||
    limit <= 0
  ) {
    return fallback
  }

  return Math.min(limit, 20)
}

function getInitials(name) {
  return String(name || '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('')
}

async function uploadAdminImages(
  req,
  res,
) {
  const scope =
    String(req.params.scope || '').trim()

  if (!scopedUploadDirectories[scope]) {
    return res.status(400).json({
      message:
        'Type de dossier image invalide.',
    })
  }

  const files =
    Array.isArray(req.files)
      ? req.files
      : []

  if (files.length === 0) {
    return res.status(400).json({
      message:
        'Veuillez selectionner au moins une image.',
    })
  }

  return res.status(201).json({
    images: files.map((file, index) => ({
      filename:
        file.filename,
      image_url:
        `/uploads/${scope}/${file.filename}`,
      url:
        `/uploads/${scope}/${file.filename}`,
      alt_text:
        path.parse(file.originalname).name,
      is_primary:
        index === 0,
      sort_order:
        index,
    })),
  })
}

async function searchAdmin(
  req,
  res,
  next,
) {
  try {
    const query =
      String(req.query.q || '').trim()

    if (query.length < 2) {
      return res.json({
        results: [],
      })
    }

    const limit =
      parseLimit(req.query.limit, 5)

    const likeTerm =
      `%${query}%`

    const numericQuery =
      Number(query.replace(/^#/, ''))

    const [orders] =
      await pool.query(
        `
        SELECT
          o.id,
          o.order_number,
          o.total,
          o.status,
          u.first_name,
          u.last_name,
          u.email
        FROM orders o
        INNER JOIN users u
          ON u.id = o.user_id
        WHERE
          o.order_number LIKE ?
          OR CAST(o.id AS CHAR) LIKE ?
          OR u.email LIKE ?
          OR CONCAT(u.first_name, ' ', u.last_name) LIKE ?
        ORDER BY o.created_at DESC, o.id DESC
        LIMIT ?
        `,
        [
          likeTerm,
          Number.isFinite(numericQuery)
            ? `%${numericQuery}%`
            : likeTerm,
          likeTerm,
          likeTerm,
          limit,
        ],
      )

    const [products] =
      await pool.query(
        `
        SELECT
          id,
          name,
          sku,
          status
        FROM products
        WHERE
          name LIKE ?
          OR sku LIKE ?
          OR slug LIKE ?
        ORDER BY updated_at DESC, id DESC
        LIMIT ?
        `,
        [
          likeTerm,
          likeTerm,
          likeTerm,
          limit,
        ],
      )

    const [customers] =
      await pool.query(
        `
        SELECT
          id,
          first_name,
          last_name,
          email,
          phone
        FROM users
        WHERE role = 'customer'
          AND (
            first_name LIKE ?
            OR last_name LIKE ?
            OR CONCAT(first_name, ' ', last_name) LIKE ?
            OR email LIKE ?
            OR phone LIKE ?
          )
        ORDER BY created_at DESC, id DESC
        LIMIT ?
        `,
        [
          likeTerm,
          likeTerm,
          likeTerm,
          likeTerm,
          likeTerm,
          limit,
        ],
      )

    res.json({
      results: [
        ...orders.map((order) => {
          const customerName =
            `${order.first_name || ''} ${order.last_name || ''}`.trim()

          return {
            id:
              `order-${order.id}`,
            type:
              'order',
            label:
              `Commande #${order.id}`,
            detail:
              `${customerName || order.email} - ${Number(order.total || 0).toLocaleString('fr-FR')} DH`,
            to:
              `/admin/commandes/${order.id}`,
          }
        }),

        ...products.map((product) => ({
          id:
            `product-${product.id}`,
          type:
            'product',
          label:
            product.name,
          detail:
            product.sku
              ? `SKU ${product.sku}`
              : product.status,
          to:
            `/admin/produits/${product.id}/modifier`,
        })),

        ...customers.map((customer) => {
          const customerName =
            `${customer.first_name || ''} ${customer.last_name || ''}`.trim()

          return {
            id:
              `customer-${customer.id}`,
            type:
              'customer',
            label:
              customerName || customer.email,
            detail:
              customer.email,
            to:
              `/admin/clients/${customer.id}`,
          }
        }),
      ],
    })
  } catch (error) {
    next(error)
  }
}

async function buildNotifications(
  adminId,
) {
  const notifications = []

  const [pendingOrders] =
    await pool.query(
      `
      SELECT
        o.id,
        o.total,
        o.created_at,
        u.first_name,
        u.last_name,
        u.email
      FROM orders o
      INNER JOIN users u
        ON u.id = o.user_id
      WHERE o.status = 'pending'
      ORDER BY o.created_at DESC, o.id DESC
      LIMIT 5
      `,
    )

  pendingOrders.forEach((order) => {
    const customerName =
      `${order.first_name || ''} ${order.last_name || ''}`.trim() ||
      order.email

    notifications.push({
      key:
        `order:${order.id}:pending`,
      type:
        'order',
      title:
        `Commande #${order.id} en attente`,
      detail:
        `${customerName} attend une confirmation.`,
      to:
        `/admin/commandes/${order.id}`,
      createdAt:
        order.created_at,
    })
  })

  const [messageRows] =
    await pool.query(
      `
      SELECT
        c.id,
        c.subject,
        c.unread_count,
        c.last_message_at,
        u.first_name,
        u.last_name,
        u.email
      FROM support_conversations c
      LEFT JOIN users u
        ON u.id = c.customer_id
      WHERE c.status <> 'archived'
        AND c.unread_count > 0
      ORDER BY c.last_message_at DESC, c.id DESC
      LIMIT 5
      `,
    )

  messageRows.forEach((conversation) => {
    const customerName =
      `${conversation.first_name || ''} ${conversation.last_name || ''}`.trim() ||
      conversation.email ||
      conversation.subject

    notifications.push({
      key:
        `message:${conversation.id}:unread`,
      type:
        'message',
      title:
        `${conversation.unread_count} message(s) non lu(s)`,
      detail:
        customerName,
      to:
        '/admin/messages',
      createdAt:
        conversation.last_message_at,
    })
  })

  const [lowStockRows] =
    await pool.query(
      `
      SELECT
        id,
        name,
        stock,
        updated_at
      FROM products
      WHERE stock > 0
        AND stock <= 5
        AND status <> 'archived'
      ORDER BY stock ASC, updated_at DESC
      LIMIT 5
      `,
    )

  lowStockRows.forEach((product) => {
    notifications.push({
      key:
        `product:${product.id}:low-stock`,
      type:
        'product',
      title:
        'Stock faible',
      detail:
        `${product.name} : ${product.stock} restant(s).`,
      to:
        `/admin/produits/${product.id}/modifier`,
      createdAt:
        product.updated_at,
    })
  })

  const keys =
    notifications.map((notification) => notification.key)

  if (keys.length === 0) {
    return []
  }

  const [readRows] =
    await pool.query(
      `
      SELECT notification_key
      FROM admin_notification_reads
      WHERE user_id = ?
        AND notification_key IN (?)
      `,
      [
        adminId,
        keys,
      ],
    )

  const readKeys =
    new Set(
      readRows.map((row) => row.notification_key),
    )

  return notifications.map((notification, index) => ({
    id:
      notification.key,
    ...notification,
    unread:
      !readKeys.has(notification.key),
    initials:
      getInitials(notification.title),
    sortIndex:
      index,
  }))
}

async function getAdminNotifications(
  req,
  res,
  next,
) {
  try {
    const notifications =
      await buildNotifications(
        req.user.id,
      )

    res.json({
      notifications,
      unreadCount:
        notifications.filter(
          (notification) => notification.unread,
        ).length,
    })
  } catch (error) {
    next(error)
  }
}

async function markAdminNotificationsRead(
  req,
  res,
  next,
) {
  try {
    const notifications =
      await buildNotifications(
        req.user.id,
      )

    const requestedKeys =
      Array.isArray(req.body?.keys)
        ? req.body.keys.map(String)
        : []

    const keysToMark =
      req.body?.all
        ? notifications.map((notification) => notification.key)
        : requestedKeys

    const uniqueKeys =
      Array.from(
        new Set(
          keysToMark.filter(Boolean),
        ),
      )

    for (const key of uniqueKeys) {
      await pool.query(
        `
        INSERT INTO admin_notification_reads (
          user_id,
          notification_key,
          read_at
        )
        VALUES (?, ?, NOW())
        ON DUPLICATE KEY UPDATE
          read_at = VALUES(read_at)
        `,
        [
          req.user.id,
          key,
        ],
      )
    }

    const nextNotifications =
      await buildNotifications(
        req.user.id,
      )

    res.json({
      notifications:
        nextNotifications,
      unreadCount:
        nextNotifications.filter(
          (notification) => notification.unread,
        ).length,
    })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  uploadAdminImages,
  searchAdmin,
  getAdminNotifications,
  markAdminNotificationsRead,
}
