const pool = require('../config/db')

const PRODUCT_STATUSES = [
  'draft',
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

function normalizeBoolean(value) {
  return value === true ||
    value === 1 ||
    value === '1' ||
    value === 'true'
    ? 1
    : 0
}

function parseProductId(value) {
  const productId =
    Number(value)

  return Number.isInteger(productId) &&
    productId > 0
    ? productId
    : null
}

function normalizeDecimal(
  value,
  fieldLabel,
  errors,
  {
    required = false,
    allowZero = false,
  } = {},
) {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    if (required) {
      errors.push(
        `${fieldLabel} est requis.`,
      )
    }

    return null
  }

  const numberValue =
    Number(value)

  if (
    !Number.isFinite(numberValue) ||
    numberValue < 0 ||
    (!allowZero && numberValue === 0)
  ) {
    errors.push(
      `${fieldLabel} est invalide.`,
    )

    return null
  }

  return numberValue
}

function normalizeStock(value, errors) {
  const stock =
    Number(value ?? 0)

  if (
    !Number.isInteger(stock) ||
    stock < 0
  ) {
    errors.push(
      'Le stock doit etre un entier positif ou nul.',
    )

    return 0
  }

  return stock
}

function normalizeStatus(body) {
  if (
    body.visibility === 'hidden'
  ) {
    return 'inactive'
  }

  if (
    body.publicationStatus === 'published'
  ) {
    return 'active'
  }

  if (
    body.publicationStatus === 'draft' ||
    body.publicationStatus === 'scheduled'
  ) {
    return 'draft'
  }

  return body.status || 'draft'
}

async function resolveCategoryId(
  db,
  body,
  errors,
) {
  const rawCategoryId =
    body.category_id ??
    body.categoryId

  if (
    rawCategoryId !== undefined &&
    rawCategoryId !== null &&
    rawCategoryId !== ''
  ) {
    const categoryId =
      Number(rawCategoryId)

    if (
      !Number.isInteger(categoryId) ||
      categoryId <= 0
    ) {
      errors.push(
        'Categorie invalide.',
      )

      return null
    }

    const [rows] =
      await db.query(
        `
        SELECT id
        FROM categories
        WHERE id = ?
        LIMIT 1
        `,
        [categoryId],
      )

    if (
      rows.length === 0
    ) {
      errors.push(
        'Categorie introuvable.',
      )

      return null
    }

    return categoryId
  }

  const categorySlug =
    nullableString(
      body.category_slug ??
        body.categorySlug,
    )

  const categoryName =
    nullableString(
      body.category_name ??
        body.categoryName ??
        body.category,
    )

  if (
    !categorySlug &&
    !categoryName
  ) {
    return null
  }

  const lookupSlug =
    categorySlug ||
    slugify(categoryName)

  const [rows] =
    await db.query(
      `
      SELECT id
      FROM categories
      WHERE slug = ?
        OR name = ?
      ORDER BY id ASC
      LIMIT 1
      `,
      [
        lookupSlug,
        categoryName || lookupSlug,
      ],
    )

  if (
    rows.length === 0
  ) {
    errors.push(
      'Categorie introuvable.',
    )

    return null
  }

  return rows[0].id
}

function normalizeImages(
  images,
  productName,
  errors,
) {
  if (
    images === undefined
  ) {
    return undefined
  }

  if (
    !Array.isArray(images)
  ) {
    errors.push(
      'Les images produit sont invalides.',
    )

    return []
  }

  return images
    .map((image, index) => {
      const imageUrl =
        typeof image === 'string'
          ? trimString(image)
          : trimString(
              image.image_url ??
                image.imageUrl ??
                image.url ??
                image.src,
            )

      if (
        !imageUrl ||
        imageUrl.startsWith('blob:') ||
        imageUrl.startsWith('data:')
      ) {
        return null
      }

      return {
        imageUrl,
        altText:
          nullableString(
            image.alt_text ??
              image.altText,
          ) || productName,
        isPrimary:
          index === 0 ||
          image.is_primary === true ||
          image.isPrimary === true ||
          image.is_primary === 1 ||
          image.isPrimary === 1
            ? 1
            : 0,
        sortOrder:
          Number.isInteger(
            Number(
              image.sort_order ??
                image.sortOrder,
            ),
          )
            ? Number(
                image.sort_order ??
                  image.sortOrder,
              )
            : index,
      }
    })
    .filter(Boolean)
}

