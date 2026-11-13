const pool = require('../config/db')

/* =========================================================
   HELPERS
========================================================= */

async function getOrCreateCart(connection, userId) {
  const [existingCarts] = await connection.query(
    `
      SELECT id, user_id, session_id, created_at, updated_at
      FROM carts
      WHERE user_id = ?
      ORDER BY id ASC
      LIMIT 1
    `,
    [userId],
  )

  if (existingCarts.length > 0) {
    return existingCarts[0]
  }

  const [result] = await connection.query(
    `
      INSERT INTO carts (user_id)
      VALUES (?)
    `,
    [userId],
  )

  const [newCarts] = await connection.query(
    `
      SELECT id, user_id, session_id, created_at, updated_at
      FROM carts
      WHERE id = ?
      LIMIT 1
    `,
    [result.insertId],
  )

  return newCarts[0]
}

async function getCartItems(connection, cartId) {
  const [items] = await connection.query(
    `
      SELECT
        ci.id,
        ci.cart_id,
        ci.product_id,
        ci.variant_id,
        ci.quantity,
        ci.price,

        p.name,
        p.slug,
        p.sku,
        p.short_description,
        p.description,
        p.price AS product_price,
        p.old_price,
        p.stock AS product_stock,
        p.gender,
        p.brand,
        p.status,
        p.featured,

        c.id AS category_id,
        c.name AS category_name,
        c.slug AS category_slug,

        pv.size,
        pv.color,
        pv.sku AS variant_sku,
        pv.stock AS variant_stock,
        pv.additional_price,

        (
          SELECT pi.image_url
          FROM product_images pi
          WHERE pi.product_id = p.id
          ORDER BY
            pi.is_primary DESC,
            pi.sort_order ASC,
            pi.id ASC
          LIMIT 1
        ) AS image_url

      FROM cart_items ci

      INNER JOIN products p
        ON p.id = ci.product_id

      LEFT JOIN categories c
        ON c.id = p.category_id

      LEFT JOIN product_variants pv
        ON pv.id = ci.variant_id

      WHERE ci.cart_id = ?

      ORDER BY ci.id DESC
    `,
    [cartId],
  )

  return items
}

function calculateCart(items) {
  const subtotal = items.reduce(
    (total, item) => {
      return (
        total +
        Number(item.price || 0) *
          Number(item.quantity || 0)
      )
    },
    0,
  )

  const itemCount = items.reduce(
    (total, item) => {
      return (
        total +
        Number(item.quantity || 0)
      )
    },
    0,
  )

  return {
    subtotal: Number(
      subtotal.toFixed(2),
    ),
    itemCount,
  }
}

/* =========================================================
   GET /api/cart
========================================================= */

async function getCart(req, res, next) {
  let connection

  try {
    const userId = Number(
      req.user.id,
    )

    connection =
      await pool.getConnection()

    const cart =
      await getOrCreateCart(
        connection,
        userId,
      )

    const items =
      await getCartItems(
        connection,
        cart.id,
      )

    const totals =
      calculateCart(items)

    return res.status(200).json({
      cart: {
        ...cart,
        items,
        ...totals,
      },
    })
  } catch (error) {
    return next(error)
  } finally {
    if (connection) {
      connection.release()
    }
  }
}

/* =========================================================
   POST /api/cart/items
========================================================= */

