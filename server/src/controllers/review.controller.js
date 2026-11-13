const pool = require('../config/db')

async function getProductReviews(req, res, next) {
  try {
    const productId = Number(req.params.productId)

    if (!Number.isInteger(productId) || productId <= 0) {
      return res.status(400).json({
        message: 'Produit invalide.',
      })
    }

    const [reviews] = await pool.query(
      `
        SELECT
          r.id,
          r.user_id,
          r.product_id,
          r.rating,
          r.comment,
          r.status,
          r.created_at,
          u.first_name,
          u.last_name
        FROM reviews r
        INNER JOIN users u
          ON u.id = r.user_id
        WHERE
          r.product_id = ?
          AND r.status = 'approved'
        ORDER BY r.created_at DESC
      `,
      [productId],
    )

    const [statsRows] = await pool.query(
      `
        SELECT
          COUNT(*) AS total_reviews,
          COALESCE(AVG(rating), 0) AS average_rating
        FROM reviews
        WHERE
          product_id = ?
          AND status = 'approved'
      `,
      [productId],
    )

    const stats = statsRows[0]

    return res.json({
      reviews,
      stats: {
        totalReviews: Number(stats.total_reviews),
        averageRating: Number(
          Number(stats.average_rating).toFixed(1),
        ),
      },
    })
  } catch (error) {
    next(error)
  }
}

async function createReview(req, res, next) {
  try {
    const userId = req.user.id

    const productId = Number(req.body.productId)
    const rating = Number(req.body.rating)

    const comment =
      typeof req.body.comment === 'string'
        ? req.body.comment.trim()
        : ''

    if (!Number.isInteger(productId) || productId <= 0) {
      return res.status(400).json({
        message: 'Produit invalide.',
      })
    }

    if (
      !Number.isInteger(rating) ||
      rating < 1 ||
      rating > 5
    ) {
      return res.status(400).json({
        message: 'La note doit être comprise entre 1 et 5.',
      })
    }

    const [products] = await pool.query(
      `
        SELECT id, status
        FROM products
        WHERE id = ?
        LIMIT 1
      `,
      [productId],
    )

    const product = products[0]

    if (!product || product.status !== 'active') {
      return res.status(404).json({
        message: 'Produit introuvable.',
      })
    }

    const [existingReviews] = await pool.query(
      `
        SELECT id
        FROM reviews
        WHERE
          user_id = ?
          AND product_id = ?
        LIMIT 1
      `,
      [
        userId,
        productId,
      ],
    )

    if (existingReviews.length > 0) {
      return res.status(409).json({
        message:
          'Vous avez déjà laissé un avis sur ce produit.',
      })
    }

    const [result] = await pool.query(
      `
        INSERT INTO reviews
        (
          user_id,
          product_id,
          rating,
          comment,
          status
        )
        VALUES (?, ?, ?, ?, 'pending')
      `,
      [
        userId,
        productId,
        rating,
        comment || null,
      ],
    )

    const [createdRows] = await pool.query(
      `
        SELECT
          r.id,
          r.user_id,
          r.product_id,
          r.rating,
          r.comment,
          r.status,
          r.created_at
        FROM reviews r
        WHERE r.id = ?
        LIMIT 1
      `,
      [result.insertId],
    )

    return res.status(201).json({
      message:
        'Votre avis a été envoyé et attend la validation.',
      review: createdRows[0],
    })
  } catch (error) {
    next(error)
  }
}

async function getMyProductReview(req, res, next) {
  try {
    const userId = req.user.id
    const productId = Number(req.params.productId)

    if (!Number.isInteger(productId) || productId <= 0) {
      return res.status(400).json({
        message: 'Produit invalide.',
      })
    }

    const [rows] = await pool.query(
      `
        SELECT
          id,
          user_id,
          product_id,
          rating,
          comment,
          status,
          created_at
        FROM reviews
        WHERE
          user_id = ?
          AND product_id = ?
        LIMIT 1
      `,
      [
        userId,
        productId,
      ],
    )

    return res.json({
      review: rows[0] || null,
    })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getProductReviews,
  createReview,
  getMyProductReview,
}