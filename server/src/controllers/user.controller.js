const fs = require('fs')
const path = require('path')

const db = require('../config/db')

const avatarsDirectory = path.join(
  __dirname,
  '../../uploads/avatars',
)

const getUserById = async (userId) => {
  const [rows] = await db.execute(
    `
    SELECT
      id,
      first_name,
      last_name,
      email,
      phone,
      city,
      country,
      avatar_url,
      newsletter_opt_in,
      role,
      is_active,
      created_at,
      updated_at
    FROM users
    WHERE id = ?
    LIMIT 1
    `,
    [userId],
  )

  return rows[0] || null
}

function parseNumericId(value) {
  const id =
    Number(value)

  return Number.isInteger(id) &&
    id > 0
    ? id
    : null
}

async function getAdminCustomerByIdRow(
  customerId,
) {
  const [rows] = await db.execute(
    `
    SELECT
      u.id,
      u.first_name,
      u.last_name,
      u.email,
      u.phone,
      u.city,
      u.country,
      u.avatar_url,
      u.newsletter_opt_in,
      u.role,
      u.is_active,
      u.created_at,
      u.updated_at,

      COALESCE(os.orders_count, 0) AS orders_count,
      COALESCE(os.total_spent, 0) AS total_spent,
      os.last_order_at,

      (
        SELECT a.city
        FROM addresses a
        WHERE a.user_id = u.id
        ORDER BY a.is_default DESC, a.id ASC
        LIMIT 1
      ) AS address_city,

      (
        SELECT a.country
        FROM addresses a
        WHERE a.user_id = u.id
        ORDER BY a.is_default DESC, a.id ASC
        LIMIT 1
      ) AS address_country,

      (
        SELECT a.phone
        FROM addresses a
        WHERE a.user_id = u.id
        ORDER BY a.is_default DESC, a.id ASC
        LIMIT 1
      ) AS address_phone

    FROM users u

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
        ) AS total_spent,
        MAX(created_at) AS last_order_at
      FROM orders
      GROUP BY user_id
    ) os
      ON os.user_id = u.id

    WHERE u.id = ?
      AND u.role = 'customer'

    LIMIT 1
    `,
    [customerId],
  )

  return rows[0] || null
}

async function getCustomerRecentOrders(
  customerId,
) {
  const [orders] = await db.execute(
    `
    SELECT
      o.id,
      o.order_number,
      o.status,
      o.subtotal,
      o.shipping_cost,
      o.discount,
      o.total,
      o.payment_method,
      o.payment_status,
      o.shipping_address,
      o.notes,
      o.created_at,
      o.updated_at,
      COUNT(oi.id) AS item_lines,
      COALESCE(SUM(oi.quantity), 0) AS item_quantity
    FROM orders o
    LEFT JOIN order_items oi
      ON oi.order_id = o.id
    WHERE o.user_id = ?
    GROUP BY
      o.id,
      o.order_number,
      o.status,
      o.subtotal,
      o.shipping_cost,
      o.discount,
      o.total,
      o.payment_method,
      o.payment_status,
      o.shipping_address,
      o.notes,
      o.created_at,
      o.updated_at
    ORDER BY o.created_at DESC, o.id DESC
    `,
    [customerId],
  )

  return orders
}

async function getCustomerAddresses(
  customerId,
) {
  const [addresses] = await db.execute(
    `
    SELECT
      id,
      label,
      full_name,
      address_line1,
      address_line2,
      city,
      postal_code,
      country,
      phone,
      is_default,
      created_at,
      updated_at
    FROM addresses
    WHERE user_id = ?
    ORDER BY is_default DESC, id ASC
    `,
    [customerId],
  )

  return addresses
}

const deleteAvatarFile = (avatarUrl) => {
  if (!avatarUrl) {
    return
  }

  const filename = path.basename(
    avatarUrl,
  )

  const filePath = path.join(
    avatarsDirectory,
    filename,
  )

  if (!filePath.startsWith(avatarsDirectory)) {
    return
  }

  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath)
    } catch (error) {
      console.error(
        'Impossible de supprimer l’ancien avatar :',
        error.message,
      )
    }
  }
}

