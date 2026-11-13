const pool = require('../config/db')

const CATEGORY_STATUSES = [
  'active',
  'inactive',
]

const slugPattern =
  /^[a-z0-9]+(?:-[a-z0-9]+)*$/

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function trimString(value) {
  if (
    value === undefined ||
    value === null
  ) {
    return ''
  }

  return String(value).trim()
}

function nullableString(value) {
  const nextValue =
    trimString(value)

  return nextValue || null
}

function parseCategoryId(value) {
  const categoryId =
    Number(value)

  return Number.isInteger(categoryId) &&
    categoryId > 0
    ? categoryId
    : null
}

function normalizeCategoryPayload(body) {
  const errors = []
  const name =
    trimString(body.name)

  if (!name) {
    errors.push(
      'Le nom de la categorie est requis.',
    )
  }

  const slug =
    trimString(body.slug) ||
    slugify(name)

  if (
    !slug ||
    !slugPattern.test(slug)
  ) {
    errors.push(
      'Le slug categorie est invalide.',
    )
  }

  const status =
    body.status ||
    body.statusType ||
    'active'

  if (
    !CATEGORY_STATUSES.includes(status)
  ) {
    errors.push(
      'Statut categorie invalide.',
    )
  }

  const image =
    nullableString(body.image)

  return {
    errors,
    category: {
      name,
      slug,
      description:
        nullableString(body.description),
      image:
        image &&
        !image.startsWith('blob:') &&
        !image.startsWith('data:')
          ? image
          : null,
      status,
    },
  }
}

async function fetchAdminCategoryById(
  db,
  categoryId,
) {
  const [rows] =
    await db.query(
      `
      SELECT
        c.id,
        c.name,
        c.slug,
        c.description,
        c.image,
        c.status,
        c.created_at,
        c.updated_at,
        COUNT(p.id) AS product_count
      FROM categories c
      LEFT JOIN products p
        ON p.category_id = c.id
      WHERE c.id = ?
      GROUP BY
        c.id,
        c.name,
        c.slug,
        c.description,
        c.image,
        c.status,
        c.created_at,
        c.updated_at
      LIMIT 1
      `,
      [categoryId],
    )

  return rows[0] || null
}

function handleCategoryDatabaseError(
  error,
  res,
) {
  if (
    error.code !== 'ER_DUP_ENTRY'
  ) {
    return false
  }

  res.status(409).json({
    message:
      'Ce slug categorie existe deja.',
  })

  return true
}

async function getCategories(req, res, next) {
  try {
    const [rows] = await pool.query(`
      SELECT
        id,
        name,
        slug,
        description,
        image,
        status,
        created_at,
        updated_at
      FROM categories
      WHERE status = 'active'
      ORDER BY id ASC
    `)

    res.json({
      categories: rows,
    })
  } catch (error) {
    next(error)
  }
}

async function getAdminCategories(
  req,
  res,
  next,
) {
  try {
    const [rows] =
      await pool.query(
        `
        SELECT
          c.id,
          c.name,
          c.slug,
          c.description,
          c.image,
          c.status,
          c.created_at,
          c.updated_at,
          COUNT(p.id) AS product_count
        FROM categories c
        LEFT JOIN products p
          ON p.category_id = c.id
        GROUP BY
          c.id,
          c.name,
          c.slug,
          c.description,
          c.image,
          c.status,
          c.created_at,
          c.updated_at
        ORDER BY
          c.created_at DESC,
          c.id DESC
        `,
      )

    res.json({
      categories: rows,
    })
  } catch (error) {
    next(error)
  }
}

async function getAdminCategoryById(
  req,
  res,
  next,
) {
  try {
    const categoryId =
      parseCategoryId(req.params.id)

    if (!categoryId) {
      return res.status(400).json({
        message:
          'Identifiant categorie invalide.',
      })
    }

    const category =
      await fetchAdminCategoryById(
        pool,
        categoryId,
      )

    if (!category) {
      return res.status(404).json({
        message:
          'Categorie introuvable.',
      })
    }

    res.json({
      category,
    })
  } catch (error) {
    next(error)
  }
}

