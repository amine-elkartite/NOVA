import {
  BarChart3,
  Box,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Edit3,
  FileText,
  KeyRound,
  Laptop,
  Mail,
  MapPin,
  MessageSquare,
  Moon,
  Phone,
  ReceiptText,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Smartphone,
  Upload,
  UserRound,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import AdminHeader from '../../components/layout/AdminHeader.jsx'
import AdminSidebar from '../../components/layout/AdminSidebar.jsx'
import useAuth from '../../hooks/useAuth.js'
import {
  changePassword,
  disableTwoFactor,
  enableTwoFactor,
  getSessions,
  revokeOtherSessions,
  setupTwoFactor,
} from '../../services/authService.js'
import {
  fetchAdminProfile,
  getAdminAnalytics,
  getAdminApiErrorMessages,
  getAdminProfile,
  getAdminProfilePreferences,
  getMessageConversations,
  saveAdminProfile,
  saveAdminProfilePreferences,
  uploadAdminAvatar,
} from '../../services/adminService.js'

const defaultProfilePreferences = {
  email: true,
  sms: true,
  newsletter: true,
  darkMode: false,
  language: 'Francais',
  timezone: 'Maroc (GMT+1)',
}

function normalizeProfilePreferences(preferences = {}) {
  return {
    ...defaultProfilePreferences,
    ...preferences,
  }
}

function createProfileForm(profile) {
  return {
    firstName: profile.firstName || '',
    lastName: profile.lastName || '',
    email: profile.email || '',
    phone: profile.phone || '',
    role: profile.role || 'Administrateur',
    address: profile.address || '',
  }
}

function parseAddress(value, profile) {
  const lines = String(value || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  return {
    city: lines[0] || profile.city || '',
    country: lines[1] || profile.country || 'Maroc',
  }
}

function formatInteger(value) {
  return Number(value || 0).toLocaleString('fr-FR')
}

function formatSessionCount(sessions) {
  const count = sessions.length

  if (count === 0) {
    return 'Aucune'
  }

  return `${count} ${count > 1 ? 'sessions' : 'session'}`
}

function ProfileToggle({
  checked,
  onClick,
}) {
  return (
    <button
      className={
        checked ? 'admin-profile-toggle is-on' : 'admin-profile-toggle'
      }
      type="button"
      onClick={onClick}
      aria-pressed={checked}
    >
      <span />
    </button>
  )
}

function ProfileCard({
  icon: Icon,
  title,
  subtitle,
  children,
  className = '',
}) {
  return (
    <section className={`dashboard-card admin-profile-card ${className}`}>
      <div className="admin-profile-card__header">
        <div className="admin-profile-card__icon">
          <Icon size={22} strokeWidth={1.8} />
        </div>

        <div>
          <h2>{title}</h2>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
      </div>

      {children}
    </section>
  )
}

export default function AdminProfile() {
  const fileInputRef = useRef(null)
  const { user, updateUser } = useAuth()
  const [avatarPreview, setAvatarPreview] = useState('')
  const [profile, setProfile] = useState(() => getAdminProfile(user))
  const [profileForm, setProfileForm] = useState(() =>
    createProfileForm(getAdminProfile(user)),
  )
  const [preferences, setPreferences] = useState(defaultProfilePreferences)
  const [analytics, setAnalytics] = useState(null)
  const [messageStats, setMessageStats] = useState({})
  const [conversations, setConversations] = useState([])
  const [sessions, setSessions] = useState([])
  const [notice, setNotice] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    let isActive = true

    async function loadProfile() {
      const fallbackProfile = getAdminProfile(user)

      setProfile(fallbackProfile)
      setProfileForm(createProfileForm(fallbackProfile))

      const [
        profileResult,
        preferencesResult,
        analyticsResult,
        messagesResult,
        sessionsResult,
      ] = await Promise.allSettled([
        fetchAdminProfile(),
        getAdminProfilePreferences(),
        getAdminAnalytics('current_month'),
        getMessageConversations(),
        getSessions(),
      ])

      if (!isActive) {
        return
      }

      if (profileResult.status === 'fulfilled') {
        setProfile(profileResult.value)
        setProfileForm(createProfileForm(profileResult.value))
      } else {
        setNotice(getAdminApiErrorMessages(profileResult.reason).join(' '))
      }

      if (preferencesResult.status === 'fulfilled') {
        setPreferences(
          normalizeProfilePreferences(preferencesResult.value),
        )
      }

      if (analyticsResult.status === 'fulfilled') {
        setAnalytics(analyticsResult.value)
      }

      if (messagesResult.status === 'fulfilled') {
        setMessageStats(messagesResult.value.stats || {})
        setConversations(messagesResult.value.conversations || [])
      }

      if (sessionsResult.status === 'fulfilled') {
        setSessions(sessionsResult.value.sessions || [])
      }
    }

    loadProfile()

    return () => {
      isActive = false
    }
  }, [user])

  useEffect(
    () => () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview)
      }
    },
    [avatarPreview],
  )

  const twoFactorEnabled = Boolean(
    profile.raw?.twoFactorEnabled ??
      profile.raw?.two_factor_enabled ??
      user?.twoFactorEnabled ??
      user?.two_factor_enabled,
  )

  const activityItems = useMemo(() => {
    const orderActivity = (analytics?.latestOrders || [])
      .slice(0, 3)
      .map((order) => ({
        icon: ShoppingCart,
        title: `Commande ${order.id}`,
        description: `${order.customer} - ${order.status}`,
        time: order.date,
      }))

    const messageActivity = conversations
      .filter((conversation) => conversation.preview)
      .slice(0, 1)
      .map((conversation) => ({
        icon: MessageSquare,
        title: `Message de ${conversation.name}`,
        description: conversation.preview,
        time: conversation.time,
      }))

    const items = [
      ...messageActivity,
      ...orderActivity,
    ]

    if (items.length > 0) {
      return items
    }

    return [
      {
        icon: Clock3,
        title: 'Aucune activite recente',
        description: 'Aucune commande ou conversation recente en base.',
        time: 'Base de donnees',
      },
    ]
  }, [analytics, conversations])

  const statItems = useMemo(
    () => [
      {
        icon: ShoppingCart,
        label: 'Commandes du mois',
        value: formatInteger(analytics?.stats?.ordersCount),
        detail: 'Donnees commandes',
      },
      {
        icon: Box,
        label: 'Produits vendus',
        value: formatInteger(analytics?.stats?.productsSold),
        detail: 'Articles commandes',
      },
      {
        icon: Mail,
        label: 'Messages non lus',
        value: formatInteger(messageStats.unread),
        detail: `${formatInteger(messageStats.total)} conversations`,
      },
      {
        icon: Clock3,
        label: 'Sessions actives',
        value: formatSessionCount(sessions),
        detail: sessions.some((session) => session.isCurrent)
          ? 'Session actuelle incluse'
          : 'Backend auth',
        online: true,
      },
    ],
    [analytics, messageStats, sessions],
  )

  const securityRows = [
    {
      icon: KeyRound,
      title: 'Mot de passe',
      description: 'Changez votre mot de passe regulierement.',
      value: 'Modifier',
      action: 'password',
    },
    {
      icon: Smartphone,
      title: 'Authentification a deux facteurs',
      description: 'Securisez votre compte avec la 2FA.',
      value: twoFactorEnabled ? 'Activee' : 'Desactivee',
      success: twoFactorEnabled,
      action: 'two-factor',
    },
    {
      icon: Laptop,
      title: 'Sessions actives',
      description: 'Rechargez la liste des sessions connectees.',
      value: formatSessionCount(sessions),
      action: 'sessions',
    },
    {
      icon: ShieldCheck,
      title: 'Autres appareils',
      description: 'Deconnectez les autres sessions actives.',
      value: 'Revoquer',
      action: 'revoke-other-sessions',
    },
  ]

  const updateProfileField = (event) => {
    const { name, value } = event.target

    setProfileForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }))
    setNotice('')
  }

  const updatePreference = async (key, value) => {
    const nextPreferences = {
      ...preferences,
      [key]: value,
    }

    setPreferences(nextPreferences)
    setNotice('')

    try {
      const savedPreferences =
        await saveAdminProfilePreferences(nextPreferences)

      setPreferences(normalizeProfilePreferences(savedPreferences))
      setNotice('Preferences enregistrees en base.')
    } catch (error) {
      setNotice(getAdminApiErrorMessages(error).join(' '))
    }
  }

  const handleAvatarChange = async (event) => {
    const [file] = Array.from(event.target.files || [])

    if (!file || isUploading) {
      return
    }

    const previewUrl = URL.createObjectURL(file)

    setAvatarPreview((currentPreview) => {
      if (currentPreview) {
        URL.revokeObjectURL(currentPreview)
      }

      return previewUrl
    })
    setIsUploading(true)
    setNotice('')

    try {
      const nextProfile = await uploadAdminAvatar(file)

      setProfile(nextProfile)
      setProfileForm(createProfileForm(nextProfile))

      if (nextProfile.raw) {
        updateUser(nextProfile.raw)
      }

      setAvatarPreview('')
      setNotice('Photo de profil mise a jour en base.')
    } catch (error) {
      setNotice(getAdminApiErrorMessages(error).join(' '))
    } finally {
      setIsUploading(false)
      event.target.value = ''
    }
  }

  const saveProfile = async () => {
    if (isSaving) {
      return
    }

    if (!profileForm.firstName.trim() || !profileForm.lastName.trim()) {
      setNotice('Le prenom et le nom sont requis.')
      return
    }

    if (!profileForm.email.includes('@')) {
      setNotice('Veuillez saisir une adresse email valide.')
      return
    }

    const address = parseAddress(profileForm.address, profile)

    setIsSaving(true)
    setNotice('')

    try {
      const nextProfile = await saveAdminProfile({
        ...profile,
        ...profileForm,
        city: address.city,
        country: address.country,
      })

      setProfile(nextProfile)
      setProfileForm(createProfileForm(nextProfile))

      if (nextProfile.raw) {
        updateUser(nextProfile.raw)
      }

      setNotice('Profil mis a jour en base.')
    } catch (error) {
      setNotice(getAdminApiErrorMessages(error).join(' '))
    } finally {
      setIsSaving(false)
    }
  }

  const refreshSessions = async () => {
    const data = await getSessions()

    setSessions(data.sessions || [])
    return data.sessions || []
  }

  const handlePasswordChange = async () => {
    const currentPassword = window.prompt('Mot de passe actuel')

    if (currentPassword === null) {
      return
    }

    const newPassword = window.prompt('Nouveau mot de passe')

    if (newPassword === null) {
      return
    }

    try {
      const result = await changePassword(currentPassword, newPassword)

      await refreshSessions()
      setNotice(result.message || 'Mot de passe mis a jour.')
    } catch (error) {
      setNotice(getAdminApiErrorMessages(error).join(' '))
    }
  }

  const handleTwoFactor = async () => {
    try {
      if (twoFactorEnabled) {
        const currentPassword = window.prompt('Mot de passe actuel')

        if (currentPassword === null) {
          return
        }

        const code = window.prompt('Code 2FA a 6 chiffres')

        if (code === null) {
          return
        }

        const result = await disableTwoFactor(currentPassword, code)
        const nextUser = {
          ...(user || profile.raw || {}),
          twoFactorEnabled: false,
        }

        updateUser(nextUser)
        setProfile((currentProfile) => ({
          ...currentProfile,
          raw: nextUser,
        }))
        setNotice(result.message || '2FA desactivee.')
        return
      }

      const setup = await setupTwoFactor()
      const code = window.prompt(
        `Cle manuelle 2FA: ${setup.manualKey}\nSaisissez le code a 6 chiffres apres configuration.`,
      )

      if (code === null) {
        return
      }

      const result = await enableTwoFactor(code)
      const nextUser = {
        ...(user || profile.raw || {}),
        twoFactorEnabled: true,
      }

      updateUser(nextUser)
      setProfile((currentProfile) => ({
        ...currentProfile,
        raw: nextUser,
      }))
      setNotice(result.message || '2FA activee.')
    } catch (error) {
      setNotice(getAdminApiErrorMessages(error).join(' '))
    }
  }

  const handleSecurityAction = async (action) => {
    try {
      if (action === 'password') {
        await handlePasswordChange()
        return
      }

      if (action === 'two-factor') {
        await handleTwoFactor()
        return
      }

      if (action === 'sessions') {
        const nextSessions = await refreshSessions()

        setNotice(
          `${formatSessionCount(nextSessions)} chargees depuis le backend.`,
        )
        return
      }

      if (action === 'revoke-other-sessions') {
        const result = await revokeOtherSessions()
        await refreshSessions()
        setNotice(
          result.message ||
            `${formatInteger(result.revokedCount)} sessions revoquees.`,
        )
      }
    } catch (error) {
      setNotice(getAdminApiErrorMessages(error).join(' '))
    }
  }

  const showFullActivity = () => {
    setNotice('Activite affichee depuis les dernieres commandes et messages.')
  }

  const avatarUrl = avatarPreview || profile.avatarUrl

  return (
    <div className="admin-layout">
      <AdminSidebar />

      <div className="admin-main">
        <AdminHeader />

        <main className="admin-dashboard admin-profile-page">
          <section className="admin-profile-breadcrumb">
            <Link to="/admin">Accueil</Link>
            <ChevronRight size={14} strokeWidth={1.7} />
            <strong>Profil</strong>
          </section>

          <section className="admin-profile-heading">
            <h1>Mon profil</h1>
            <p>
              Gerez vos informations personnelles, votre compte et vos
              preferences.
            </p>
          </section>

          {notice ? (
            <div className="admin-profile-notice">{notice}</div>
          ) : null}

          <section className="admin-profile-grid">
            <ProfileCard
              icon={UserRound}
              title="Apercu du profil"
              className="admin-profile-overview-card"
            >
              <span className="admin-profile-verified">
                Compte verifie
                <CheckCircle2 size={15} strokeWidth={2} />
              </span>

              <div className="admin-profile-overview">
                <div className="admin-profile-avatar-large">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={profile.fullName} />
                  ) : (
                    <span>{profile.initials}</span>
                  )}
                </div>

                <div className="admin-profile-summary">
                  <strong>{profile.fullName}</strong>
                  <span>{profile.role}</span>

                  <div>
                    <Mail size={16} strokeWidth={1.8} />
                    <span>{profile.email || 'Email non renseigne'}</span>
                  </div>

                  <div>
                    <Phone size={16} strokeWidth={1.8} />
                    <span>{profile.phone || 'Telephone non renseigne'}</span>
                  </div>

                  <div>
                    <MapPin size={16} strokeWidth={1.8} />
                    <span>{profile.location || 'Localisation non renseignee'}</span>
                  </div>

                  <div>
                    <CalendarDays size={16} strokeWidth={1.8} />
                    <span>
                      {profile.memberSince
                        ? `Membre depuis le ${profile.memberSince}`
                        : 'Date de creation non renseignee'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="admin-profile-overview-actions">
                <button type="button" onClick={saveProfile} disabled={isSaving}>
                  <Edit3 size={16} strokeWidth={1.8} />
                  <span>{isSaving ? 'Enregistrement...' : 'Modifier le profil'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  <Upload size={16} strokeWidth={1.8} />
                  <span>{isUploading ? 'Envoi...' : 'Telecharger la photo'}</span>
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleAvatarChange}
                />
              </div>
            </ProfileCard>

            <ProfileCard
              icon={ReceiptText}
              title="Informations personnelles"
              subtitle="Mettez a jour vos informations personnelles."
            >
              <div className="admin-profile-form-grid">
                <label>
                  <span>Prenom</span>
                  <input
                    name="firstName"
                    value={profileForm.firstName}
                    onChange={updateProfileField}
                  />
                </label>

                <label>
                  <span>Nom</span>
                  <input
                    name="lastName"
                    value={profileForm.lastName}
                    onChange={updateProfileField}
                  />
                </label>

                <label className="admin-profile-form-grid__wide">
                  <span>Email</span>
                  <input
                    name="email"
                    type="email"
                    value={profileForm.email}
                    onChange={updateProfileField}
                  />
                </label>

                <label>
                  <span>Telephone</span>
                  <input
                    name="phone"
                    value={profileForm.phone}
                    onChange={updateProfileField}
                  />
                </label>

                <label>
                  <span>Poste</span>
                  <input
                    name="role"
                    value={profileForm.role}
                    readOnly
                  />
                </label>

                <label className="admin-profile-form-grid__wide">
                  <span>Adresse</span>
                  <textarea
                    name="address"
                    value={profileForm.address}
                    onChange={updateProfileField}
                  />
                </label>
              </div>

              <button
                className="admin-profile-save-button"
                type="button"
                onClick={saveProfile}
                disabled={isSaving}
              >
                {isSaving ? 'Enregistrement...' : 'Enregistrer les informations'}
              </button>
            </ProfileCard>

            <ProfileCard
              icon={Settings}
              title="Preferences du compte"
              subtitle="Personnalisez votre experience d'administration."
            >
              <div className="admin-profile-preferences">
                {[
                  [
                    'email',
                    Mail,
                    'Notifications par email',
                    'Recevoir des notifications sur les commandes, les clients et les activites importantes.',
                  ],
                  [
                    'sms',
                    MessageSquare,
                    'Notifications par SMS',
                    'Recevoir les alertes importantes par SMS.',
                  ],
                  [
                    'newsletter',
                    FileText,
                    'Newsletter interne',
                    'Recevoir les actualites et conseils de la plateforme.',
                  ],
                  [
                    'darkMode',
                    Moon,
                    'Mode sombre',
                    "Utiliser le theme sombre pour l'interface.",
                  ],
                ].map(([key, Icon, label, description]) => (
                  <div className="admin-profile-preference-row" key={key}>
                    <Icon size={20} strokeWidth={1.8} />
                    <div>
                      <strong>{label}</strong>
                      <span>{description}</span>
                    </div>
                    <ProfileToggle
                      checked={preferences[key]}
                      onClick={() =>
                        updatePreference(key, !preferences[key])
                      }
                    />
                  </div>
                ))}

                <label className="admin-profile-select-row">
                  <Settings size={20} strokeWidth={1.8} />
                  <span>Langue</span>
                  <select
                    value={preferences.language}
                    onChange={(event) =>
                      updatePreference('language', event.target.value)
                    }
                  >
                    <option>Francais</option>
                    <option>English</option>
                    <option>Arabic</option>
                  </select>
                </label>

                <label className="admin-profile-select-row">
                  <Clock3 size={20} strokeWidth={1.8} />
                  <span>Fuseau horaire</span>
                  <select
                    value={preferences.timezone}
                    onChange={(event) =>
                      updatePreference('timezone', event.target.value)
                    }
                  >
                    <option>Maroc (GMT+1)</option>
                    <option>UTC</option>
                    <option>Europe/Paris</option>
                  </select>
                </label>
              </div>
            </ProfileCard>

            <ProfileCard
              icon={ShieldCheck}
              title="Securite du compte"
              subtitle="Protegez votre compte et vos donnees."
            >
              <div className="admin-profile-security-list">
                {securityRows.map((row) => {
                  const Icon = row.icon

                  return (
                    <button
                      type="button"
                      key={row.title}
                      onClick={() => handleSecurityAction(row.action)}
                    >
                      <Icon size={23} strokeWidth={1.8} />
                      <div>
                        <strong>{row.title}</strong>
                        <span>{row.description}</span>
                      </div>
                      <small className={row.success ? 'is-success' : ''}>
                        {row.value}
                      </small>
                      <ChevronRight size={17} strokeWidth={1.7} />
                    </button>
                  )
                })}
              </div>
            </ProfileCard>

            <ProfileCard
              icon={Clock3}
              title="Activite recente"
              subtitle="Vos dernieres actions disponibles dans la base."
            >
              <div className="admin-profile-activity-list">
                {activityItems.map((item) => {
                  const Icon = item.icon

                  return (
                    <div key={`${item.title}-${item.time}`}>
                      <span className="admin-profile-activity-dot" />
                      <Icon size={20} strokeWidth={1.8} />
                      <div>
                        <strong>{item.title}</strong>
                        <span>{item.description}</span>
                      </div>
                      <small>{item.time}</small>
                    </div>
                  )
                })}
              </div>

              <button
                className="admin-profile-activity-button"
                type="button"
                onClick={showFullActivity}
              >
                Voir toute l'activite
                <ChevronRight size={15} strokeWidth={1.7} />
              </button>
            </ProfileCard>

            <ProfileCard
              icon={BarChart3}
              title="Statistiques du compte"
              subtitle="Votre activite en quelques chiffres."
            >
              <div className="admin-profile-stats-grid">
                {statItems.map((stat) => {
                  const Icon = stat.icon

                  return (
                    <div className="admin-profile-stat-mini" key={stat.label}>
                      <Icon size={22} strokeWidth={1.8} />
                      <div>
                        <span>{stat.label}</span>
                        <strong>{stat.value}</strong>
                        <small className={stat.online ? 'is-online' : ''}>
                          {stat.detail}
                        </small>
                      </div>
                    </div>
                  )
                })}
              </div>
            </ProfileCard>
          </section>
        </main>
      </div>
    </div>
  )
}
