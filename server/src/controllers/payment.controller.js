const pool = require('../config/db')

const {
  calculateCheckoutPricing,
  validateDeliveryMethod,
  validateShippingAddress,
} = require('../services/checkout.service')

const {
  createHostedCardPaymentSession,
  verifyPaymentWebhook,
} = require('../services/payment.service')


const forbiddenCardFields = new Set([
  'card',
  'creditcard',
  'paymentcard',
  'carddetails',
  'cardnumber',
  'cardno',
  'pan',
  'cvc',
  'cvv',
  'securitycode',
  'cardsecuritycode',
  'expiry',
  'expirydate',
  'expiration',
  'expirationdate',
  'expmonth',
  'expyear',
])

function normalizeFieldName(fieldName) {
  return String(fieldName || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

function findForbiddenCardField(value) {
  if (
    !value ||
    typeof value !== 'object'
  ) {
    return ''
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const field =
        findForbiddenCardField(item)

      if (field) {
        return field
      }
    }

    return ''
  }

  for (const [key, nested] of Object.entries(value)) {
    if (
      forbiddenCardFields.has(
        normalizeFieldName(key),
      )
    ) {
      return key
    }

    const nestedField =
      findForbiddenCardField(nested)

    if (nestedField) {
      return nestedField
    }
  }

  return ''
}

function sendPaymentError(
  res,
  error,
) {
  if (!error?.code) {
    return false
  }

  res
    .status(
      error.statusCode ||
        error.status ||
        503,
    )
    .json({
      code: error.code,
      message: error.message,
      paymentUrl: null,
    })

  return true
}

async function prepareCheckoutPricing({
  userId,
  deliveryMethod,
  promotionCode,
}) {
  const connection =
    await pool.getConnection()

  let transactionStarted = false

  try {
    await connection.beginTransaction()
    transactionStarted = true

    const checkout =
      await calculateCheckoutPricing({
        connection,
        userId,
        deliveryMethod,
        promotionCode,
      })

    await connection.rollback()
    transactionStarted = false

    return checkout
  } catch (error) {
    if (transactionStarted) {
      try {
        await connection.rollback()
      } catch {
        // The transaction is already closed.
      }
    }

    throw error
  } finally {
    connection.release()
  }
}


/* =========================
   CREATE CARD PAYMENT SESSION
========================= */

async function createCardPaymentSession(
  req,
  res,
  next,
) {
  try {
    const userId =
      Number(req.user?.id)

    if (!userId) {
      return res.status(401).json({
        message:
          'Authentification requise.',
      })
    }

    const forbiddenField =
      findForbiddenCardField(
        req.body,
      )

    if (forbiddenField) {
      return res.status(400).json({
        code: 'CARD_DATA_NOT_ALLOWED',
        message:
          'Les informations de carte doivent être saisies uniquement chez le fournisseur de paiement sécurisé.',
      })
    }

    const {
      shippingAddress,
      deliveryMethod = 'standard',
      promotionCode = null,
    } = req.body || {}

    validateShippingAddress(
      shippingAddress,
    )

    validateDeliveryMethod(
      deliveryMethod,
    )

    /*
      This prepares the trusted amount from the authenticated user's
      cart without creating an order, decrementing stock, incrementing
      promotion usage, or clearing the cart while no provider is wired.
    */
    const checkout =
      await prepareCheckoutPricing({
        userId,
        deliveryMethod,
        promotionCode,
      })

    const session =
      await createHostedCardPaymentSession({
        userId,
        checkout,
        checkoutData: {
          shippingAddress,
          deliveryMethod,
          promotionCode,
        },
      })

    const paymentUrl =
      session?.paymentUrl

    if (!paymentUrl) {
      return res.status(502).json({
        code: 'PAYMENT_URL_MISSING',
        message:
          'Le fournisseur de paiement n’a pas retourné d’adresse de paiement.',
        paymentUrl: null,
      })
    }

    return res.json({
      paymentUrl,
    })
  } catch (error) {
    if (
      sendPaymentError(
        res,
        error,
      )
    ) {
      return
    }

    next(error)
  }
}


/* =========================
   PAYMENT WEBHOOK
========================= */

async function handlePaymentWebhook(
  req,
  res,
  next,
) {
  try {
    /*
      The real adapter must verify the provider signature before any
      order can be identified or payment_status can be changed.
    */
    const event =
      verifyPaymentWebhook({
        headers: req.headers,
        body: req.body,
        rawBody: req.rawBody,
      })

    /*
      Future idempotent processing goes here:
      - record the provider event id once
      - locate the related NOVA order/payment reference
      - verify amount/currency/status
      - update payment_status only from trusted provider data
      - avoid duplicate stock and promotion side effects
    */
    return res.status(202).json({
      received: Boolean(event),
    })
  } catch (error) {
    if (
      sendPaymentError(
        res,
        error,
      )
    ) {
      return
    }

    next(error)
  }
}


module.exports = {
  createCardPaymentSession,
  handlePaymentWebhook,
}