const getMyProfile = async (
  req,
  res,
  next,
) => {
  try {
    const userId = req.user.id

    const user =
      await getUserById(userId)

    if (!user) {
      return res.status(404).json({
        message:
          'Utilisateur introuvable.',
      })
    }

    return res.json({
      user,
    })
  } catch (error) {
    next(error)
  }
}

const updateMyProfile = async (
  req,
  res,
  next,
) => {
  try {
    const userId = req.user.id

    const {
      first_name,
      last_name,
      email,
      phone,
      city,
      country,
      newsletter_opt_in,
    } = req.body

    const firstName =
      String(first_name || '').trim()

    const lastName =
      String(last_name || '').trim()

    if (!firstName) {
      return res.status(400).json({
        message:
          'Le prénom est obligatoire.',
      })
    }

    if (!lastName) {
      return res.status(400).json({
        message:
          'Le nom est obligatoire.',
      })
    }

    const normalizedEmail =
      String(email || '').trim().toLowerCase()

    if (
      normalizedEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        normalizedEmail,
      )
    ) {
      return res.status(400).json({
        message:
          'Adresse email invalide.',
      })
    }

    if (normalizedEmail) {
      const [existingEmailRows] =
        await db.execute(
          `
          SELECT id
          FROM users
          WHERE email = ?
            AND id <> ?
          LIMIT 1
          `,
          [
            normalizedEmail,
            userId,
          ],
        )

      if (existingEmailRows.length > 0) {
        return res.status(409).json({
          message:
            'Cette adresse email est deja utilisee.',
        })
      }
    }

    let newsletterOptIn = 0

    if (
      newsletter_opt_in === true ||
      newsletter_opt_in === 1 ||
      newsletter_opt_in === '1' ||
      newsletter_opt_in === 'true'
    ) {
      newsletterOptIn = 1
    }

    await db.execute(
      `
      UPDATE users
      SET
        first_name = ?,
        last_name = ?,
        email = COALESCE(?, email),
        phone = ?,
        city = ?,
        country = ?,
        newsletter_opt_in = ?
      WHERE id = ?
      `,
      [
        firstName,
        lastName,
        normalizedEmail || null,
        phone
          ? String(phone).trim()
          : null,
        city
          ? String(city).trim()
          : null,
        country
          ? String(country).trim()
          : 'Maroc',
        newsletterOptIn,
        userId,
      ],
    )

    const user =
      await getUserById(userId)

    return res.json({
      message:
        'Profil mis à jour avec succès.',
      user,
    })
  } catch (error) {
    next(error)
  }
}

const uploadMyAvatar = async (
  req,
  res,
  next,
) => {
  try {
    const userId = req.user.id

    if (!req.file) {
      return res.status(400).json({
        message:
          'Veuillez sélectionner une image.',
      })
    }

    const currentUser =
      await getUserById(userId)

    if (!currentUser) {
      deleteAvatarFile(
        `/uploads/avatars/${req.file.filename}`,
      )

      return res.status(404).json({
        message:
          'Utilisateur introuvable.',
      })
    }

    const avatarUrl =
      `/uploads/avatars/${req.file.filename}`

    await db.execute(
      `
      UPDATE users
      SET avatar_url = ?
      WHERE id = ?
      `,
      [
        avatarUrl,
        userId,
      ],
    )

    if (
      currentUser.avatar_url &&
      currentUser.avatar_url !== avatarUrl
    ) {
      deleteAvatarFile(
        currentUser.avatar_url,
      )
    }

    const user =
      await getUserById(userId)

    return res.json({
      message:
        'Photo de profil mise à jour avec succès.',
      user,
    })
  } catch (error) {
    if (req.file) {
      deleteAvatarFile(
        `/uploads/avatars/${req.file.filename}`,
      )
    }

    next(error)
  }
}