function normalizeVariants(
  variants,
  errors,
) {
  if (
    variants === undefined
  ) {
    return undefined
  }

  if (
    !Array.isArray(variants)
  ) {
    errors.push(
      'Les variantes produit sont invalides.',
    )

    return []
  }

  return variants.map(
    (variant) => {
      const stock =
        Number(variant.stock ?? 0)

      const additionalPrice =
        Number(
          variant.additional_price ??
            variant.additionalPrice ??
            0,
        )

      if (
        !Number.isInteger(stock) ||
        stock < 0
      ) {
        errors.push(
          'Le stock des variantes doit etre positif ou nul.',
        )
      }

      if (
        !Number.isFinite(additionalPrice) ||
        additionalPrice < 0
      ) {
        errors.push(
          'Le prix additionnel des variantes est invalide.',
        )
      }

      return {
        size:
          nullableString(variant.size),
        color:
          nullableString(variant.color),
        sku:
          nullableString(variant.sku),
        stock:
          Number.isInteger(stock) &&
          stock >= 0
            ? stock
            : 0,
        additionalPrice:
          Number.isFinite(additionalPrice) &&
          additionalPrice >= 0
            ? additionalPrice
            : 0,
      }
    },
  )
}

async function normalizeProductPayload(
  db,
  body,
) {
  const errors = []
  const name =
    trimString(body.name)

  if (!name) {
    errors.push(
      'Le nom du produit est requis.',
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
      'Le slug produit est invalide.',
    )
  }

  const priceSource =
    body.price ??
    (body.salePrice
      ? body.salePrice
      : body.regularPrice)

  const price =
    normalizeDecimal(
      priceSource,
      'Le prix',
      errors,
      {
        required: true,
      },
    )

  const oldPriceSource =
    body.old_price ??
    body.oldPrice ??
    body.comparePrice ??
    (body.salePrice
      ? body.regularPrice
      : null)

  const oldPrice =
    normalizeDecimal(
      oldPriceSource,
      'Le prix compare',
      errors,
      {
        allowZero: false,
      },
    )

  const stock =
    normalizeStock(
      body.stock ??
        body.quantity,
      errors,
    )

  const status =
    normalizeStatus(body)

  if (
    !PRODUCT_STATUSES.includes(status)
  ) {
    errors.push(
      'Statut produit invalide.',
    )
  }

  const categoryId =
    await resolveCategoryId(
      db,
      body,
      errors,
    )

  const images =
    normalizeImages(
      body.images,
      name,
      errors,
    )

  const variants =
    normalizeVariants(
      body.variants,
      errors,
    )

  return {
    errors,
    product: {
      categoryId,
      name,
      slug,
      sku:
        nullableString(body.sku),
      shortDescription:
        nullableString(
          body.short_description ??
            body.shortDescription,
        ),
      description:
        nullableString(body.description),
      price,
      oldPrice,
      stock,
      gender:
        nullableString(body.gender),
      brand:
        nullableString(body.brand),
      status,
      featured:
        normalizeBoolean(
          body.featured,
        ),
      images,
      variants,
    },
  }
}

