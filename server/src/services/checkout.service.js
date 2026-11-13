const VALID_DELIVERY_METHODS = [
  'standard',
  'express',
]

function createCheckoutError(
  message,
  statusCode = 400,
) {
  return Object.assign(
    new Error(message),
    {
      statusCode,
    },
  )
}

function getShippingCost(
  deliveryMethod,
  subtotal,
  shippingSettings,
  promotionFreeShipping = false,
) {
  if (promotionFreeShipping) {
    return 0
  }

  const freeStandardShipping =
    deliveryMethod === 'standard' &&
    shippingSettings.freeFrom > 0 &&
    Number(subtotal) >= shippingSettings.freeFrom

  if (freeStandardShipping) {
    return 0
  }

  return deliveryMethod === 'express'
    ? shippingSettings.express
    : shippingSettings.standard
}

function validateDeliveryMethod(
  deliveryMethod = 'standard',
) {
  if (
    !VALID_DELIVERY_METHODS.includes(
      deliveryMethod,
    )
  ) {
    throw createCheckoutError(
      'Mode de livraison invalide.',
    )
  }

  return deliveryMethod
}

function validateShippingAddress(
  shippingAddress,
) {
  if (
    !shippingAddress ||
    typeof shippingAddress !== 'object'
  ) {
    throw createCheckoutError(
      'Adresse de livraison requise.',
    )
  }

  const requiredAddressFields = [
    'full_name',
    'address_line1',
    'city',
    'country',
    'phone',
  ]

  const missingField =
    requiredAddressFields.find(
      (field) =>
        !String(
          shippingAddress[field] || '',
        ).trim(),
    )

  if (missingField) {
    throw createCheckoutError(
      'Veuillez compléter toutes les informations de livraison.',
    )
  }

  return shippingAddress
}

async function calculatePromotion({
  connection,
  code,
  subtotal,
  cartItems,
  deliveryMethod,
  shippingSettings,
}) {
  if (!code) {
    return {
      promotion: null,
      discount: 0,
      freeShipping: false,
      shippingCost:
        getShippingCost(
          deliveryMethod,
          subtotal,
          shippingSettings,
        ),
    }
  }

  const normalizedCode = String(code)
    .trim()
    .toUpperCase()

  if (!normalizedCode) {
    return {
      promotion: null,
      discount: 0,
      freeShipping: false,
      shippingCost:
        getShippingCost(
          deliveryMethod,
          subtotal,
          shippingSettings,
        ),
    }
  }

  const [promotionRows] =
    await connection.query(
      `
      SELECT
        id,
        name,
        code,
        type,
        value,
        minimum_amount,
        max_uses,
        used_count,
        start_date,
        end_date,
        status
      FROM promotions
      WHERE UPPER(code) = ?
      LIMIT 1
      FOR UPDATE
      `,
      [normalizedCode],
    )

  if (promotionRows.length === 0) {
    throw createCheckoutError(
      'Code promotionnel invalide.',
    )
  }

  const promotion =
    promotionRows[0]

  if (
    promotion.status !== 'active'
  ) {
    throw createCheckoutError(
      'Cette promotion n’est pas active.',
    )
  }

  const now = new Date()

  if (
    promotion.start_date &&
    new Date(
      promotion.start_date,
    ) > now
  ) {
    throw createCheckoutError(
      'Cette promotion n’est pas encore disponible.',
    )
  }

  if (
    promotion.end_date &&
    new Date(
      promotion.end_date,
    ) < now
  ) {
    throw createCheckoutError(
      'Cette promotion a expiré.',
    )
  }

  if (
    promotion.max_uses !== null &&
    Number(
      promotion.used_count || 0,
    ) >=
      Number(
        promotion.max_uses,
      )
  ) {
    throw createCheckoutError(
      'Cette promotion a atteint sa limite d’utilisation.',
    )
  }

  const minimumAmount = Number(
    promotion.minimum_amount || 0,
  )

  if (
    Number(subtotal) <
    minimumAmount
  ) {
    throw createCheckoutError(
      `Montant minimum requis : ${minimumAmount.toLocaleString(
        'fr-FR',
      )} DH.`,
    )
  }

  const [promotionProducts] =
    await connection.query(
      `
      SELECT product_id
      FROM promotion_products
      WHERE promotion_id = ?
      `,
      [promotion.id],
    )

  const restrictedProductIds =
    promotionProducts.map(
      (row) =>
        Number(
          row.product_id,
        ),
    )

  let eligibleSubtotal = 0

  if (
    restrictedProductIds.length === 0
  ) {
    eligibleSubtotal =
      Number(subtotal)
  } else {
    for (const item of cartItems) {
      if (
        !restrictedProductIds.includes(
          Number(
            item.product_id,
          ),
        )
      ) {
        continue
      }

      const unitPrice =
        Number(
          item.product_price || 0,
        ) +
        Number(
          item.additional_price || 0,
        )

      eligibleSubtotal +=
        unitPrice *
        Number(
          item.quantity || 0,
        )
    }

    if (eligibleSubtotal <= 0) {
      throw createCheckoutError(
        'Cette promotion ne s’applique à aucun produit de votre panier.',
      )
    }
  }

  let discount = 0
  let freeShipping = false

  if (
    promotion.type ===
    'percentage'
  ) {
    const percentage = Number(
      promotion.value || 0,
    )

    discount =
      eligibleSubtotal *
      (percentage / 100)
  } else if (
    promotion.type === 'fixed'
  ) {
    discount = Math.min(
      Number(
        promotion.value || 0,
      ),
      eligibleSubtotal,
    )
  } else if (
    promotion.type ===
    'free_shipping'
  ) {
    freeShipping = true
  } else {
    throw createCheckoutError(
      'Type de promotion invalide.',
    )
  }

  discount =
    Math.round(
      discount * 100,
    ) / 100

  const shippingCost = getShippingCost(
    deliveryMethod,
    subtotal,
    shippingSettings,
    freeShipping,
  )

  return {
    promotion,
    discount,
    freeShipping,
    shippingCost,
  }
}

