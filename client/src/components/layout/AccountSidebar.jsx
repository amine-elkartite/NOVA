import {
  NavLink,
  useNavigate,
} from 'react-router-dom'

import {
  UserRound,
  ClipboardList,
  MapPin,
  Heart,
  LockKeyhole,
  LogOut,
} from 'lucide-react'

import useAuth from '../../hooks/useAuth.js'


const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  'http://localhost:5000/api'

const SERVER_BASE_URL =
  API_BASE_URL.replace(
    /\/api\/?$/,
    '',
  )


function getAvatarSource(
  avatarUrl,
) {
  if (!avatarUrl) {
    return ''
  }

  if (
    avatarUrl.startsWith('http://') ||
    avatarUrl.startsWith('https://')
  ) {
    return avatarUrl
  }

  const normalizedPath =
    avatarUrl.startsWith('/')
      ? avatarUrl
      : `/${avatarUrl}`

  return `${SERVER_BASE_URL}${normalizedPath}`
}


function AccountSidebar() {
  const {
    logout,
    user,
  } = useAuth()

  const navigate =
    useNavigate()


  const navItems = [
    {
      label: 'Mon profil',
      to: '/mon-compte',
      icon: UserRound,
      end: true,
    },
    {
      label: 'Mes commandes',
      to: '/mon-compte/commandes',
      icon: ClipboardList,
    },
    {
      label: 'Mes adresses',
      to: '/mon-compte/adresses',
      icon: MapPin,
    },
    {
      label: 'Mes favoris',
      to: '/mon-compte/favoris',
      icon: Heart,
    },
    {
      label: 'Sécurité',
      to: '/mon-compte/securite',
      icon: LockKeyhole,
    },
  ]


  const firstName =
    user?.firstName ||
    user?.first_name ||
    ''

  const lastName =
    user?.lastName ||
    user?.last_name ||
    ''

  const initials = [
    firstName,
    lastName,
  ]
    .filter(Boolean)
    .map((name) => name[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()


  const displayName =
    firstName ||
    'Compte'


  const avatarUrl =
    user?.avatarUrl ||
    user?.avatar_url ||
    null


  const avatarSource =
    getAvatarSource(
      avatarUrl,
    )


  const handleLogout = () => {
    logout()

    navigate(
      '/connexion',
      {
        replace: true,
      },
    )
  }


  return (
    <aside className="account-sidebar">

      <div className="account-user">

        <div className="account-avatar">

          {avatarSource ? (
            <img
              src={avatarSource}
              alt={`Photo de ${displayName}`}
            />
          ) : (
            initials || 'NV'
          )}

        </div>


        <strong>
          {displayName}
        </strong>

      </div>


      <nav
        className="account-sidebar-nav"
        aria-label="Navigation du compte"
      >

        {navItems.map(
          (item) => {
            const Icon =
              item.icon

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({
                  isActive,
                }) =>
                  `account-sidebar-link ${
                    isActive
                      ? 'active'
                      : ''
                  }`
                }
              >
                <Icon
                  size={22}
                  strokeWidth={1.6}
                />

                <span>
                  {item.label}
                </span>
              </NavLink>
            )
          },
        )}

      </nav>


      <div className="account-sidebar-divider" />


      <button
        type="button"
        className="account-logout-button"
        onClick={
          handleLogout
        }
      >

        <LogOut
          size={23}
          strokeWidth={1.6}
        />

        <span>
          Se déconnecter
        </span>

      </button>

    </aside>
  )
}


export default AccountSidebar