async function fetchAdminProductById(
  db,
  productId,
) {
  const [rows] =
    await db.query(
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
        c.slug AS category_slug

      FROM products p

      LEFT JOIN categories c
        ON c.id = p.category_id

      WHERE p.id = ?

      LIMIT 1
      `,
      [productId],
    )

  if (
    rows.length === 0
  ) {
    return null
  }

  const product =
    rows[0]

  const [variants] =
    await db.query(
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

      WHERE product_id = ?

      ORDER BY id ASC
      `,
      [product.id],
    )

  const [images] =
    await db.query(
      `
      SELECT
        id,
        product_id,
        image_url,
        alt_text,
        is_primary,
        sort_order,
        created_at

      FROM product_images

      WHERE product_id = ?

      ORDER BY
        is_primary DESC,
        sort_order ASC,
        id ASC
      `,
      [product.id],
    )

  return {
    ...product,
    variants,
    images,
  }
}

async function replaceProductImages(
  db,
  productId,
  images,
) {
  if (
    images === undefined
  ) {
    return
  }

  await db.query(
    `
    DELETE FROM product_images
    WHERE product_id = ?
    `,
    [productId],
  )

  for (const image of images) {
    await db.query(
      `
      INSERT INTO product_images (
        product_id,
        image_url,
        alt_text,
        is_primary,
        sort_order
      )
      VALUES (?, ?, ?, ?, ?)
      `,
      [
        productId,
        image.imageUrl,
        image.altText,
        image.isPrimary,
        image.sortOrder,
      ],
    )
  }
}

async function replaceProductVariants(
  db,
  productId,
  variants,
) {
  if (
    variants === undefined
  ) {
    return
  }

  await db.query(
    `
    DELETE FROM product_variants
    WHERE product_id = ?
    `,
    [productId],
  )

  for (const variant of variants) {
    await db.query(
      `
      INSERT INTO product_variants (
        product_id,
        size,
        color,
        sku,
        stock,
        additional_price
      )
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        productId,
        variant.size,
        variant.color,
        variant.sku,
        variant.stock,
        variant.additionalPrice,
      ],
    )
  }
}

function handleProductDatabaseError(
  error,
  res,
) {
  if (
    error.code !== 'ER_DUP_ENTRY'
  ) {
    return false
  }

  const sqlMessage =
    String(error.sqlMessage || '')

  let message =
    'Un produit avec ces informations existe deja.'

  if (
    sqlMessage.includes(
      'products_slug_unique',
    )
  ) {
    message =
      'Ce slug produit existe deja.'
  } else if (
    sqlMessage.includes(
      'products_sku_unique',
    )
  ) {
    message =
      'Ce SKU produit existe deja.'
  } else if (
    sqlMessage.includes(
      'product_variants_sku_unique',
    )
  ) {
    message =
      'Un SKU de variante existe deja.'
  }

  res.status(409).json({
    message,
  })

  return true
}

async function getProducts(req, res, next) {
  try {
    const {
      category,
      gender,
      featured,
      search,
      status = 'active',
    } = req.query

    const conditions = []
    const values = []

    if (status) {
      conditions.push('p.status = ?')
      values.push(status)
    }

    conditions.push(
      `(p.category_id IS NULL OR c.status = 'active')`,
    )

    if (category) {
      conditions.push('c.slug = ?')
      values.push(category)
    }

    if (gender) {
      conditions.push('p.gender = ?')
      values.push(gender)
    }

    if (featured !== undefined) {
      conditions.push('p.featured = ?')

      values.push(
        featured === 'true' ||
          featured === '1'
          ? 1
          : 0,
      )
    }

    if (search) {
      conditions.push(
        `(
          p.name LIKE ?
          OR p.description LIKE ?
          OR p.brand LIKE ?
        )`,
      )

      const term =
        `%${search}%`

      values.push(
        term,
        term,
        term,
      )
    }

    const whereClause =
      conditions.length > 0
        ? `WHERE ${conditions.join(
            ' AND ',
          )}`
        : ''

    const [rows] =
      await pool.query(
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

        ${whereClause}

        ORDER BY
          p.created_at DESC,
          p.id DESC
        `,
        values,
      )

    res.json({
      products: rows,
    })
  } catch (error) {
    next(error)
  }
}

