const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const path = require('path')

const env = require('./config/env')
const {
  checkDatabaseConnection,
} = require('./config/db')

const authRoutes =
  require('./routes/auth.routes')

const userRoutes =
  require('./routes/user.routes')

const addressRoutes =
  require('./routes/address.routes')

const favoriteRoutes =
  require('./routes/favorite.routes')

const productRoutes =
  require('./routes/product.routes')

const categoryRoutes =
  require('./routes/category.routes')

const cartRoutes =
  require('./routes/cart.routes')

const orderRoutes =
  require('./routes/order.routes')

const reviewRoutes =
  require('./routes/review.routes')

const promotionRoutes =
  require('./routes/promotion.routes')

const paymentRoutes =
  require('./routes/payment.routes')

const settingsRoutes =
  require('./routes/settings.routes')

const analyticsRoutes =
  require('./routes/analytics.routes')

const messageRoutes =
  require('./routes/message.routes')

const adminRoutes =
  require('./routes/admin.routes')

const {
  notFoundHandler,
  errorHandler,
} = require('./middleware/error.middleware')

const app = express()


/* =========================
   CORS
========================= */

app.use(
  cors({
    origin: env.clientUrl,
    credentials: true,
  }),
)


/* =========================
   BODY / COOKIES
========================= */

app.use(
  express.json({
    limit: '1mb',
    verify: (req, _res, buffer) => {
      if (
        req.originalUrl ===
        '/api/payments/webhook'
      ) {
        req.rawBody =
          Buffer.from(buffer)
      }
    },
  }),
)

app.use(
  cookieParser(),
)


/* =========================
   STATIC UPLOADS
========================= */

app.use(
  '/uploads',
  express.static(
    path.join(
      __dirname,
      '../uploads',
    ),
  ),
)


/* =========================
   HEALTH CHECK
========================= */

app.get(
  '/api/health',
  async (req, res) => {
    try {
      await checkDatabaseConnection()

      res.json({
        status: 'ok',
        database: 'ok',
      })
    } catch (error) {
      res.status(503).json({
        status: 'degraded',
        database: 'unavailable',
        message:
          'Database connection failed.',
      })
    }
  },
)


/* =========================
   API ROUTES
========================= */

app.use(
  '/api/auth',
  authRoutes,
)

app.use(
  '/api/users',
  userRoutes,
)

app.use(
  '/api/addresses',
  addressRoutes,
)

app.use(
  '/api/favorites',
  favoriteRoutes,
)

app.use(
  '/api/products',
  productRoutes,
)

app.use(
  '/api/categories',
  categoryRoutes,
)

app.use(
  '/api/cart',
  cartRoutes,
)

app.use(
  '/api/orders',
  orderRoutes,
)

app.use(
  '/api/reviews',
  reviewRoutes,
)

app.use(
  '/api/promotions',
  promotionRoutes,
)

app.use(
  '/api/payments',
  paymentRoutes,
)

app.use(
  '/api/settings',
  settingsRoutes,
)

app.use(
  '/api/analytics',
  analyticsRoutes,
)

app.use(
  '/api/messages',
  messageRoutes,
)

app.use(
  '/api/admin',
  adminRoutes,
)


/* =========================
   ERROR HANDLERS
========================= */

app.use(
  notFoundHandler,
)

app.use(
  errorHandler,
)


module.exports = app
