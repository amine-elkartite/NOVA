const db = require('../config/db')

const allowedTypes = [
  'percentage',
  'fixed',
  'free_shipping',
]

const allowedStatuses = [
  'active',
  'inactive',
  'expired',
  'scheduled',
]

function parsePromotionId(value) {
  const promotionId =
    Number(value)

  return Number.isInteger(promotionId) &&
    promotionId > 0
    ? promotionId
    : null
}

function nullableDate(value) {
  const text =
    String(value || '').trim()

  if (!text) {
    return null
  }

  const date =
    new Date(text)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return text.length === 10
    ? `${text} 00:00:00`
    : text
}

function normalizePromotionPayload(
  body,
  current = {},
) {
  const errors = []
  const name =
    String(
      body.name ??
        body.title ??
        current.name ??
        '',
    ).trim()

  const code =
    String(
      body.code ??
        current.code ??
        '',
    )
      .trim()
      .toUpperCase()

  const type =
    body.type ??
    body.discountType ??
    current.type

  const value =
    Number(
      body.value ??
        body.discountValue ??
        current.value ??
        0,
    )

  const minimumAmount =
    Number(
      body.minimumAmount ??
        body.minimum_amount ??
        body.minOrderAmount ??
        current.minimum_amount ??
        0,
    )

  const maxUsesRaw =
    body.maxUses ??
    body.max_uses ??
    current.max_uses ??
    null

  const maxUses =
    maxUsesRaw === null ||
    maxUsesRaw === ''
      ? null
      : Number(maxUsesRaw)

  const startDate =
    nullableDate(
      body.startDate ??
        body.start_date ??
        current.start_date,
    )

  const endDate =
    nullableDate(
      body.endDate ??
        body.end_date ??
        current.end_date,
    )

  const status =
    body.status ??
    current.status ??
    'active'

  if (!name) {
    errors.push(
      'Le nom de la promotion est requis.',
    )
  }

  if (!code) {
    errors.push(
      'Le code promotionnel est requis.',
    )
  }

  if (!allowedTypes.includes(type)) {
    errors.push(
      'Type de promotion invalide.',
    )
  }

  if (!allowedStatuses.includes(status)) {
    errors.push(
      'Statut de promotion invalide.',
    )
  }

  if (
    type !== 'free_shipping' &&
    (!Number.isFinite(value) || value <= 0)
  ) {
    errors.push(
      'La valeur de reduction doit etre superieure a 0.',
    )
  }

  if (
    type === 'percentage' &&
    value > 100
  ) {
    errors.push(
      'Le pourcentage doit etre compris entre 0 et 100.',
    )
  }

  if (
    !Number.isFinite(minimumAmount) ||
    minimumAmount < 0
  ) {
    errors.push(
      'Le montant minimum est invalide.',
    )
  }

  if (
    maxUses !== null &&
    (!Number.isInteger(maxUses) || maxUses < 0)
  ) {
    errors.push(
      'La limite d utilisation est invalide.',
    )
  }

  if (
    (body.startDate || body.start_date) &&
    !startDate
  ) {
    errors.push(
      'La date de debut est invalide.',
    )
  }

  if (
    (body.endDate || body.end_date) &&
    !endDate
  ) {
    errors.push(
      'La date de fin est invalide.',
    )
  }

  if (
    startDate &&
    endDate &&
    new Date(startDate) > new Date(endDate)
  ) {
    errors.push(
      'La date de debut doit etre avant la date de fin.',
    )
  }

  return {
    errors,
    promotion: {
      name,
      code,
      type,
      value:
        type === 'free_shipping'
          ? 0
          : value,
      minimumAmount,
      maxUses,
      startDate,
      endDate,
      status,
      productIds:
        Array.isArray(body.productIds)
          ? body.productIds
              .map(Number)
              .filter(
                (id) =>
                  Number.isInteger(id) &&
                  id > 0,
              )
          : undefined,
    },
  }
}

