const path = require('path')
const dotenv = require('dotenv')

dotenv.config({
  path: path.resolve(__dirname, '../../.env'),
})

const getOptional = (...keys) => {
  for (const key of keys) {
    if (process.env[key]) {
      return process.env[key]
    }
  }

  return ''
}

module.exports = {
  port: Number(
    process.env.PORT || 5000,
  ),

  nodeEnv:
    process.env.NODE_ENV ||
    'development',

  clientUrl:
    process.env.CLIENT_URL ||
    'http://localhost:5173',

  db: {
    host:
      process.env.DB_HOST ||
      'localhost',

    port: Number(
      process.env.DB_PORT ||
      3306,
    ),

    user:
      process.env.DB_USER ||
      'root',

    password:
      process.env.DB_PASSWORD ||
      '',

    database:
      process.env.DB_NAME ||
      'nova_ecommerce',
  },

  jwt: {
    secret:
      process.env.JWT_SECRET ||
      '',

    expiresIn:
      process.env.JWT_EXPIRES_IN ||
      '7d',
  },

  payment: {
    card: {
      provider:
        process.env.PAYMENT_CARD_PROVIDER ||
        '',

      secretKey:
        process.env.PAYMENT_CARD_SECRET_KEY ||
        '',

      webhookSecret:
        process.env.PAYMENT_CARD_WEBHOOK_SECRET ||
        '',

      successUrl:
        process.env.PAYMENT_CARD_SUCCESS_URL ||
        `${process.env.CLIENT_URL || 'http://localhost:5173'}/paiement/succes`,

      cancelUrl:
        process.env.PAYMENT_CARD_CANCEL_URL ||
        `${process.env.CLIENT_URL || 'http://localhost:5173'}/paiement/annule`,
    },
  },

  email: {
    host:
      getOptional(
        'EMAIL_HOST',
        'SMTP_HOST',
      ),

    port: Number(
      getOptional(
        'EMAIL_PORT',
        'SMTP_PORT',
      ) || 587,
    ),

    user:
      getOptional(
        'EMAIL_USER',
        'SMTP_USER',
      ),

    password:
      getOptional(
        'EMAIL_PASSWORD',
        'SMTP_PASSWORD',
      ),

    from:
      getOptional('EMAIL_FROM') ||
      `NOVA <${getOptional(
        'EMAIL_USER',
        'SMTP_USER',
      )}>`,
  },
}