async function addCartItem(
  req,
  res,
  next,
) {
  let connection

  try {
    const userId = Number(
      req.user.id,
    )

    const productId = Number(
      req.body.productId,
    )

    const variantId =
      req.body.variantId === null ||
      req.body.variantId === undefined ||
      req.body.variantId === ''
        ? null
        : Number(
            req.body.variantId,
          )

    const quantity =
      req.body.quantity ===
      undefined
        ? 1
        : Number(
            req.body.quantity,
          )

    if (
      !Number.isInteger(
        productId,
      ) ||
      productId <= 0
    ) {
      return res.status(400).json({
        message:
          'Produit invalide.',
      })
    }

    if (
      !Number.isInteger(
        quantity,
      ) ||
      quantity <= 0
    ) {
      return res.status(400).json({
        message:
          'La quantité doit être supérieure à 0.',
      })
    }

    if (
      variantId !== null &&
      (!Number.isInteger(
        variantId,
      ) ||
        variantId <= 0)
    ) {
      return res.status(400).json({
        message:
          'Variante invalide.',
      })
    }

    connection =
      await pool.getConnection()

    await connection.beginTransaction()

    const [products] =
      await connection.query(
        `
          SELECT
            id,
            name,
            slug,
            price,
            stock,
            status,
            category_id,
            (
              SELECT status
              FROM categories
              WHERE categories.id = products.category_id
              LIMIT 1
            ) AS category_status,
            (
              SELECT COUNT(*)
              FROM product_variants
              WHERE product_variants.product_id = products.id
            ) AS variant_count
          FROM products
          WHERE id = ?
          LIMIT 1
          FOR UPDATE
        `,
        [productId],
      )

    if (products.length === 0) {
      await connection.rollback()

      return res.status(404).json({
        message:
          'Produit introuvable.',
      })
    }

    const product =
      products[0]

    if (
      product.status !==
        'active' ||
      (
        product.category_id !== null &&
        product.category_status !== 'active'
      )
    ) {
      await connection.rollback()

      return res.status(400).json({
        message:
          'Ce produit n’est pas disponible.',
      })
    }

    if (
      variantId === null &&
      Number(product.variant_count || 0) > 0
    ) {
      await connection.rollback()

      return res.status(400).json({
        message:
          'Veuillez selectionner une variante de produit.',
      })
    }

    let variant = null

    let availableStock =
      Number(
        product.stock,
      )

    let unitPrice =
      Number(
        product.price,
      )

    if (variantId !== null) {
      const [variants] =
        await connection.query(
          `
            SELECT
              id,
              product_id,
              size,
              color,
              sku,
              stock,
              additional_price
            FROM product_variants
            WHERE id = ?
              AND product_id = ?
            LIMIT 1
            FOR UPDATE
          `,
          [
            variantId,
            productId,
          ],
        )

      if (
        variants.length ===
        0
      ) {
        await connection.rollback()

        return res.status(404).json({
          message:
            'Variante de produit introuvable.',
        })
      }

      variant =
        variants[0]

      availableStock =
        Number(
          variant.stock,
        )

      unitPrice =
        Number(
          product.price,
        ) +
        Number(
          variant.additional_price ||
            0,
        )
    }

    if (
      availableStock <= 0
    ) {
      await connection.rollback()

      return res.status(400).json({
        message:
          'Produit en rupture de stock.',
      })
    }

    const cart =
      await getOrCreateCart(
        connection,
        userId,
      )

    let existingItems

    if (variantId === null) {
      ;[existingItems] =
        await connection.query(
          `
            SELECT
              id,
              quantity
            FROM cart_items
            WHERE cart_id = ?
              AND product_id = ?
              AND variant_id IS NULL
            LIMIT 1
            FOR UPDATE
          `,
          [
            cart.id,
            productId,
          ],
        )
    } else {
      ;[existingItems] =
        await connection.query(
          `
            SELECT
              id,
              quantity
            FROM cart_items
            WHERE cart_id = ?
              AND product_id = ?
              AND variant_id = ?
            LIMIT 1
            FOR UPDATE
          `,
          [
            cart.id,
            productId,
            variantId,
          ],
        )
    }

    if (
      existingItems.length >
      0
    ) {
      const existingItem =
        existingItems[0]

      const newQuantity =
        Number(
          existingItem.quantity,
        ) + quantity

      if (
        newQuantity >
        availableStock
      ) {
        await connection.rollback()

        return res.status(400).json({
          message: `Stock insuffisant. Quantité disponible : ${availableStock}.`,
        })
      }

      await connection.query(
        `
          UPDATE cart_items
          SET
            quantity = ?,
            price = ?
          WHERE id = ?
        `,
        [
          newQuantity,
          unitPrice,
          existingItem.id,
        ],
      )
    } else {
      if (
        quantity >
        availableStock
      ) {
        await connection.rollback()

        return res.status(400).json({
          message: `Stock insuffisant. Quantité disponible : ${availableStock}.`,
        })
      }

      await connection.query(
        `
          INSERT INTO cart_items (
            cart_id,
            product_id,
            variant_id,
            quantity,
            price
          )
          VALUES (?, ?, ?, ?, ?)
        `,
        [
          cart.id,
          productId,
          variantId,
          quantity,
          unitPrice,
        ],
      )
    }

    await connection.query(
      `
        UPDATE carts
        SET updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      [cart.id],
    )

    const items =
      await getCartItems(
        connection,
        cart.id,
      )

    const totals =
      calculateCart(items)

    await connection.commit()

    return res.status(201).json({
      message:
        'Produit ajouté au panier.',
      cart: {
        ...cart,
        items,
        ...totals,
      },
    })
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback()
      } catch {
        // Ignore rollback error.
      }
    }

    return next(error)
  } finally {
    if (connection) {
      connection.release()
    }
  }
}

/* =========================================================
   PUT /api/cart/items/:id
========================================================= */

async function updateCartItem(
  req,
  res,
  next,
) {
  let connection

  try {
    const userId = Number(
      req.user.id,
    )

    const itemId = Number(
      req.params.id,
    )

    const quantity = Number(
      req.body.quantity,
    )

    if (
      !Number.isInteger(
        itemId,
      ) ||
      itemId <= 0
    ) {
      return res.status(400).json({
        message:
          'Identifiant du produit invalide.',
      })
    }

    if (
      !Number.isInteger(
        quantity,
      ) ||
      quantity <= 0
    ) {
      return res.status(400).json({
        message:
          'La quantité doit être supérieure à 0.',
      })
    }

    connection =
      await pool.getConnection()

    await connection.beginTransaction()

    const [items] =
      await connection.query(
        `
          SELECT
            ci.id,
            ci.cart_id,
            ci.product_id,
            ci.variant_id,
            ci.quantity,

            p.stock AS product_stock,
            p.status AS product_status,

            pv.stock AS variant_stock

          FROM cart_items ci

          INNER JOIN carts c
            ON c.id = ci.cart_id

          INNER JOIN products p
            ON p.id = ci.product_id

          LEFT JOIN product_variants pv
            ON pv.id = ci.variant_id

          WHERE ci.id = ?
            AND c.user_id = ?

          LIMIT 1
          FOR UPDATE
        `,
        [
          itemId,
          userId,
        ],
      )

    if (
      items.length === 0
    ) {
      await connection.rollback()

      return res.status(404).json({
        message:
          'Produit du panier introuvable.',
      })
    }

    const item =
      items[0]

    if (
      item.product_status !==
      'active'
    ) {
      await connection.rollback()

      return res.status(400).json({
        message:
          'Ce produit n’est plus disponible.',
      })
    }

    const availableStock =
      item.variant_id !== null
        ? Number(
            item.variant_stock,
          )
        : Number(
            item.product_stock,
          )

    if (
      quantity >
      availableStock
    ) {
      await connection.rollback()

      return res.status(400).json({
        message: `Stock insuffisant. Quantité disponible : ${availableStock}.`,
      })
    }

    await connection.query(
      `
        UPDATE cart_items
        SET quantity = ?
        WHERE id = ?
      `,
      [
        quantity,
        itemId,
      ],
    )

    await connection.query(
      `
        UPDATE carts
        SET updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      [item.cart_id],
    )

    const cartItems =
      await getCartItems(
        connection,
        item.cart_id,
      )

    const totals =
      calculateCart(
        cartItems,
      )

    await connection.commit()

    return res.status(200).json({
      message:
        'Panier mis à jour.',
      cart: {
        id: item.cart_id,
        items: cartItems,
        ...totals,
      },
    })
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback()
      } catch {
        // Ignore rollback error.
      }
    }

    return next(error)
  } finally {
    if (connection) {
      connection.release()
    }
  }
}