async function fetchPromotionById(
  connection,
  promotionId,
) {
  const [rows] =
    await connection.query(
      `
      SELECT
        p.id,
        p.name,
        p.code,
        p.type,
        p.value,
        p.minimum_amount,
        p.max_uses,
        p.used_count,
        p.start_date,
        p.end_date,
        p.status,
        p.created_at,
        p.updated_at,
        COUNT(pp.product_id) AS product_count
      FROM promotions p
      LEFT JOIN promotion_products pp
        ON pp.promotion_id = p.id
      WHERE p.id = ?
      GROUP BY
        p.id,
        p.name,
        p.code,
        p.type,
        p.value,
        p.minimum_amount,
        p.max_uses,
        p.used_count,
        p.start_date,
        p.end_date,
        p.status,
        p.created_at,
        p.updated_at
      LIMIT 1
      `,
      [promotionId],
    )

  const promotion =
    rows[0]

  if (!promotion) {
    return null
  }

  const [products] =
    await connection.query(
      `
      SELECT product_id
      FROM promotion_products
      WHERE promotion_id = ?
      ORDER BY product_id ASC
      `,
      [promotionId],
    )

  return {
    ...promotion,
    product_ids:
      products.map((row) => row.product_id),
  }
}

async function replacePromotionProducts(
  connection,
  promotionId,
  productIds,
) {
  if (productIds === undefined) {
    return
  }

  await connection.query(
    `
    DELETE FROM promotion_products
    WHERE promotion_id = ?
    `,
    [promotionId],
  )

  for (const productId of productIds) {
    const [rows] =
      await connection.query(
        `
        SELECT id
        FROM products
        WHERE id = ?
        LIMIT 1
        `,
        [productId],
      )

    if (rows.length === 0) {
      throw Object.assign(
        new Error(
          `Produit ${productId} introuvable.`,
        ),
        {
          statusCode: 400,
        },
      )
    }

    await connection.query(
      `
      INSERT INTO promotion_products (
        promotion_id,
        product_id
      )
      VALUES (?, ?)
      `,
      [
        promotionId,
        productId,
      ],
    )
  }
}

function handlePromotionDatabaseError(
  error,
  res,
) {
  if (error.code !== 'ER_DUP_ENTRY') {
    return false
  }

  res.status(409).json({
    message:
      'Ce code promotionnel existe deja.',
  })

  return true
}

async function getPromotions(
  req,
  res,
  next,
) {
  try {
    const [rows] =
      await db.query(
        `
        SELECT
          p.id,
          p.name,
          p.code,
          p.type,
          p.value,
          p.minimum_amount,
          p.max_uses,
          p.used_count,
          p.start_date,
          p.end_date,
          p.status,
          p.created_at,
          p.updated_at,
          COUNT(pp.product_id) AS product_count
        FROM promotions p
        LEFT JOIN promotion_products pp
          ON pp.promotion_id = p.id
        GROUP BY
          p.id,
          p.name,
          p.code,
          p.type,
          p.value,
          p.minimum_amount,
          p.max_uses,
          p.used_count,
          p.start_date,
          p.end_date,
          p.status,
          p.created_at,
          p.updated_at
        ORDER BY p.created_at DESC, p.id DESC
        `,
      )

    res.json({
      promotions: rows,
    })
  } catch (error) {
    next(error)
  }
}

async function getPromotionById(
  req,
  res,
  next,
) {
  try {
    const promotionId =
      parsePromotionId(req.params.id)

    if (!promotionId) {
      return res.status(400).json({
        message:
          'Identifiant de promotion invalide.',
      })
    }

    const promotion =
      await fetchPromotionById(
        db,
        promotionId,
      )

    if (!promotion) {
      return res.status(404).json({
        message:
          'Promotion introuvable.',
      })
    }

    res.json({
      promotion,
    })
  } catch (error) {
    next(error)
  }
}

