const pool = require('../config/db')

const defaultSettings = {
  storeSettings: {
    storeName: 'NOVA',
    email: 'contact@nova.ma',
    phone: '',
    address: '',
    currency: 'DH (Dirham marocain)',
    language: 'Francais',
  },
  preferences: {
    emailNotifications: true,
    maintenanceMode: false,
    stockDisplay: true,
    timezone: 'Maroc (GMT+1)',
  },
  shipping: {
    standard: '40',
    express: '70',
    freeFrom: '600',
  },
  paymentMethods: {
    'Carte bancaire': true,
    PayPal: true,
    'Paiement a la livraison': true,
  },
}

function parseStoredJson(value, fallback) {
  if (!value) {
    return { ...fallback }
  }

  try {
    return {
      ...fallback,
      ...JSON.parse(value),
    }
  } catch {
    return { ...fallback }
  }
}

async function readSetting(
  key,
  fallback,
  connection = pool,
) {
  const [rows] = await connection.query(
    `
    SELECT setting_value
    FROM admin_settings
    WHERE setting_key = ?
    LIMIT 1
    `,
    [key],
  )

  return parseStoredJson(
    rows[0]?.setting_value,
    fallback,
  )
}

async function getStorefrontSettings(
  connection = pool,
) {
  const [storeSettings, preferences, shipping, paymentMethods] =
    await Promise.all([
      readSetting(
        'store_settings',
        defaultSettings.storeSettings,
        connection,
      ),
      readSetting(
        'preferences',
        defaultSettings.preferences,
        connection,
      ),
      readSetting(
        'shipping',
        defaultSettings.shipping,
        connection,
      ),
      readSetting(
        'payment_methods',
        defaultSettings.paymentMethods,
        connection,
      ),
    ])

  return {
    storeSettings,
    preferences,
    shipping,
    paymentMethods,
  }
}

function normalizeShippingSettings(shipping = {}) {
  const standard = Number(shipping.standard)
  const express = Number(shipping.express)
  const freeFrom = Number(shipping.freeFrom)

  return {
    standard: Number.isFinite(standard) && standard >= 0 ? standard : 40,
    express: Number.isFinite(express) && express >= 0 ? express : 70,
    freeFrom: Number.isFinite(freeFrom) && freeFrom >= 0 ? freeFrom : 600,
  }
}

async function getShippingSettings(connection = pool) {
  const shipping = await readSetting(
    'shipping',
    defaultSettings.shipping,
    connection,
  )

  return normalizeShippingSettings(shipping)
}

module.exports = {
  defaultSettings,
  getShippingSettings,
  getStorefrontSettings,
  readSetting,
}
