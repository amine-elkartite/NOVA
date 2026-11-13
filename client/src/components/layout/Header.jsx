import {
  useEffect,
  useRef,
  useState,
} from 'react'

import {
  Link,
  useNavigate,
} from 'react-router-dom'

import {
  ChevronDown,
  Menu,
  Search,
  ShoppingBag,
  UserRound,
  X,
} from 'lucide-react'

import Navbar from './Navbar.jsx'
import { useCart } from '../../context/CartContext.jsx'
import useAuth from '../../hooks/useAuth.js'


function Header() {
  const [
    isMenuOpen,
    setIsMenuOpen,
  ] = useState(false)

  const [
    isSearchOpen,
    setIsSearchOpen,
  ] = useState(false)

  const [
    isCountryOpen,
    setIsCountryOpen,
  ] = useState(false)

  const [
    searchTerm,
    setSearchTerm,
  ] = useState('')

  const searchInputRef =
    useRef(null)

  const navigate =
    useNavigate()

  const {
    itemCount,
  } = useCart()

  const {
    isAuthenticated,
  } = useAuth()


  useEffect(() => {
    if (isSearchOpen) {
      searchInputRef.current?.focus()
    }
  }, [isSearchOpen])


  const closeMenu = () => {
    setIsMenuOpen(false)
    setIsCountryOpen(false)
  }


  const handleSearchSubmit = (
    event,
  ) => {
    event.preventDefault()

    if (!isSearchOpen) {
      setIsSearchOpen(true)
      return
    }

    const query =
      searchTerm.trim()

    const path = query
      ? `/recherche?q=${encodeURIComponent(query)}`
      : '/recherche'

    navigate(path)
    closeMenu()
  }


  return (
    <header className="site-header">

      {/* =========================
          ANNOUNCEMENT BAR
      ========================= */}

      <div className="announcement-bar">
        <div className="nova-container announcement-inner">

          <p>
            L'ÉLÉGANCE AU QUOTIDIEN
            &nbsp;&nbsp;|&nbsp;&nbsp;
            LIVRAISON OFFERTE DÈS 600 DH D'ACHAT
          </p>


          <div className="country-selector-wrap">

            <button
              className="country-selector"
              type="button"
              aria-label="Changer le pays"
              aria-expanded={
                isCountryOpen
              }
              onClick={() =>
                setIsCountryOpen(
                  (current) =>
                    !current,
                )
              }
            >
              MAROC (DH)

              <ChevronDown
                size={10}
                strokeWidth={1.7}
              />
            </button>


            {isCountryOpen ? (
              <div
                className="country-selector-menu"
                role="menu"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() =>
                    setIsCountryOpen(
                      false,
                    )
                  }
                >
                  Maroc (DH)
                </button>
              </div>
            ) : null}

          </div>

        </div>
      </div>


      {/* =========================
          MAIN HEADER
      ========================= */}

      <div className="main-header">

        <div className="nova-container header-inner">

          {/* LOGO */}

          <Link
            className="brand-logo"
            to="/"
            aria-label="NOVA accueil"
            onClick={closeMenu}
          >
            NOVA
          </Link>


          {/* NAVIGATION */}

          <Navbar
            isOpen={isMenuOpen}
            onNavigate={closeMenu}
          />


          {/* ACTIONS */}

          <div className="header-actions">


            {/* SEARCH */}

            <form
              className={`header-search ${
                isSearchOpen
                  ? 'is-open'
                  : ''
              }`}
              onSubmit={
                handleSearchSubmit
              }
            >

              {isSearchOpen ? (
                <input
                  ref={searchInputRef}
                  type="search"
                  value={searchTerm}
                  onChange={(event) =>
                    setSearchTerm(
                      event.target.value,
                    )
                  }
                  onBlur={() => {
                    if (
                      !searchTerm.trim()
                    ) {
                      setIsSearchOpen(
                        false,
                      )
                    }
                  }}
                  placeholder="Rechercher un produit..."
                  aria-label="Rechercher un produit"
                />
              ) : null}


              <button
                className="icon-button header-search-button"
                type="submit"
                aria-label="Rechercher"
              >
                <Search
                  size={20}
                  strokeWidth={1.65}
                />
              </button>

            </form>


            {/* PROFILE */}

            <Link
              to={
                isAuthenticated
                  ? '/mon-compte'
                  : '/connexion'
              }
              className="icon-button account-action"
              aria-label="Mon compte"
              onClick={closeMenu}
            >
              <UserRound
                size={19}
                strokeWidth={1.65}
              />
            </Link>


            {/* CART */}

            <Link
              to="/panier"
              className="icon-button bag-button"
              aria-label={`Panier, ${itemCount} article${
                itemCount > 1
                  ? 's'
                  : ''
              }`}
              onClick={closeMenu}
            >
              <ShoppingBag
                size={20}
                strokeWidth={1.65}
              />

              <span className="cart-badge">
                {itemCount}
              </span>
            </Link>


            {/* MOBILE MENU */}

            <button
              className="icon-button menu-toggle"
              type="button"
              aria-label={
                isMenuOpen
                  ? 'Fermer le menu'
                  : 'Ouvrir le menu'
              }
              aria-expanded={
                isMenuOpen
              }
              onClick={() =>
                setIsMenuOpen(
                  (current) =>
                    !current,
                )
              }
            >
              {isMenuOpen ? (
                <X
                  size={21}
                  strokeWidth={1.65}
                />
              ) : (
                <Menu
                  size={21}
                  strokeWidth={1.65}
                />
              )}
            </button>

          </div>

        </div>

      </div>

    </header>
  )
}


export default Header