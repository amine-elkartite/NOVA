const pool = require('../config/db')

async function getFavorites(req, res, next) {
  try {
    const userId = req.user.id

    const [rows] = await pool.query(
      `
      SELECT
        f.id AS favorite_id,
        f.created_at AS favorite_created_at,

        p.id,
        p.category_id,
        p.name,
        p.slug,
        p.sku,
        p.short_description,
        p.description,
        p.price,
        p.old_price,
        p.stock,
        p.gender,
        p.brand,
        p.status,
        p.featured,
        p.created_at,
        p.updated_at,

        c.name AS category_name,
        c.slug AS category_slug,

        (
          SELECT pi.image_url
          FROM product_images pi
          WHERE pi.product_id = p.id
          ORDER BY
            pi.is_primary DESC,
            pi.sort_order ASC,
            pi.id ASC
          LIMIT 1
        ) AS image_url,

        (
          SELECT pi.alt_text
          FROM product_images pi
          WHERE pi.product_id = p.id
          ORDER BY
            pi.is_primary DESC,
            pi.sort_order ASC,
            pi.id ASC
          LIMIT 1
        ) AS image_alt

      FROM favorites f

      INNER JOIN products p
        ON p.id = f.product_id

      LEFT JOIN categories c
        ON c.id = p.category_id

      WHERE
        f.user_id = ?
        AND p.status = 'active'

      ORDER BY f.created_at DESC
      `,
      [userId],
    )

    res.json({
      favorites: rows,
    })
  } catch (error) {
    next(error)
  }
}

async function addFavorite(req, res, next) {
  try {
    const userId = req.user.id
    const productId = Number(req.params.productId)

    if (
      !Number.isInteger(productId) ||
      productId <= 0
    ) {
      res.status(400).json({
        message: 'Produit invalide.',
      })

      return
    }

    const [products] = await pool.query(
      `
      SELECT
        p.id,
        p.category_id,
        p.name,
        p.slug,
        p.sku,
        p.short_description,
        p.description,
        p.price,
        p.old_price,
        p.stock,
        p.gender,
        p.brand,
        p.status,
        p.featured,
        p.created_at,
        p.updated_at,

        c.name AS category_name,
        c.slug AS category_slug,

        (
          SELECT pi.image_url
          FROM product_images pi
          WHERE pi.product_id = p.id
          ORDER BY
            pi.is_primary DESC,
            pi.sort_order ASC,
            pi.id ASC
          LIMIT 1
        ) AS image_url,

        (
          SELECT pi.alt_text
          FROM product_images pi
          WHERE pi.product_id = p.id
          ORDER BY
            pi.is_primary DESC,
            pi.sort_order ASC,
            pi.id ASC
          LIMIT 1
        ) AS image_alt

      FROM products p

      LEFT JOIN categories c
        ON c.id = p.category_id

      WHERE
        p.id = ?
        AND p.status = 'active'

      LIMIT 1
      `,
      [productId],
    )

    if (products.length === 0) {
      res.status(404).json({
        message: 'Produit introuvable.',
      })

      return
    }

    await pool.query(
      `
      INSERT INTO favorites (
        user_id,
        product_id
      )
      VALUES (?, ?)

      ON DUPLICATE KEY UPDATE
        product_id = VALUES(product_id)
      `,
      [userId, productId],
    )

    res.status(201).json({
      message:
        'Produit ajouté aux favoris.',

      product: products[0],
    })
  } catch (error) {
    next(error)
  }
}

async function removeFavorite(
  req,
  res,
  next,
) {
  try {
    const userId = req.user.id
    const productId = Number(
      req.params.productId,
    )

    if (
      !Number.isInteger(productId) ||
      productId <= 0
    ) {
      res.status(400).json({
        message: 'Produit invalide.',
      })

      return
    }

    const [result] = await pool.query(
      `
      DELETE FROM favorites

      WHERE
        user_id = ?
        AND product_id = ?
      `,
      [userId, productId],
    )

    if (result.affectedRows === 0) {
      res.status(404).json({
        message:
          'Ce produit n’est pas dans vos favoris.',
      })

      return
    }

    res.json({
      message:
        'Produit retiré des favoris.',
    })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getFavorites,
  addFavorite,
  removeFavorite,
}