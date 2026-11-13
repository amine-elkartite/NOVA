const pool = require('../config/db')

const statusLabels = {
  pending: 'En attente',
  confirmed: 'Confirmee',
  processing: 'En preparation',
  preparing: 'En preparation',
  shipped: 'Expediee',
  delivered: 'Livree',
  cancelled: 'Annulee',
}

const statusColors = {
  pending: '#d9a928',
  confirmed: '#5da96c',
  processing: '#5986b9',
  preparing: '#5986b9',
  shipped: '#765db1',
  delivered: '#448653',
  cancelled: '#c84c55',
}

function normalizeRange(range) {
  if (
    [
      'last_7_days',
      'current_month',
      'previous_month',
      'all',
    ].includes(range)
  ) {
    return range
  }

  return 'current_month'
}

function getRangeCondition(
  alias,
  range,
) {
  const column =
    `${alias}.created_at`

  if (range === 'last_7_days') {
    return {
      sql:
        `${column} >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)`,
      params: [],
    }
  }

  if (range === 'previous_month') {
    return {
      sql:
        `${column} >= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m-01')
         AND ${column} < DATE_FORMAT(CURDATE(), '%Y-%m-01')`,
      params: [],
    }
  }

  if (range === 'all') {
    return {
      sql: '1 = 1',
      params: [],
    }
  }

  return {
    sql:
      `${column} >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
       AND ${column} < DATE_ADD(LAST_DAY(CURDATE()), INTERVAL 1 DAY)`,
    params: [],
  }
}

function successfulRevenueClause(alias = 'o') {
  return `
    ${alias}.status <> 'cancelled'
    AND ${alias}.payment_status <> 'refunded'
  `
}

function formatDateLabel(value) {
  const date =
    new Date(value)

  if (Number.isNaN(date.getTime())) {
    return String(value || '')
  }

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
  }).format(date)
}

