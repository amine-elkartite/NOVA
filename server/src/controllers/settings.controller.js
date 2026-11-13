const pool = require('../config/db')
const {
  defaultSettings,
  getStorefrontSettings,
  readSetting,
} = require('../services/settings.service')
const {
  hasHostedCardProvider,
} = require('../services/payment.service')

const defaultProfilePreferences = {
  email: true,
  sms: true,
  newsletter: true,
  darkMode: false,
  language: 'Francais',
  timezone: 'Maroc (GMT+1)',
}

async function writeSetting(
  connection,
  key,
  value,
  adminId,
) {
  await connection.query(
    `
    INSERT INTO admin_settings (
      setting_key,
      setting_value,
      updated_by
    )
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE
      setting_value = VALUES(setting_value),
      updated_by = VALUES(updated_by),
      updated_at = CURRENT_TIMESTAMP
    `,
    [
      key,
      JSON.stringify(value),
      adminId,
    ],
  )
}

function normalizeBoolean(value) {
  return value === true ||
    value === 1 ||
    value === '1' ||
    value === 'true'
}

function validateSettingsPayload(body) {
  const errors = []
  const storeSettings = {
    ...defaultSettings.storeSettings,
    ...(body.storeSettings || {}),
  }
  const preferences = {
    ...defaultSettings.preferences,
    ...(body.preferences || {}),
  }
  const shipping = {
    ...defaultSettings.shipping,
    ...(body.shipping || {}),
  }
  const paymentMethods = {
    ...defaultSettings.paymentMethods,
    ...(body.paymentMethods || {}),
  }

  if (
    !String(
      storeSettings.storeName || '',
    ).trim()
  ) {
    errors.push(
      'Le nom de la boutique est requis.',
    )
  }

  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      String(storeSettings.email || '').trim(),
    )
  ) {
    errors.push(
      'Adresse email boutique invalide.',
    )
  }

  for (const key of [
    'standard',
    'express',
    'freeFrom',
  ]) {
    const value =
      Number(shipping[key])

    if (
      !Number.isFinite(value) ||
      value < 0
    ) {
      errors.push(
        'Les frais de livraison doivent etre positifs.',
      )
      break
    }

    shipping[key] =
      String(value)
  }

  return {
    errors,
    settings: {
      storeSettings: {
        storeName:
          String(storeSettings.storeName || '').trim(),
        email:
          String(storeSettings.email || '').trim(),
        phone:
          String(storeSettings.phone || '').trim(),
        address:
          String(storeSettings.address || '').trim(),
        currency:
          String(storeSettings.currency || '').trim(),
        language:
          String(storeSettings.language || '').trim(),
      },

      preferences: {
        emailNotifications:
          normalizeBoolean(
            preferences.emailNotifications,
          ),
        maintenanceMode:
          normalizeBoolean(
            preferences.maintenanceMode,
          ),
        stockDisplay:
          normalizeBoolean(
            preferences.stockDisplay,
          ),
        timezone:
          String(preferences.timezone || '').trim(),
      },

      shipping,

      paymentMethods:
        Object.fromEntries(
          Object.entries(paymentMethods).map(
            ([key, value]) => [
              key,
              normalizeBoolean(value),
            ],
          ),
        ),
    },
  }
}

async function getAdminSettings(
  req,
  res,
  next,
) {
  try {
    const [
      storeSettings,
      preferences,
      shipping,
      paymentMethods,
    ] =
      await Promise.all([
        readSetting(
          'store_settings',
          defaultSettings.storeSettings,
        ),
        readSetting(
          'preferences',
          defaultSettings.preferences,
        ),
        readSetting(
          'shipping',
          defaultSettings.shipping,
        ),
        readSetting(
          'payment_methods',
          defaultSettings.paymentMethods,
        ),
      ])

    res.json({
      settings: {
        storeSettings,
        preferences,
        shipping,
        paymentMethods,
      },
    })
  } catch (error) {
    next(error)
  }
}