const deleteMyAvatar = async (
  req,
  res,
  next,
) => {
  try {
    const userId = req.user.id

    const currentUser =
      await getUserById(userId)

    if (!currentUser) {
      return res.status(404).json({
        message:
          'Utilisateur introuvable.',
      })
    }

    await db.execute(
      `
      UPDATE users
      SET avatar_url = NULL
      WHERE id = ?
      `,
      [userId],
    )

    if (currentUser.avatar_url) {
      deleteAvatarFile(
        currentUser.avatar_url,
      )
    }

    const user =
      await getUserById(userId)

    return res.json({
      message:
        'Photo de profil supprimée avec succès.',
      user,
    })
  } catch (error) {
    next(error)
  }
}

const getAdminCustomers = async (
  req,
  res,
  next,
) => {
  try {
    const [customers] = await db.execute(
      `
      SELECT
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.phone,
        u.city,
        u.country,
        u.avatar_url,
        u.newsletter_opt_in,
        u.role,
        u.is_active,
        u.created_at,
        u.updated_at,

        COALESCE(os.orders_count, 0) AS orders_count,
        COALESCE(os.total_spent, 0) AS total_spent,
        os.last_order_at,

        (
          SELECT a.city
          FROM addresses a
          WHERE a.user_id = u.id
          ORDER BY a.is_default DESC, a.id ASC
          LIMIT 1
        ) AS address_city,

        (
          SELECT a.country
          FROM addresses a
          WHERE a.user_id = u.id
          ORDER BY a.is_default DESC, a.id ASC
          LIMIT 1
        ) AS address_country,

        (
          SELECT a.phone
          FROM addresses a
          WHERE a.user_id = u.id
          ORDER BY a.is_default DESC, a.id ASC
          LIMIT 1
        ) AS address_phone

      FROM users u

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
          ) AS total_spent,
          MAX(created_at) AS last_order_at
        FROM orders
        GROUP BY user_id
      ) os
        ON os.user_id = u.id

      WHERE u.role = 'customer'

      ORDER BY u.created_at DESC, u.id DESC
      `,
    )

    res.json({
      customers,
    })
  } catch (error) {
    next(error)
  }
}

const getAdminCustomerById = async (
  req,
  res,
  next,
) => {
  try {
    const customerId =
      parseNumericId(req.params.id)

    if (!customerId) {
      return res.status(400).json({
        message:
          'Identifiant client invalide.',
      })
    }

    const customer =
      await getAdminCustomerByIdRow(
        customerId,
      )

    if (!customer) {
      return res.status(404).json({
        message:
          'Client introuvable.',
      })
    }

    const [
      recentOrders,
      addresses,
    ] = await Promise.all([
      getCustomerRecentOrders(
        customerId,
      ),
      getCustomerAddresses(
        customerId,
      ),
    ])

    res.json({
      customer: {
        ...customer,
        recent_orders:
          recentOrders,
        addresses,
      },
    })
  } catch (error) {
    next(error)
  }
}

const updateAdminCustomerStatus = async (
  req,
  res,
  next,
) => {
  try {
    const customerId =
      parseNumericId(req.params.id)

    if (!customerId) {
      return res.status(400).json({
        message:
          'Identifiant client invalide.',
      })
    }

    const status =
      String(
        req.body?.status || '',
      )
        .trim()
        .toLowerCase()

    if (
      ![
        'active',
        'inactive',
        'blocked',
      ].includes(status)
    ) {
      return res.status(400).json({
        message:
          'Statut client invalide.',
      })
    }

    const customer =
      await getAdminCustomerByIdRow(
        customerId,
      )

    if (!customer) {
      return res.status(404).json({
        message:
          'Client introuvable.',
      })
    }

    await db.execute(
      `
      UPDATE users
      SET is_active = ?
      WHERE id = ?
        AND role = 'customer'
      `,
      [
        status === 'active' ? 1 : 0,
        customerId,
      ],
    )

    const updatedCustomer =
      await getAdminCustomerByIdRow(
        customerId,
      )

    res.json({
      message:
        'Statut client mis a jour.',
      customer: updatedCustomer,
    })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getMyProfile,
  updateMyProfile,
  uploadMyAvatar,
  deleteMyAvatar,
  getAdminCustomers,
  getAdminCustomerById,
  updateAdminCustomerStatus,
}
