import { NavLink } from 'react-router-dom'

const navItems = [
  { label: 'Accueil', to: '/' },
  { label: 'Nouveautés', to: '/nouveautes' },
  { label: 'Homme', to: '/homme' },
  { label: 'Femme', to: '/femme' },
  { label: 'Accessoires', to: '/accessoires' },
]

function Navbar({ isOpen = false, onNavigate }) {
  return (
    <nav className={`main-nav ${isOpen ? 'is-open' : ''}`} aria-label="Navigation principale">
      {navItems.map((item) => (
        <NavLink
          className={({ isActive }) => `nav-link ${isActive ? 'is-active' : ''}`}
          end={item.to === '/'}
          key={item.label}
          onClick={onNavigate}
          to={item.to}
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}

export default Navbar