async function createPromotion(
  req,
  res,
  next,
) {
  const connection =
    await db.getConnection()

  try {
    const {
      errors,
      promotion,
    } =
      normalizePromotionPayload(
        req.body || {},
      )

    if (errors.length > 0) {
      return res.status(400).json({
        message:
          'Promotion invalide.',
        errors,
      })
    }

    await connection.beginTransaction()

    const [result] =
      await connection.query(
        `
        INSERT INTO promotions (
          name,
          code,
          type,
          value,
          minimum_amount,
          max_uses,
          start_date,
          end_date,
          status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          promotion.name,
          promotion.code,
          promotion.type,
          promotion.value,
          promotion.minimumAmount,
          promotion.maxUses,
          promotion.startDate,
          promotion.endDate,
          promotion.status,
        ],
      )

    await replacePromotionProducts(
      connection,
      result.insertId,
      promotion.productIds,
    )

    const createdPromotion =
      await fetchPromotionById(
        connection,
        result.insertId,
      )

    await connection.commit()

    res.status(201).json({
      message:
        'Promotion creee avec succes.',
      promotion:
        createdPromotion,
    })
  } catch (error) {
    try {
      await connection.rollback()
    } catch {
      // Transaction already closed.
    }

    if (
      handlePromotionDatabaseError(
        error,
        res,
      )
    ) {
      return
    }

    next(error)
  } finally {
    connection.release()
  }
}

async function updatePromotion(
  req,
  res,
  next,
) {
  const connection =
    await db.getConnection()

  try {
    const promotionId =
      parsePromotionId(req.params.id)

    if (!promotionId) {
      return res.status(400).json({
        message:
          'Identifiant de promotion invalide.',
      })
    }

    await connection.beginTransaction()

    const currentPromotion =
      await fetchPromotionById(
        connection,
        promotionId,
      )

    if (!currentPromotion) {
      await connection.rollback()

      return res.status(404).json({
        message:
          'Promotion introuvable.',
      })
    }

    const {
      errors,
      promotion,
    } =
      normalizePromotionPayload(
        req.body || {},
        currentPromotion,
      )

    if (errors.length > 0) {
      await connection.rollback()

      return res.status(400).json({
        message:
          'Promotion invalide.',
        errors,
      })
    }

    await connection.query(
      `
      UPDATE promotions
      SET
        name = ?,
        code = ?,
        type = ?,
        value = ?,
        minimum_amount = ?,
        max_uses = ?,
        start_date = ?,
        end_date = ?,
        status = ?
      WHERE id = ?
      `,
      [
        promotion.name,
        promotion.code,
        promotion.type,
        promotion.value,
        promotion.minimumAmount,
        promotion.maxUses,
        promotion.startDate,
        promotion.endDate,
        promotion.status,
        promotionId,
      ],
    )

    await replacePromotionProducts(
      connection,
      promotionId,
      promotion.productIds,
    )

    const updatedPromotion =
      await fetchPromotionById(
        connection,
        promotionId,
      )

    await connection.commit()

    res.json({
      message:
        'Promotion mise a jour.',
      promotion:
        updatedPromotion,
    })
  } catch (error) {
    try {
      await connection.rollback()
    } catch {
      // Transaction already closed.
    }

    if (
      handlePromotionDatabaseError(
        error,
        res,
      )
    ) {
      return
    }

    next(error)
  } finally {
    connection.release()
  }
}

async function deletePromotion(
  req,
  res,
  next,
) {
  try {
    const promotionId =
      parsePromotionId(req.params.id)

    if (!promotionId) {
      return res.status(400).json({
        message:
          'Identifiant de promotion invalide.',
      })
    }

    const promotion =
      await fetchPromotionById(
        db,
        promotionId,
      )

    if (!promotion) {
      return res.status(404).json({
        message:
          'Promotion introuvable.',
      })
    }

    if (Number(promotion.used_count || 0) > 0) {
      await db.query(
        `
        UPDATE promotions
        SET status = 'inactive'
        WHERE id = ?
        `,
        [promotionId],
      )

      return res.json({
        message:
          'Promotion deja utilisee : elle a ete desactivee.',
        promotion:
          await fetchPromotionById(
            db,
            promotionId,
          ),
        deactivated:
          true,
      })
    }

    await db.query(
      `
      DELETE FROM promotions
      WHERE id = ?
      `,
      [promotionId],
    )

    res.json({
      message:
        'Promotion supprimee.',
    })
  } catch (error) {
    next(error)
  }
}

async function validatePromotion(req, res, next) {
  try {
    const {
      code,
      subtotal,
      productIds = [],
    } = req.body

    if (!code) {
      return res.status(400).json({
        message: 'Le code promotionnel est obligatoire.',
      })
    }

    const subtotalValue = Number(subtotal)

    if (!Number.isFinite(subtotalValue) || subtotalValue < 0) {
      return res.status(400).json({
        message: 'Montant du panier invalide.',
      })
    }

    const normalizedCode = String(code)
      .trim()
      .toUpperCase()

    const [rows] = await db.query(
      `
        SELECT *
        FROM promotions
        WHERE UPPER(code) = ?
        LIMIT 1
      `,
      [normalizedCode],
    )

    if (rows.length === 0) {
      return res.status(404).json({
        message: 'Code promotionnel invalide.',
      })
    }

    const promotion = rows[0]
    const now = new Date()

    if (promotion.status !== 'active') {
      return res.status(400).json({
        message: 'Cette promotion n est pas active.',
      })
    }

    if (
      promotion.start_date &&
      new Date(promotion.start_date) > now
    ) {
      return res.status(400).json({
        message: 'Cette promotion n a pas encore commence.',
      })
    }

    if (
      promotion.end_date &&
      new Date(promotion.end_date) < now
    ) {
      return res.status(400).json({
        message: 'Cette promotion a expire.',
      })
    }

    if (
      promotion.max_uses !== null &&
      Number(promotion.used_count) >=
        Number(promotion.max_uses)
    ) {
      return res.status(400).json({
        message:
          'Cette promotion a atteint sa limite d utilisation.',
      })
    }

    if (
      subtotalValue <
      Number(promotion.minimum_amount || 0)
    ) {
      return res.status(400).json({
        message: `Montant minimum requis : ${Number(
          promotion.minimum_amount,
        ).toLocaleString('fr-FR')} DH.`,
      })
    }

    const [linkedProducts] = await db.query(
      `
        SELECT product_id
        FROM promotion_products
        WHERE promotion_id = ?
      `,
      [promotion.id],
    )

    if (linkedProducts.length > 0) {
      const allowedProductIds = linkedProducts.map(
        (item) => Number(item.product_id),
      )

      const normalizedProductIds = Array.isArray(productIds)
        ? productIds.map(Number)
        : []

      const hasEligibleProduct =
        normalizedProductIds.some((id) =>
          allowedProductIds.includes(id),
        )

      if (!hasEligibleProduct) {
        return res.status(400).json({
          message:
            'Ce code ne s applique pas aux produits de votre panier.',
        })
      }
    }

    let discountAmount = 0
    let freeShipping = false

    if (promotion.type === 'percentage') {
      discountAmount =
        subtotalValue *
        (Number(promotion.value) / 100)
    }

    if (promotion.type === 'fixed') {
      discountAmount = Math.min(
        subtotalValue,
        Number(promotion.value),
      )
    }

    if (promotion.type === 'free_shipping') {
      freeShipping = true
    }

    res.json({
      valid: true,
      promotion: {
        id: promotion.id,
        name: promotion.name,
        code: promotion.code,
        type: promotion.type,
        value: Number(promotion.value),
      },
      discountAmount: Number(
        discountAmount.toFixed(2),
      ),
      freeShipping,
    })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getPromotions,
  getPromotionById,
  createPromotion,
  updatePromotion,
  deletePromotion,
  validatePromotion,
}