/* =========================================================
   DELETE /api/cart/items/:id
========================================================= */

async function removeCartItem(
  req,
  res,
  next,
) {
  let connection

  try {
    const userId = Number(
      req.user.id,
    )

    const itemId = Number(
      req.params.id,
    )

    if (
      !Number.isInteger(
        itemId,
      ) ||
      itemId <= 0
    ) {
      return res.status(400).json({
        message:
          'Identifiant du produit invalide.',
      })
    }

    connection =
      await pool.getConnection()

    await connection.beginTransaction()

    const [items] =
      await connection.query(
        `
          SELECT
            ci.id,
            ci.cart_id
          FROM cart_items ci

          INNER JOIN carts c
            ON c.id = ci.cart_id

          WHERE ci.id = ?
            AND c.user_id = ?

          LIMIT 1
          FOR UPDATE
        `,
        [
          itemId,
          userId,
        ],
      )

    if (
      items.length === 0
    ) {
      await connection.rollback()

      return res.status(404).json({
        message:
          'Produit du panier introuvable.',
      })
    }

    const item =
      items[0]

    await connection.query(
      `
        DELETE FROM cart_items
        WHERE id = ?
      `,
      [itemId],
    )

    await connection.query(
      `
        UPDATE carts
        SET updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      [item.cart_id],
    )

    const cartItems =
      await getCartItems(
        connection,
        item.cart_id,
      )

    const totals =
      calculateCart(
        cartItems,
      )

    await connection.commit()

    return res.status(200).json({
      message:
        'Produit retiré du panier.',
      cart: {
        id: item.cart_id,
        items: cartItems,
        ...totals,
      },
    })
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback()
      } catch {
        // Ignore rollback error.
      }
    }

    return next(error)
  } finally {
    if (connection) {
      connection.release()
    }
  }
}

/* =========================================================
   DELETE /api/cart
========================================================= */

async function clearCart(
  req,
  res,
  next,
) {
  let connection

  try {
    const userId = Number(
      req.user.id,
    )

    connection =
      await pool.getConnection()

    await connection.beginTransaction()

    const [carts] =
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

    if (
      carts.length === 0
    ) {
      await connection.commit()

      return res.status(200).json({
        message:
          'Le panier est déjà vide.',
        cart: {
          items: [],
          itemCount: 0,
          subtotal: 0,
        },
      })
    }

    const cartId =
      carts[0].id

    await connection.query(
      `
        DELETE FROM cart_items
        WHERE cart_id = ?
      `,
      [cartId],
    )

    await connection.query(
      `
        UPDATE carts
        SET updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      [cartId],
    )

    await connection.commit()

    return res.status(200).json({
      message:
        'Panier vidé.',
      cart: {
        id: cartId,
        items: [],
        itemCount: 0,
        subtotal: 0,
      },
    })
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback()
      } catch {
        // Ignore rollback error.
      }
    }

    return next(error)
  } finally {
    if (connection) {
      connection.release()
    }
  }
}

module.exports = {
  getCart,
  addCartItem,
  updateCartItem,
  removeCartItem,
  clearCart,
}
