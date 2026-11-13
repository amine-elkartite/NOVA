import {
  ChevronRight,
  Cloud,
  Code2,
  Copy,
  CreditCard,
  Database,
  Gift,
  Globe2,
  HelpCircle,
  KeyRound,
  Lock,
  Mail,
  Monitor,
  Package,
  RefreshCcw,
  Save,
  Settings as SettingsIcon,
  ShieldCheck,
  Smartphone,
  Store,
  Truck,
  Wrench,
} from 'lucide-react'
import { useEffect, useState } from 'react'

import AdminHeader from '../../components/layout/AdminHeader.jsx'
import AdminSidebar from '../../components/layout/AdminSidebar.jsx'
import {
  getAdminApiErrorMessages,
  getAdminSettings,
  resetAdminSettings,
  saveAdminSettings,
} from '../../services/adminService.js'

const initialStoreSettings = {
  storeName: 'NOVA',
  email: 'contact@nova.ma',
  phone: '+212 6 12 34 56 78',
  address: '123 Avenue Mohammed V\nCasablanca, Maroc',
  currency: 'DH (Dirham marocain)',
  language: 'Francais',
}

const initialPreferences = {
  emailNotifications: true,
  maintenanceMode: false,
  stockDisplay: true,
  timezone: 'Maroc (GMT+1)',
}

const initialShipping = {
  standard: '40',
  express: '70',
  freeFrom: '600',
}

const supportItems = [
  {
    icon: Cloud,
    title: 'Sauvegarde',
    detail: 'Sauvegardes gerees cote serveur.',
    badge: 'Serveur',
  },
  {
    icon: Code2,
    title: 'Cle API',
    detail: 'Les secrets ne sont pas exposes dans l admin.',
    badge: 'Protegee',
    copy: true,
  },
  {
    icon: HelpCircle,
    title: 'Centre d aide',
    detail: 'Contactez le support NOVA pour les operations sensibles.',
    arrow: true,
  },
]

const securityRows = [
  {
    icon: KeyRound,
    title: 'Changer le mot de passe',
    detail: 'Disponible depuis le profil administrateur.',
  },
  {
    icon: Smartphone,
    title: 'Authentification a deux facteurs',
    detail: 'Configuree depuis les actions de securite du profil.',
  },
  {
    icon: Monitor,
    title: 'Sessions actives',
    detail: 'Les sessions connectees sont gerees par le backend.',
  },
]

const paymentRows = [
  {
    icon: CreditCard,
    key: 'Carte bancaire',
    title: 'Carte bancaire',
    detail: 'Visa, Mastercard, CMI',
  },
  {
    key: 'PayPal',
    type: 'paypal',
    title: 'PayPal',
    detail: 'Paiements securises',
  },
  {
    icon: CreditCard,
    key: 'Paiement a la livraison',
    title: 'Paiement a la livraison',
    detail: 'Reglement a la reception',
  },
]

const initialPaymentState = paymentRows.reduce((state, row) => {
  state[row.key] = true
  return state
}, {})

function normalizeSettings(settings = {}) {
  return {
    storeSettings: {
      ...initialStoreSettings,
      ...(settings.storeSettings || {}),
    },
    preferences: {
      ...initialPreferences,
      ...(settings.preferences || {}),
    },
    shipping: {
      ...initialShipping,
      ...(settings.shipping || {}),
    },
    paymentMethods: {
      ...initialPaymentState,
      ...(settings.paymentMethods || {}),
    },
  }
}

function Toggle({
  checked,
  onChange,
  label,
}) {
  return (
    <button
      className={`settings-toggle ${checked ? 'is-on' : ''}`}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
    >
      <span />
    </button>
  )
}

function SettingsCardHeader({
  icon: Icon,
  title,
  subtitle,
}) {
  return (
    <div className="settings-card-header">
      <div className="settings-card-header__icon">
        <Icon size={26} strokeWidth={1.7} />
      </div>

      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
    </div>
  )
}

