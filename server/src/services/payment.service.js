const env = require('../config/env')

class PaymentProviderNotConfiguredError extends Error {
  constructor(message) {
    super(message)
    this.name = 'PaymentProviderNotConfiguredError'
    this.code = 'PAYMENT_PROVIDER_NOT_CONFIGURED'
    this.statusCode = 503
  }
}

class PaymentWebhookNotConfiguredError extends Error {
  constructor(message) {
    super(message)
    this.name = 'PaymentWebhookNotConfiguredError'
    this.code = 'PAYMENT_WEBHOOK_NOT_CONFIGURED'
    this.statusCode = 503
  }
}

function hasHostedCardProvider() {
  return Boolean(
    env.payment?.card?.provider &&
      env.payment?.card?.secretKey &&
      env.payment?.card?.webhookSecret,
  )
}

async function createHostedCardPaymentSession({
  checkout,
}) {
  const trustedTotal =
    Number(checkout?.total)

  if (
    !Number.isFinite(
      trustedTotal,
    )
  ) {
    throw Object.assign(
      new Error(
        'Montant de paiement invalide.',
      ),
      {
        code: 'INVALID_PAYMENT_AMOUNT',
        statusCode: 400,
      },
    )
  }

  if (!hasHostedCardProvider()) {
    throw new PaymentProviderNotConfiguredError(
      'Le paiement par carte bancaire n’est pas encore configuré.',
    )
  }

  /*
    Provider-specific code belongs here once a merchant account,
    official API documentation, and real credentials are available.
    The adapter must use checkout.total from the server-side cart
    calculation and must return a hosted paymentUrl.
  */
  throw new PaymentProviderNotConfiguredError(
    'Le fournisseur de paiement doit être connecté avant de créer une session carte.',
  )
}

function verifyPaymentWebhook() {
  if (!hasHostedCardProvider()) {
    throw new PaymentWebhookNotConfiguredError(
      'Le webhook du fournisseur de paiement n’est pas encore configuré.',
    )
  }

  /*
    Real signature verification must be implemented with the selected
    provider's official webhook secret and raw request body.
  */
  throw new PaymentWebhookNotConfiguredError(
    'La vérification du webhook doit être implémentée pour le fournisseur réel.',
  )
}

module.exports = {
  PaymentProviderNotConfiguredError,
  PaymentWebhookNotConfiguredError,
  createHostedCardPaymentSession,
  hasHostedCardProvider,
  verifyPaymentWebhook,
}