async function calculateCheckoutPricing({
  connection,
  userId,
  deliveryMethod,
  promotionCode = null,
}) {
  const [cartRows] =
    await connection.query(
      `
      SELECT id
      FROM carts
      WHERE user_id = ?
      LIMIT 1
      FOR UPDATE
      `,
      [userId],
    )

  if (cartRows.length === 0) {
    throw createCheckoutError(
      'Votre panier est vide.',
    )
  }

  const cartId =
    cartRows[0].id

  const [cartItems] =
    await connection.query(
      `
      SELECT
        ci.id,
        ci.product_id,
        ci.variant_id,
        ci.quantity,

        p.name AS product_name,
        p.sku AS product_sku,
        p.price AS product_price,
        p.status AS product_status,
        p.stock AS product_stock,
        p.category_id,
        c.status AS category_status,
        (
          SELECT COUNT(*)
          FROM product_variants
          WHERE product_variants.product_id = p.id
        ) AS variant_count,

        pv.size,
        pv.color,
        pv.stock AS variant_stock,
        pv.additional_price

      FROM cart_items ci

      INNER JOIN products p
        ON p.id = ci.product_id

      LEFT JOIN categories c
        ON c.id = p.category_id

      LEFT JOIN product_variants pv
        ON pv.id = ci.variant_id

      WHERE ci.cart_id = ?

      FOR UPDATE
      `,
      [cartId],
    )

  if (cartItems.length === 0) {
    throw createCheckoutError(
      'Votre panier est vide.',
    )
  }

  let subtotal = 0

  for (const item of cartItems) {
    if (
      item.product_status !==
        'active' ||
      (
        item.category_id !== null &&
        item.category_status !== 'active'
      )
    ) {
      throw createCheckoutError(
        `${item.product_name} n'est plus disponible.`,
      )
    }

    if (
      item.variant_id !== null &&
      item.variant_stock === null
    ) {
      throw createCheckoutError(
        `La variante de ${item.product_name} n’est plus disponible.`,
      )
    }

    if (
      item.variant_id === null &&
      Number(item.variant_count || 0) > 0
    ) {
      throw createCheckoutError(
        `Veuillez selectionner une variante pour ${item.product_name}.`,
      )
    }

    const availableStock =
      item.variant_id !== null
        ? Number(
            item.variant_stock || 0,
          )
        : Number(
            item.product_stock || 0,
          )

    if (
      Number(
        item.quantity,
      ) >
      availableStock
    ) {
      throw createCheckoutError(
        `Stock insuffisant pour ${item.product_name}.`,
      )
    }

    const unitPrice =
      Number(
        item.product_price || 0,
      ) +
      Number(
        item.additional_price || 0,
      )

    subtotal +=
      unitPrice *
      Number(
        item.quantity,
      )
  }

  subtotal =
    Math.round(
      subtotal * 100,
    ) / 100

  const shippingSettings =
    await getShippingSettings(
      connection,
    )

  const promotionResult =
    await calculatePromotion({
      connection,
      code: promotionCode,
      subtotal,
      cartItems,
      deliveryMethod,
      shippingSettings,
    })

  const discount =
    promotionResult.discount

  const shippingCost =
    promotionResult.shippingCost

  const total =
    Math.max(
      0,
      Math.round(
        (
          subtotal +
          shippingCost -
          discount
        ) * 100,
      ) / 100,
    )

  return {
    cartId,
    cartItems,
    subtotal,
    discount,
    shippingCost,
    total,
    promotion:
      promotionResult.promotion,
    promotionResult,
  }
}

module.exports = {
  calculateCheckoutPricing,
  calculatePromotion,
  validateDeliveryMethod,
  validateShippingAddress,
}
const {
  getShippingSettings,
} = require('./settings.service')
