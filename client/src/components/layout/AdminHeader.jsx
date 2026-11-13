import {
  Search,
  Bell,
  ChevronDown,
  Check,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import useAuth from '../../hooks/useAuth.js'
import {
  adminProfileChangedEvent,
  fetchAdminProfile,
  getAdminNotifications,
  getAdminProfile,
  markAdminNotificationsRead,
  searchAdmin,
} from '../../services/adminService.js'

export default function AdminHeader({
  searchPlaceholder = 'Rechercher une commande, un produit, un client...',
}) {
  const navigate = useNavigate()
  const panelRef = useRef(null)
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [profile, setProfile] = useState(() => getAdminProfile(user))
  const [notifications, setNotifications] = useState([])
  const [results, setResults] = useState([])
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)

  useEffect(() => {
    const handleProfileChange = (event) => {
      setProfile(event.detail || getAdminProfile(user))
    }

    window.addEventListener(adminProfileChangedEvent, handleProfileChange)

    return () => {
      window.removeEventListener(
        adminProfileChangedEvent,
        handleProfileChange,
      )
    }
  }, [user])

  useEffect(() => {
    let isActive = true

    setProfile(getAdminProfile(user))

    async function loadProfile() {
      try {
        const nextProfile = await fetchAdminProfile()

        if (isActive) {
          setProfile(nextProfile)
        }
      } catch {
        // Auth interceptor handles invalid sessions.
      }
    }

    loadProfile()

    return () => {
      isActive = false
    }
  }, [user])

  useEffect(() => {
    let isActive = true

    async function loadNotifications() {
      try {
        const data = await getAdminNotifications()

        if (isActive) {
          setNotifications(data.notifications)
        }
      } catch {
        if (isActive) {
          setNotifications([])
        }
      }
    }

    loadNotifications()

    return () => {
      isActive = false
    }
  }, [])

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target)
      ) {
        setIsNotificationOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [])

  useEffect(() => {
    const normalizedQuery = query.trim().toLowerCase()

    if (!normalizedQuery) {
      setResults([])
      return undefined
    }

    if (normalizedQuery.length < 2) {
      setResults([])
      return undefined
    }

    let isActive = true
    const timeoutId = window.setTimeout(async () => {
      try {
        const nextResults = await searchAdmin(normalizedQuery)

        if (isActive) {
          setResults(nextResults)
        }
      } catch {
        if (isActive) {
          setResults([])
        }
      }
    }, 250)

    return () => {
      isActive = false
      window.clearTimeout(timeoutId)
    }
  }, [query])

  const unreadCount = notifications.filter(
    (notification) => notification.unread,
  ).length

  const submitSearch = (event) => {
    event.preventDefault()

    if (results[0]) {
      navigate(results[0].to)
      setQuery('')
    }
  }

  const openResult = (to) => {
    navigate(to)
    setQuery('')
  }

  const markAllRead = async () => {
    try {
      const data = await markAdminNotificationsRead([], true)

      setNotifications(data.notifications)
    } catch {
      setNotifications((currentNotifications) =>
        currentNotifications.map((notification) => ({
          ...notification,
          unread: false,
        })),
      )
    }
  }

  const openNotification = async (notification) => {
    try {
      const data = await markAdminNotificationsRead([
        notification.key || notification.id,
      ])

      setNotifications(data.notifications)
    } catch {
      setNotifications((currentNotifications) =>
        currentNotifications.map((item) =>
          item.id === notification.id
            ? {
                ...item,
                unread: false,
              }
            : item,
        ),
      )
    }

    if (notification.to) {
      navigate(notification.to)
      setIsNotificationOpen(false)
    }
  }

  return (
    <header className="admin-header">
      <form
        className="admin-header__search"
        onSubmit={submitSearch}
      >
        <Search size={19} strokeWidth={1.8} />
        <input
          type="search"
          value={query}
          placeholder={searchPlaceholder}
          onChange={(event) => setQuery(event.target.value)}
        />

        {results.length > 0 ? (
          <div className="admin-header__search-results">
            {results.slice(0, 5).map((result) => (
              <button
                key={result.to}
                type="button"
                onClick={() => openResult(result.to)}
              >
                {result.label}
              </button>
            ))}
          </div>
        ) : null}
      </form>

      <div className="admin-header__right">
        <div
          className="admin-header__notification-wrap"
          ref={panelRef}
        >
          <button
            className="admin-header__notification"
            type="button"
            aria-label="Notifications"
            aria-expanded={isNotificationOpen}
            onClick={() =>
              setIsNotificationOpen((isOpen) => !isOpen)
            }
          >
            <Bell size={20} strokeWidth={1.8} />
            {unreadCount > 0 ? (
              <span className="admin-header__notification-dot">
                {unreadCount}
              </span>
            ) : null}
          </button>

          {isNotificationOpen ? (
            <div className="admin-header__notification-panel">
              <div className="admin-header__notification-heading">
                <strong>Notifications</strong>
                <button type="button" onClick={markAllRead}>
                  <Check size={14} />
                  Tout lu
                </button>
              </div>

              {notifications.length > 0 ? notifications.map((notification) => (
                <button
                  type="button"
                  className={
                    notification.unread ? 'is-unread' : ''
                  }
                  key={notification.id}
                  onClick={() => openNotification(notification)}
                >
                  <strong>{notification.title}</strong>
                  <span>{notification.detail}</span>
                </button>
              )) : (
                <button type="button">
                  <strong>Aucune notification</strong>
                  <span>Tout est a jour.</span>
                </button>
              )}
            </div>
          ) : null}
        </div>

        <span className="admin-header__divider" />

        <Link
          className="admin-header__profile"
          to="/admin/profil"
          aria-label="Ouvrir le profil administrateur"
        >
          <div className="admin-header__avatar">
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt={profile.fullName} />
            ) : (
              <span>{profile.initials}</span>
            )}
          </div>

          <div className="admin-header__profile-text">
            <strong>{profile.fullName}</strong>
            <span>{profile.role}</span>
          </div>

          <ChevronDown size={17} strokeWidth={1.8} />
        </Link>
      </div>
    </header>
  )
}