async function getPublicStorefrontSettings(
  req,
  res,
  next,
) {
  try {
    const settings =
      await getStorefrontSettings()
    const cardAdminEnabled =
      Boolean(settings.paymentMethods['Carte bancaire'])
    const paypalAdminEnabled =
      Boolean(settings.paymentMethods.PayPal)
    const cashAdminEnabled =
      Boolean(settings.paymentMethods['Paiement a la livraison'])
    const cardProviderAvailable =
      hasHostedCardProvider()

    res.json({
      storefront: {
        storeName:
          settings.storeSettings.storeName || 'NOVA',
        currency: 'MAD',
        language: 'fr',
        maintenanceMode:
          Boolean(settings.preferences.maintenanceMode),
        stockDisplay:
          settings.preferences.stockDisplay !== false,
        shipping: {
          standard: Number(settings.shipping.standard || 0),
          express: Number(settings.shipping.express || 0),
          freeFrom: Number(settings.shipping.freeFrom || 0),
          freeShippingScope: 'standard',
        },
        paymentMethods: {
          card: {
            adminEnabled: cardAdminEnabled,
            providerAvailable: cardProviderAvailable,
            available:
              cardAdminEnabled && cardProviderAvailable,
          },
          paypal: {
            adminEnabled: paypalAdminEnabled,
            providerAvailable: false,
            available: false,
          },
          cash: {
            adminEnabled: cashAdminEnabled,
            providerAvailable: true,
            available: cashAdminEnabled,
          },
        },
        limitations: {
          currency:
            'MAD is the only supported checkout currency.',
          language:
            'French is the only supported storefront language.',
          emailNotifications:
            'No transactional notification consumer is configured.',
        },
      },
    })
  } catch (error) {
    next(error)
  }
}

async function updateAdminSettings(
  req,
  res,
  next,
) {
  const connection =
    await pool.getConnection()

  try {
    const {
      errors,
      settings,
    } =
      validateSettingsPayload(
        req.body || {},
      )

    if (errors.length > 0) {
      return res.status(400).json({
        message:
          'Parametres invalides.',
        errors,
      })
    }

    await connection.beginTransaction()

    await writeSetting(
      connection,
      'store_settings',
      settings.storeSettings,
      req.user.id,
    )

    await writeSetting(
      connection,
      'preferences',
      settings.preferences,
      req.user.id,
    )

    await writeSetting(
      connection,
      'shipping',
      settings.shipping,
      req.user.id,
    )

    await writeSetting(
      connection,
      'payment_methods',
      settings.paymentMethods,
      req.user.id,
    )

    await connection.commit()

    res.json({
      message:
        'Parametres enregistres.',
      settings,
    })
  } catch (error) {
    try {
      await connection.rollback()
    } catch {
      // Transaction already closed.
    }

    next(error)
  } finally {
    connection.release()
  }
}

async function resetAdminSettings(
  req,
  res,
  next,
) {
  const connection =
    await pool.getConnection()

  try {
    await connection.beginTransaction()

    await writeSetting(
      connection,
      'store_settings',
      defaultSettings.storeSettings,
      req.user.id,
    )

    await writeSetting(
      connection,
      'preferences',
      defaultSettings.preferences,
      req.user.id,
    )

    await writeSetting(
      connection,
      'shipping',
      defaultSettings.shipping,
      req.user.id,
    )

    await writeSetting(
      connection,
      'payment_methods',
      defaultSettings.paymentMethods,
      req.user.id,
    )

    await connection.commit()

    res.json({
      message:
        'Parametres reinitialises.',
      settings:
        defaultSettings,
    })
  } catch (error) {
    try {
      await connection.rollback()
    } catch {
      // Transaction already closed.
    }

    next(error)
  } finally {
    connection.release()
  }
}

async function getProfilePreferences(
  req,
  res,
  next,
) {
  try {
    const preferences =
      await readSetting(
        `profile_preferences_${req.user.id}`,
        defaultProfilePreferences,
      )

    res.json({
      preferences,
    })
  } catch (error) {
    next(error)
  }
}

async function updateProfilePreferences(
  req,
  res,
  next,
) {
  const connection =
    await pool.getConnection()

  try {
    const currentPreferences =
      await readSetting(
        `profile_preferences_${req.user.id}`,
        defaultProfilePreferences,
      )

    const nextPreferences = {
      ...currentPreferences,
      ...(req.body?.preferences || req.body || {}),
    }

    await writeSetting(
      connection,
      `profile_preferences_${req.user.id}`,
      nextPreferences,
      req.user.id,
    )

    res.json({
      message:
        'Preferences de profil enregistrees.',
      preferences:
        nextPreferences,
    })
  } catch (error) {
    next(error)
  } finally {
    connection.release()
  }
}

module.exports = {
  getAdminSettings,
  getPublicStorefrontSettings,
  updateAdminSettings,
  resetAdminSettings,
  getProfilePreferences,
  updateProfilePreferences,
}