export default function Settings() {
  const [storeSettings, setStoreSettings] = useState(initialStoreSettings)
  const [preferences, setPreferences] = useState(initialPreferences)
  const [shipping, setShipping] = useState(initialShipping)
  const [paymentMethods, setPaymentMethods] = useState(initialPaymentState)
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [feedback, setFeedback] = useState('')

  useEffect(() => {
    let isActive = true

    async function loadSettings() {
      setLoading(true)

      try {
        const nextSettings = normalizeSettings(await getAdminSettings())

        if (isActive) {
          setStoreSettings(nextSettings.storeSettings)
          setPreferences(nextSettings.preferences)
          setShipping(nextSettings.shipping)
          setPaymentMethods(nextSettings.paymentMethods)
          setFeedback('')
        }
      } catch (error) {
        if (isActive) {
          setFeedback(getAdminApiErrorMessages(error).join(' '))
        }
      } finally {
        if (isActive) {
          setLoading(false)
        }
      }
    }

    loadSettings()

    return () => {
      isActive = false
    }
  }, [])

  const applySettings = (settings) => {
    const nextSettings = normalizeSettings(settings)

    setStoreSettings(nextSettings.storeSettings)
    setPreferences(nextSettings.preferences)
    setShipping(nextSettings.shipping)
    setPaymentMethods(nextSettings.paymentMethods)
  }

  const updateStoreSetting = (key, value) => {
    setStoreSettings((currentSettings) => ({
      ...currentSettings,
      [key]: value,
    }))
    setSaved(false)
  }

  const updatePreference = (key) => {
    setPreferences((currentPreferences) => ({
      ...currentPreferences,
      [key]: !currentPreferences[key],
    }))
    setSaved(false)
  }

  const updateShipping = (key, value) => {
    setShipping((currentShipping) => ({
      ...currentShipping,
      [key]: value,
    }))
    setSaved(false)
  }

  const resetSettings = async () => {
    if (isSaving) {
      return
    }

    setIsSaving(true)

    try {
      const nextSettings = await resetAdminSettings()

      applySettings(nextSettings)
      setSaved(false)
      setFeedback('Parametres reinitialises en base.')
    } catch (error) {
      setFeedback(getAdminApiErrorMessages(error).join(' '))
    } finally {
      setIsSaving(false)
    }
  }

  const saveSettings = async () => {
    const shippingValues = Object.values(shipping).map((value) =>
      Number(value),
    )

    if (!storeSettings.email.includes('@')) {
      setSaved(false)
      setFeedback('Veuillez saisir une adresse email valide.')
      return
    }

    if (
      shippingValues.some(
        (value) => Number.isNaN(value) || value < 0,
      )
    ) {
      setSaved(false)
      setFeedback('Les frais de livraison doivent etre des nombres positifs.')
      return
    }

    if (isSaving) {
      return
    }

    setIsSaving(true)

    try {
      const nextSettings = await saveAdminSettings({
        storeSettings,
        preferences,
        shipping,
        paymentMethods,
      })

      applySettings(nextSettings)
      setSaved(true)
      setFeedback('Modifications enregistrees en base.')
    } catch (error) {
      setSaved(false)
      setFeedback(getAdminApiErrorMessages(error).join(' '))
    } finally {
      setIsSaving(false)
    }
  }

  const openSecurityPanel = (title) => {
    setFeedback(`Action securite disponible depuis le profil : ${title}.`)
  }

  const copyApiKey = async () => {
    try {
      await navigator.clipboard.writeText('NOVA API key managed server-side')
      setFeedback('Information API copiee dans le presse-papiers.')
    } catch {
      setFeedback('Cle API non exposee dans l admin.')
    }
  }

  const openHelpCenter = () => {
    setFeedback('Support NOVA : contactez l administrateur technique.')
  }

  const togglePaymentMethod = (row) => {
    setPaymentMethods((currentMethods) => ({
      ...currentMethods,
      [row.key]: !currentMethods[row.key],
    }))
    setSaved(false)
    setFeedback(`Moyen de paiement mis a jour : ${row.title}.`)
  }

  return (
    <div className="admin-layout">
      <AdminSidebar />

      <div className="admin-main">
        <AdminHeader />

        <main className="admin-dashboard settings-page">
          <section className="settings-page__breadcrumb">
            <span>Accueil</span>
            <ChevronRight size={14} strokeWidth={1.7} />
            <strong>Parametres</strong>
          </section>

          <section className="settings-page__heading">
            <h1>Parametres</h1>
            <p>
              Configurez votre boutique, vos preferences et votre securite.
            </p>
          </section>

          {loading && !feedback ? (
            <p className="admin-local-notice">Chargement des parametres...</p>
          ) : null}

          {feedback ? <p className="admin-local-notice">{feedback}</p> : null}

          <section className="settings-grid">
            <div className="settings-main-column">
              <div className="dashboard-card settings-card settings-store-card">
                <SettingsCardHeader
                  icon={Store}
                  title="Informations de la boutique"
                  subtitle="Ces informations seront visibles par vos clients."
                />

                <div className="settings-form-grid">
                  <label>
                    <span>Nom de la boutique</span>
                    <input
                      value={storeSettings.storeName}
                      onChange={(event) =>
                        updateStoreSetting(
                          'storeName',
                          event.target.value,
                        )
                      }
                    />
                  </label>

                  <label>
                    <span>Email</span>
                    <input
                      type="email"
                      value={storeSettings.email}
                      onChange={(event) =>
                        updateStoreSetting(
                          'email',
                          event.target.value,
                        )
                      }
                    />
                  </label>

                  <label>
                    <span>Telephone</span>
                    <input
                      value={storeSettings.phone}
                      onChange={(event) =>
                        updateStoreSetting(
                          'phone',
                          event.target.value,
                        )
                      }
                    />
                  </label>

                  <label>
                    <span>Adresse</span>
                    <textarea
                      value={storeSettings.address}
                      onChange={(event) =>
                        updateStoreSetting(
                          'address',
                          event.target.value,
                        )
                      }
                    />
                  </label>

                  <label>
                    <span>Devise</span>
                    <select
                      value={storeSettings.currency}
                      onChange={(event) =>
                        updateStoreSetting(
                          'currency',
                          event.target.value,
                        )
                      }
                    >
                      <option>DH (Dirham marocain)</option>
                      <option>EUR</option>
                      <option>USD</option>
                    </select>
                  </label>

                  <label>
                    <span>Langue</span>
                    <select
                      value={storeSettings.language}
                      onChange={(event) =>
                        updateStoreSetting(
                          'language',
                          event.target.value,
                        )
                      }
                    >
                      <option>Francais</option>
                      <option>Anglais</option>
                      <option>Arabe</option>
                    </select>
                  </label>
                </div>
              </div>

              <div className="dashboard-card settings-card settings-security-card">
                <SettingsCardHeader
                  icon={Lock}
                  title="Securite du compte"
                  subtitle="Securisez votre compte administrateur."
                />

                <div className="settings-list">
                  {securityRows.map((row) => {
                    const Icon = row.icon

                    return (
                      <button
                        type="button"
                        className="settings-list-row"
                        key={row.title}
                        onClick={() => openSecurityPanel(row.title)}
                      >
                        <Icon size={25} strokeWidth={1.8} />

                        <span>
                          <strong>{row.title}</strong>
                          <em>{row.detail}</em>
                        </span>

                        {row.badge ? (
                          <small>{row.badge}</small>
                        ) : null}

                        <ChevronRight size={18} strokeWidth={1.7} />
                      </button>
                    )
                  })}
                </div>

                <button
                  type="button"
                  className="settings-dark-button"
                  onClick={() => openSecurityPanel('Mot de passe')}
                >
                  <Lock size={17} strokeWidth={1.8} />
                  <span>Mettre a jour le mot de passe</span>
                </button>
              </div>
            </div>

            <div className="settings-main-column">
              <div className="dashboard-card settings-card settings-preferences-card">
                <SettingsCardHeader
                  icon={SettingsIcon}
                  title="Preferences generales"
                  subtitle="Personnalisez le fonctionnement de votre boutique."
                />

                <div className="settings-preferences-list">
                  <div>
                    <Mail size={25} strokeWidth={1.8} />
                    <span>
                      <strong>Notifications par email</strong>
                      <em>
                        Recevoir des notifications sur les commandes,
                        les clients et les activites importantes.
                      </em>
                    </span>
                    <Toggle
                      checked={preferences.emailNotifications}
                      label="Notifications par email"
                      onChange={() =>
                        updatePreference('emailNotifications')
                      }
                    />
                  </div>

                  <div>
                    <Wrench size={25} strokeWidth={1.8} />
                    <span>
                      <strong>Mode maintenance</strong>
                      <em>
                        Mettre temporairement votre boutique hors ligne.
                      </em>
                    </span>
                    <Toggle
                      checked={preferences.maintenanceMode}
                      label="Mode maintenance"
                      onChange={() =>
                        updatePreference('maintenanceMode')
                      }
                    />
                  </div>

                  <div>
                    <Package size={25} strokeWidth={1.8} />
                    <span>
                      <strong>Affichage des stocks</strong>
                      <em>
                        Afficher le niveau de stock aux clients.
                      </em>
                    </span>
                    <Toggle
                      checked={preferences.stockDisplay}
                      label="Affichage des stocks"
                      onChange={() =>
                        updatePreference('stockDisplay')
                      }
                    />
                  </div>

                  <label className="settings-timezone-row">
                    <Globe2 size={25} strokeWidth={1.8} />
                    <span>Fuseau horaire</span>
                    <select
                      value={preferences.timezone}
                      onChange={(event) => {
                        setPreferences((currentPreferences) => ({
                          ...currentPreferences,
                          timezone: event.target.value,
                        }))
                        setSaved(false)
                      }}
                    >
                      <option>Maroc (GMT+1)</option>
                      <option>Europe/Paris (GMT+2)</option>
                      <option>UTC</option>
                    </select>
                  </label>
                </div>
              </div>

              <div className="dashboard-card settings-card settings-shipping-card">
                <SettingsCardHeader
                  icon={Truck}
                  title="Expedition et livraison"
                  subtitle="Configurez vos options de livraison."
                />

                <div className="settings-shipping-list">
                  <div>
                    <ShieldCheck size={24} strokeWidth={1.8} />
                    <span>
                      <strong>Livraison standard</strong>
                      <em>2 a 5 jours ouvres</em>
                    </span>
                    <label>
                      <input
                        value={shipping.standard}
                        onChange={(event) =>
                          updateShipping(
                            'standard',
                            event.target.value,
                          )
                        }
                      />
                      <small>DH</small>
                    </label>
                  </div>

                  <div>
                    <ShieldCheck size={24} strokeWidth={1.8} />
                    <span>
                      <strong>Livraison express</strong>
                      <em>24 a 48 heures</em>
                    </span>
                    <label>
                      <input
                        value={shipping.express}
                        onChange={(event) =>
                          updateShipping(
                            'express',
                            event.target.value,
                          )
                        }
                      />
                      <small>DH</small>
                    </label>
                  </div>

                  <div>
                    <Gift size={24} strokeWidth={1.8} />
                    <span>
                      <strong>Livraison gratuite des</strong>
                      <em>Montant minimum de commande</em>
                    </span>
                    <label>
                      <input
                        value={shipping.freeFrom}
                        onChange={(event) =>
                          updateShipping(
                            'freeFrom',
                            event.target.value,
                          )
                        }
                      />
                      <small>DH</small>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <aside className="settings-side-column">
              <div className="dashboard-card settings-card settings-support-card">
                <SettingsCardHeader
                  icon={Database}
                  title="Sauvegarde & support"
                  subtitle="Gerez vos donnees et accedez a l assistance."
                />

                <div className="settings-support-list">
                  {supportItems.map((item) => {
                    const Icon = item.icon

                    return (
                      <div key={item.title}>
                        <Icon size={27} strokeWidth={1.7} />

                        <span>
                          <strong>{item.title}</strong>
                          <em>{item.detail}</em>
                        </span>

                        {item.badge ? (
                          <small>{item.badge}</small>
                        ) : null}

                        {item.copy ? (
                          <button
                            type="button"
                            onClick={copyApiKey}
                            aria-label="Copier l information API"
                          >
                            <Copy
                              size={18}
                              strokeWidth={1.7}
                            />
                          </button>
                        ) : null}

                        {item.arrow ? (
                          <button
                            type="button"
                            aria-label="Ouvrir le centre d aide"
                            onClick={openHelpCenter}
                          >
                            <ChevronRight
                              size={19}
                              strokeWidth={1.7}
                            />
                          </button>
                        ) : null}
                      </div>
                    )
                  })}
                </div>

                <button
                  type="button"
                  className="settings-dark-button"
                  onClick={saveSettings}
                  disabled={isSaving}
                >
                  <Save size={17} strokeWidth={1.8} />
                  <span>
                    {isSaving ? 'Enregistrement...' : 'Enregistrer les modifications'}
                  </span>
                </button>

                <button
                  type="button"
                  className="settings-reset-button"
                  onClick={resetSettings}
                  disabled={isSaving}
                >
                  <RefreshCcw size={17} strokeWidth={1.8} />
                  <span>Reinitialiser</span>
                </button>

                <p className="settings-reset-note">
                  Cette action restaure les parametres par defaut en base.
                </p>

                {saved ? (
                  <p className="settings-save-note">
                    Modifications enregistrees en base.
                  </p>
                ) : null}
              </div>

              <div className="dashboard-card settings-card settings-payments-card">
                <SettingsCardHeader
                  icon={CreditCard}
                  title="Paiements"
                  subtitle="Gerez les moyens de paiement acceptes."
                />

                <div className="settings-payment-list">
                  {paymentRows.map((row) => {
                    const Icon = row.icon

                    return (
                      <button
                        className="settings-payment-row"
                        type="button"
                        key={row.key}
                        onClick={() => togglePaymentMethod(row)}
                      >
                        {row.type === 'paypal' ? (
                          <span className="settings-paypal-icon">
                            P
                          </span>
                        ) : (
                          <Icon
                            size={24}
                            strokeWidth={1.8}
                          />
                        )}

                        <span>
                          <strong>{row.title}</strong>
                          <em>{row.detail}</em>
                        </span>

                        <small>
                          {paymentMethods[row.key] ? 'Actif' : 'Inactif'}
                        </small>
                        <ChevronRight
                          size={18}
                          strokeWidth={1.7}
                        />
                      </button>
                    )
                  })}
                </div>
              </div>
            </aside>
          </section>
        </main>
      </div>
    </div>
  )
}