async function getAdminProducts(
  req,
  res,
  next,
) {
  try {
    const [rows] =
      await pool.query(
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

        ORDER BY
          p.created_at DESC,
          p.id DESC
        `,
      )

    res.json({
      products: rows,
    })
  } catch (error) {
    next(error)
  }
}

async function getAdminProductById(
  req,
  res,
  next,
) {
  try {
    const productId =
      parseProductId(req.params.id)

    if (!productId) {
      return res.status(400).json({
        message:
          'Identifiant produit invalide.',
      })
    }

    const product =
      await fetchAdminProductById(
        pool,
        productId,
      )

    if (!product) {
      return res.status(404).json({
        message:
          'Produit introuvable.',
      })
    }

    res.json({
      product,
    })
  } catch (error) {
    next(error)
  }
}

async function createAdminProduct(
  req,
  res,
  next,
) {
  const connection =
    await pool.getConnection()

  try {
    await connection.beginTransaction()

    const {
      errors,
      product,
    } = await normalizeProductPayload(
      connection,
      req.body || {},
    )

    if (
      errors.length > 0
    ) {
      await connection.rollback()

      return res.status(400).json({
        message:
          'Le produit est invalide.',
        errors,
      })
    }

    const [result] =
      await connection.query(
        `
        INSERT INTO products (
          category_id,
          name,
          slug,
          sku,
          short_description,
          description,
          price,
          old_price,
          stock,
          gender,
          brand,
          status,
          featured
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          product.categoryId,
          product.name,
          product.slug,
          product.sku,
          product.shortDescription,
          product.description,
          product.price,
          product.oldPrice,
          product.stock,
          product.gender,
          product.brand,
          product.status,
          product.featured,
        ],
      )

    await replaceProductImages(
      connection,
      result.insertId,
      product.images || [],
    )

    await replaceProductVariants(
      connection,
      result.insertId,
      product.variants || [],
    )

    const createdProduct =
      await fetchAdminProductById(
        connection,
        result.insertId,
      )

    await connection.commit()

    res.status(201).json({
      message:
        'Produit cree avec succes.',
      product: createdProduct,
    })
  } catch (error) {
    await connection.rollback()

    if (
      handleProductDatabaseError(
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

async function updateAdminProduct(
  req,
  res,
  next,
) {
  const connection =
    await pool.getConnection()

  try {
    const productId =
      parseProductId(req.params.id)

    if (!productId) {
      return res.status(400).json({
        message:
          'Identifiant produit invalide.',
      })
    }

    await connection.beginTransaction()

    const existingProduct =
      await fetchAdminProductById(
        connection,
        productId,
      )

    if (!existingProduct) {
      await connection.rollback()

      return res.status(404).json({
        message:
          'Produit introuvable.',
      })
    }

    const {
      errors,
      product,
    } = await normalizeProductPayload(
      connection,
      req.body || {},
    )

    if (
      errors.length > 0
    ) {
      await connection.rollback()

      return res.status(400).json({
        message:
          'Le produit est invalide.',
        errors,
      })
    }

    await connection.query(
      `
      UPDATE products
      SET
        category_id = ?,
        name = ?,
        slug = ?,
        sku = ?,
        short_description = ?,
        description = ?,
        price = ?,
        old_price = ?,
        stock = ?,
        gender = ?,
        brand = ?,
        status = ?,
        featured = ?
      WHERE id = ?
      `,
      [
        product.categoryId,
        product.name,
        product.slug,
        product.sku,
        product.shortDescription,
        product.description,
        product.price,
        product.oldPrice,
        product.stock,
        product.gender,
        product.brand,
        product.status,
        product.featured,
        productId,
      ],
    )

    await replaceProductImages(
      connection,
      productId,
      product.images,
    )

    await replaceProductVariants(
      connection,
      productId,
      product.variants,
    )

    const updatedProduct =
      await fetchAdminProductById(
        connection,
        productId,
      )

    await connection.commit()

    res.json({
      message:
        'Produit mis a jour avec succes.',
      product: updatedProduct,
    })
  } catch (error) {
    await connection.rollback()

    if (
      handleProductDatabaseError(
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

async function deleteAdminProduct(
  req,
  res,
  next,
) {
  const connection =
    await pool.getConnection()

  try {
    const productId =
      parseProductId(req.params.id)

    if (!productId) {
      return res.status(400).json({
        message:
          'Identifiant produit invalide.',
      })
    }

    await connection.beginTransaction()

    const existingProduct =
      await fetchAdminProductById(
        connection,
        productId,
      )

    if (!existingProduct) {
      await connection.rollback()

      return res.status(404).json({
        message:
          'Produit introuvable.',
      })
    }

    const [historyRows] =
      await connection.query(
        `
        SELECT COUNT(*) AS total
        FROM order_items
        WHERE product_id = ?
        `,
        [productId],
      )

    if (Number(historyRows[0]?.total || 0) > 0) {
      await connection.query(
        `
        UPDATE products
        SET status = 'archived'
        WHERE id = ?
        `,
        [productId],
      )

      const archivedProduct =
        await fetchAdminProductById(
          connection,
          productId,
        )

      await connection.commit()

      return res.json({
        action: 'archived',
        message:
          'Produit archive afin de preserver l historique des commandes.',
        product: archivedProduct,
      })
    }

    // Cart rows are disposable and use RESTRICT in the connected database.
    await connection.query(
      `
      DELETE FROM cart_items
      WHERE product_id = ?
      `,
      [productId],
    )

    const [result] =
      await connection.query(
        `
        DELETE FROM products
        WHERE id = ?
        `,
        [productId],
      )

    if (
      result.affectedRows === 0
    ) {
      await connection.rollback()

      return res.status(404).json({
        message:
          'Produit introuvable.',
      })
    }

    await connection.commit()

    res.json({
      action: 'deleted',
      message:
        'Produit supprime avec succes.',
    })
  } catch (error) {
    try {
      await connection.rollback()
    } catch {
      // Transaction already closed.
    }

    if (
      error.code ===
      'ER_ROW_IS_REFERENCED_2'
    ) {
      return res.status(409).json({
        message:
          'Impossible de supprimer ce produit car il est reference.',
      })
    }

    next(error)
  } finally {
    connection.release()
  }
}

async function getProductBySlug(
  req,
  res,
  next,
) {
  try {
    const {
      slug,
    } = req.params

    const [rows] =
      await pool.query(
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
          c.slug AS category_slug

        FROM products p

        LEFT JOIN categories c
          ON c.id = p.category_id

        WHERE p.slug = ?
          AND p.status = 'active'
          AND (
            p.category_id IS NULL
            OR c.status = 'active'
          )

        LIMIT 1
        `,
        [slug],
      )

    if (
      rows.length === 0
    ) {
      res.status(404).json({
        message:
          'Produit introuvable.',
      })

      return
    }

    const product =
      rows[0]

    const [variants] =
      await pool.query(
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

        WHERE product_id = ?

        ORDER BY id ASC
        `,
        [product.id],
      )

    const [images] =
      await pool.query(
        `
        SELECT
          id,
          product_id,
          image_url,
          alt_text,
          is_primary,
          sort_order,
          created_at

        FROM product_images

        WHERE product_id = ?

        ORDER BY
          is_primary DESC,
          sort_order ASC,
          id ASC
        `,
        [product.id],
      )

    res.json({
      product: {
        ...product,
        variants,
        images,
      },
    })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getProducts,
  getAdminProducts,
  getAdminProductById,
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
  getProductBySlug,
}
