import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react'

import { getStorefrontSettings } from '../services/storefrontSettingsService'

const defaultStorefrontSettings = {
  storeName: 'NOVA',
  currency: 'MAD',
  language: 'fr',
  maintenanceMode: false,
  stockDisplay: true,
  shipping: {
    standard: 40,
    express: 70,
    freeFrom: 600,
    freeShippingScope: 'standard',
  },
  paymentMethods: {
    card: { adminEnabled: false, providerAvailable: false, available: false },
    paypal: { adminEnabled: false, providerAvailable: false, available: false },
    cash: { adminEnabled: true, providerAvailable: true, available: true },
  },
}

const StorefrontSettingsContext = createContext({
  settings: defaultStorefrontSettings,
  loading: true,
})

export function StorefrontSettingsProvider({ children }) {
  const [settings, setSettings] = useState(defaultStorefrontSettings)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    getStorefrontSettings()
      .then((nextSettings) => {
        if (active && nextSettings) {
          setSettings({
            ...defaultStorefrontSettings,
            ...nextSettings,
            shipping: {
              ...defaultStorefrontSettings.shipping,
              ...(nextSettings.shipping || {}),
            },
            paymentMethods: {
              ...defaultStorefrontSettings.paymentMethods,
              ...(nextSettings.paymentMethods || {}),
            },
          })
        }
      })
      .catch((error) => {
        if (active) {
          console.error('Impossible de charger les parametres de la boutique:', error)
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [])

  return (
    <StorefrontSettingsContext.Provider value={{ settings, loading }}>
      {children}
    </StorefrontSettingsContext.Provider>
  )
}

export function useStorefrontSettings() {
  return useContext(StorefrontSettingsContext)
}