async function createAdminCategory(
  req,
  res,
  next,
) {
  try {
    const {
      errors,
      category,
    } = normalizeCategoryPayload(
      req.body || {},
    )

    if (
      errors.length > 0
    ) {
      return res.status(400).json({
        message:
          'La categorie est invalide.',
        errors,
      })
    }

    const [result] =
      await pool.query(
        `
        INSERT INTO categories (
          name,
          slug,
          description,
          image,
          status
        )
        VALUES (?, ?, ?, ?, ?)
        `,
        [
          category.name,
          category.slug,
          category.description,
          category.image,
          category.status,
        ],
      )

    const createdCategory =
      await fetchAdminCategoryById(
        pool,
        result.insertId,
      )

    res.status(201).json({
      message:
        'Categorie creee avec succes.',
      category: createdCategory,
    })
  } catch (error) {
    if (
      handleCategoryDatabaseError(
        error,
        res,
      )
    ) {
      return
    }

    next(error)
  }
}

async function updateAdminCategory(
  req,
  res,
  next,
) {
  try {
    const categoryId =
      parseCategoryId(req.params.id)

    if (!categoryId) {
      return res.status(400).json({
        message:
          'Identifiant categorie invalide.',
      })
    }

    const existingCategory =
      await fetchAdminCategoryById(
        pool,
        categoryId,
      )

    if (!existingCategory) {
      return res.status(404).json({
        message:
          'Categorie introuvable.',
      })
    }

    const {
      errors,
      category,
    } = normalizeCategoryPayload(
      req.body || {},
    )

    if (
      errors.length > 0
    ) {
      return res.status(400).json({
        message:
          'La categorie est invalide.',
        errors,
      })
    }

    await pool.query(
      `
      UPDATE categories
      SET
        name = ?,
        slug = ?,
        description = ?,
        image = ?,
        status = ?
      WHERE id = ?
      `,
      [
        category.name,
        category.slug,
        category.description,
        category.image,
        category.status,
        categoryId,
      ],
    )

    const updatedCategory =
      await fetchAdminCategoryById(
        pool,
        categoryId,
      )

    res.json({
      message:
        'Categorie mise a jour avec succes.',
      category: updatedCategory,
    })
  } catch (error) {
    if (
      handleCategoryDatabaseError(
        error,
        res,
      )
    ) {
      return
    }

    next(error)
  }
}

async function deleteAdminCategory(
  req,
  res,
  next,
) {
  try {
    const categoryId =
      parseCategoryId(req.params.id)

    if (!categoryId) {
      return res.status(400).json({
        message:
          'Identifiant categorie invalide.',
      })
    }

    const [productRows] =
      await pool.query(
        `
        SELECT COUNT(*) AS total
        FROM products
        WHERE category_id = ?
        `,
        [categoryId],
      )

    if (
      Number(productRows[0].total) > 0
    ) {
      return res.status(409).json({
        message:
          'Impossible de supprimer cette categorie car des produits y sont rattaches.',
      })
    }

    const [result] =
      await pool.query(
        `
        DELETE FROM categories
        WHERE id = ?
        `,
        [categoryId],
      )

    if (
      result.affectedRows === 0
    ) {
      return res.status(404).json({
        message:
          'Categorie introuvable.',
      })
    }

    res.json({
      message:
        'Categorie supprimee avec succes.',
    })
  } catch (error) {
    next(error)
  }
}

async function getCategoryBySlug(req, res, next) {
  try {
    const { slug } = req.params

    const [rows] = await pool.query(
      `
      SELECT
        id,
        name,
        slug,
        description,
        image,
        status,
        created_at,
        updated_at
      FROM categories
      WHERE slug = ?
        AND status = 'active'
      LIMIT 1
      `,
      [slug],
    )

    if (rows.length === 0) {
      res.status(404).json({
        message: 'Catégorie introuvable.',
      })
      return
    }

    res.json({
      category: rows[0],
    })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getCategories,
  getAdminCategories,
  getAdminCategoryById,
  createAdminCategory,
  updateAdminCategory,
  deleteAdminCategory,
  getCategoryBySlug,
}