function getInitials(name) {
  return String(name || '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('')
}

async function getSalesSeries() {
  const [currentRows] =
    await pool.query(
      `
      SELECT
        DATE(o.created_at) AS sale_date,
        COALESCE(SUM(o.total), 0) AS revenue
      FROM orders o
      WHERE ${successfulRevenueClause('o')}
        AND o.created_at >= DATE_SUB(CURDATE(), INTERVAL 11 DAY)
      GROUP BY DATE(o.created_at)
      ORDER BY sale_date ASC
      `,
    )

  const [previousRows] =
    await pool.query(
      `
      SELECT
        DATE(o.created_at) AS sale_date,
        COALESCE(SUM(o.total), 0) AS revenue
      FROM orders o
      WHERE ${successfulRevenueClause('o')}
        AND o.created_at >= DATE_SUB(CURDATE(), INTERVAL 23 DAY)
        AND o.created_at < DATE_SUB(CURDATE(), INTERVAL 11 DAY)
      GROUP BY DATE(o.created_at)
      ORDER BY sale_date ASC
      `,
    )

  const currentByDate =
    new Map(
      currentRows.map((row) => [
        String(row.sale_date),
        Number(row.revenue || 0),
      ]),
    )

  const previousValues =
    previousRows.map((row) =>
      Number(row.revenue || 0),
    )

  const labels = []
  const current = []
  const previous = []

  for (let offset = 11; offset >= 0; offset -= 1) {
    const date =
      new Date()

    date.setHours(0, 0, 0, 0)
    date.setDate(date.getDate() - offset)

    const key =
      date.toISOString().slice(0, 10)

    labels.push(
      formatDateLabel(key),
    )

    current.push(
      currentByDate.get(key) || 0,
    )

    previous.push(
      previousValues[
        previousValues.length - 12 + (11 - offset)
      ] || 0,
    )
  }

  return {
    labels,
    current,
    previous,
  }
}

async function getDashboardStats(range) {
  const orderRange =
    getRangeCondition(
      'o',
      range,
    )

  const [orderRows] =
    await pool.query(
      `
      SELECT
        COUNT(*) AS orders_count,
        COALESCE(
          SUM(
            CASE
              WHEN ${successfulRevenueClause('o')}
              THEN o.total
              ELSE 0
            END
          ),
          0
        ) AS revenue,
        COALESCE(
          AVG(
            CASE
              WHEN ${successfulRevenueClause('o')}
              THEN o.total
              ELSE NULL
            END
          ),
          0
        ) AS average_order_value
      FROM orders o
      WHERE ${orderRange.sql}
      `,
      orderRange.params,
    )

  const [customerRows] =
    await pool.query(
      `
      SELECT COUNT(*) AS customers_count
      FROM users
      WHERE role = 'customer'
      `,
    )

  const [soldRows] =
    await pool.query(
      `
      SELECT COALESCE(SUM(oi.quantity), 0) AS products_sold
      FROM order_items oi
      INNER JOIN orders o
        ON o.id = oi.order_id
      WHERE ${orderRange.sql}
        AND ${successfulRevenueClause('o')}
      `,
      orderRange.params,
    )

  return {
    ordersCount:
      Number(orderRows[0].orders_count || 0),
    customersCount:
      Number(customerRows[0].customers_count || 0),
    productsSold:
      Number(soldRows[0].products_sold || 0),
    revenue:
      Number(orderRows[0].revenue || 0),
    averageOrderValue:
      Number(orderRows[0].average_order_value || 0),
  }
}

async function getStatusDistribution(range) {
  const orderRange =
    getRangeCondition(
      'o',
      range,
    )

  const [rows] =
    await pool.query(
      `
      SELECT
        o.status,
        COUNT(*) AS total
      FROM orders o
      WHERE ${orderRange.sql}
      GROUP BY o.status
      ORDER BY total DESC
      `,
      orderRange.params,
    )

  return rows.map((row) => ({
    status:
      row.status,
    label:
      statusLabels[row.status] || row.status,
    value:
      Number(row.total || 0),
    color:
      statusColors[row.status] || '#687466',
  }))
}

async function getLatestOrders() {
  const [orders] =
    await pool.query(
      `
      SELECT
        o.id,
        o.user_id,
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
        u.first_name,
        u.last_name,
        u.email,
        u.phone,
        u.city,
        COUNT(oi.id) AS item_lines,
        COALESCE(SUM(oi.quantity), 0) AS item_quantity
      FROM orders o
      INNER JOIN users u
        ON u.id = o.user_id
      LEFT JOIN order_items oi
        ON oi.order_id = o.id
      GROUP BY
        o.id,
        o.user_id,
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
        u.first_name,
        u.last_name,
        u.email,
        u.phone,
        u.city
      ORDER BY o.created_at DESC, o.id DESC
      LIMIT 5
      `,
    )

  return orders
}

async function getBestProducts(range) {
  const orderRange =
    getRangeCondition(
      'o',
      range,
    )

  const [rows] =
    await pool.query(
      `
      SELECT
        oi.product_id,
        oi.product_name AS name,
        COALESCE(SUM(oi.quantity), 0) AS sales,
        COALESCE(SUM(oi.total_price), 0) AS revenue,
        COALESCE(p.price, oi.unit_price) AS price,
        (
          SELECT pi.image_url
          FROM product_images pi
          WHERE pi.product_id = oi.product_id
          ORDER BY pi.is_primary DESC, pi.sort_order ASC, pi.id ASC
          LIMIT 1
        ) AS image_url
      FROM order_items oi
      INNER JOIN orders o
        ON o.id = oi.order_id
      LEFT JOIN products p
        ON p.id = oi.product_id
      WHERE ${orderRange.sql}
        AND ${successfulRevenueClause('o')}
      GROUP BY
        oi.product_id,
        oi.product_name,
        p.price,
        oi.unit_price
      ORDER BY sales DESC, revenue DESC
      LIMIT 5
      `,
      orderRange.params,
    )

  return rows.map((row, index) => ({
    rank:
      index + 1,
    id:
      row.product_id,
    name:
      row.name,
    sales:
      Number(row.sales || 0),
    revenue:
      Number(row.revenue || 0),
    price:
      Number(row.price || 0),
    image:
      row.image_url || '',
    initials:
      getInitials(row.name),
  }))
}

async function getCategorySales(range) {
  const orderRange =
    getRangeCondition(
      'o',
      range,
    )

  const [rows] =
    await pool.query(
      `
      SELECT
        COALESCE(c.name, 'Sans categorie') AS name,
        COALESCE(SUM(oi.quantity), 0) AS sales,
        COALESCE(SUM(oi.total_price), 0) AS revenue
      FROM order_items oi
      INNER JOIN orders o
        ON o.id = oi.order_id
      LEFT JOIN products p
        ON p.id = oi.product_id
      LEFT JOIN categories c
        ON c.id = p.category_id
      WHERE ${orderRange.sql}
        AND ${successfulRevenueClause('o')}
      GROUP BY COALESCE(c.name, 'Sans categorie')
      ORDER BY revenue DESC, sales DESC
      LIMIT 8
      `,
      orderRange.params,
    )

  return rows.map((row) => ({
    name:
      row.name,
    sales:
      Number(row.sales || 0),
    revenue:
      Number(row.revenue || 0),
  }))
}

async function getAdminAnalytics(
  req,
  res,
  next,
) {
  try {
    const range =
      normalizeRange(req.query.range)

    const [
      stats,
      salesChart,
      statusChart,
      latestOrders,
      bestProducts,
      categorySales,
    ] =
      await Promise.all([
        getDashboardStats(range),
        getSalesSeries(range),
        getStatusDistribution(range),
        getLatestOrders(),
        getBestProducts(range),
        getCategorySales(range),
      ])

    res.json({
      range,
      stats,
      salesChart,
      statusChart,
      latestOrders,
      bestProducts,
      categorySales,
      salesDistribution: {
        available: false,
        reason:
          'Le schema actuel ne stocke pas le canal de vente.',
        totalRevenue:
          stats.revenue,
        items: [],
      },
      trafficSources: {
        available: false,
        reason:
          'Le schema actuel ne stocke pas les sources de trafic.',
        items: [],
      },
      deviceDistribution: {
        available: false,
        reason:
          'Le schema actuel ne stocke pas le type d appareil.',
        items: [],
      },
    })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getAdminAnalytics,
}
