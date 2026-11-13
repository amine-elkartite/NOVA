import {
  Heart,
  Search,
  ShoppingBag,
  UserRound,
} from 'lucide-react'

import {
  Link,
  useLocation,
} from 'react-router-dom'



function Footer() {
  const location = useLocation()
  const currentYear = new Date().getFullYear()

  const handleScrollTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  const isActive = (path) =>
    location.pathname === path


  return (
    <footer className="nova-footer">

      <div className="nova-footer-main">

        <div className="nova-footer-container">

          {/* BRAND */}

          <div className="nova-footer-brand">

            <Link
              to="/"
              className="nova-footer-logo"
              onClick={handleScrollTop}
            >
              NOVA
            </Link>

            <p className="nova-footer-description">
              Une sélection pensée pour un style
              moderne, élégant et intemporel.
            </p>

            <p className="nova-footer-signature">
              Votre style, votre NOVA.
            </p>

          </div>


          {/* BOUTIQUE */}

          <div className="nova-footer-column">

            <h3>Boutique</h3>

            <nav className="nova-footer-links">

              <Link
                to="/"
                className={isActive('/') ? 'active' : ''}
                onClick={handleScrollTop}
              >
                Accueil
              </Link>

              <Link
                to="/nouveautes"
                className={
                  isActive('/nouveautes')
                    ? 'active'
                    : ''
                }
                onClick={handleScrollTop}
              >
                Nouveautés
              </Link>

              <Link
                to="/femme"
                className={
                  isActive('/femme')
                    ? 'active'
                    : ''
                }
                onClick={handleScrollTop}
              >
                Femme
              </Link>

              <Link
                to="/homme"
                className={
                  isActive('/homme')
                    ? 'active'
                    : ''
                }
                onClick={handleScrollTop}
              >
                Homme
              </Link>

              <Link
                to="/accessoires"
                className={
                  isActive('/accessoires')
                    ? 'active'
                    : ''
                }
                onClick={handleScrollTop}
              >
                Accessoires
              </Link>

            </nav>

          </div>


          {/* COMPTE */}

          <div className="nova-footer-column">

            <h3>Mon compte</h3>

            <nav className="nova-footer-links">

              <Link
                to="/mon-compte"
                onClick={handleScrollTop}
              >
                Mon profil
              </Link>

              <Link
                to="/mon-compte/commandes"
                onClick={handleScrollTop}
              >
                Mes commandes
              </Link>

              <Link
                to="/mon-compte/adresses"
                onClick={handleScrollTop}
              >
                Mes adresses
              </Link>

              <Link
                to="/mon-compte/favoris"
                onClick={handleScrollTop}
              >
                Mes favoris
              </Link>

              <Link
                to="/mon-compte/securite"
                onClick={handleScrollTop}
              >
                Sécurité
              </Link>

            </nav>

          </div>


          {/* ACCÈS RAPIDE */}

          <div className="nova-footer-column">

            <h3>Accès rapide</h3>

            <nav className="nova-footer-links">

              <Link
                to="/recherche"
                onClick={handleScrollTop}
              >
                <Search size={15} />
                <span>Recherche</span>
              </Link>

              <Link
                to="/panier"
                onClick={handleScrollTop}
              >
                <ShoppingBag size={15} />
                <span>Mon panier</span>
              </Link>

              <Link
                to="/mon-compte/favoris"
                onClick={handleScrollTop}
              >
                <Heart size={15} />
                <span>Mes favoris</span>
              </Link>

              <Link
                to="/connexion"
                onClick={handleScrollTop}
              >
                <UserRound size={15} />
                <span>Connexion</span>
              </Link>

              <Link
                to="/inscription"
                onClick={handleScrollTop}
              >
                Créer un compte
              </Link>

            </nav>

          </div>

        </div>

      </div>


      <div className="nova-footer-bottom">

        <div className="nova-footer-bottom-inner">

          <p className="nova-footer-copyright">
            © {currentYear} NOVA — Designed &amp; Developed by{' '}
            <strong>Amine ELKARTITE</strong>. All rights reserved.
          </p>

          <button
            type="button"
            className="nova-footer-top"
            onClick={handleScrollTop}
          >
            Retour en haut
          </button>

        </div>

      </div>

    </footer>
  )
}


export default Footer
