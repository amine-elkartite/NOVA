import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Heart,
} from 'lucide-react'

import AccountSidebar from '../../components/layout/AccountSidebar.jsx'
import { useWishlist } from '../../context/WishlistContext.jsx'

function Favorites() {
  const {
    favoriteProducts,
    removeFavorite,
  } = useWishlist()

  const handleRemoveFavorite = async (
    product,
  ) => {
    try {
      await removeFavorite(product)
    } catch (error) {
      console.error(
        'Erreur suppression favori:',
        error,
      )
    }
  }

  return (
    <main className="favorites-page">
      <section className="account-hero">
        <div className="nova-container">
          <h1>Mes favoris</h1>

          <p>
            Retrouvez vos coups de cœur en un seul endroit.
          </p>
        </div>
      </section>

      <div className="nova-container">
        <nav className="account-breadcrumb">
          <Link to="/">
            Accueil
          </Link>

          <span>/</span>

          <Link to="/mon-compte">
            Mon compte
          </Link>

          <span>/</span>

          <span>
            Mes favoris
          </span>
        </nav>

        <div className="account-layout">
          <AccountSidebar />

          <div className="favorites-content">
            <div className="favorites-heading-row">
              <h2>
                {favoriteProducts.length}{' '}
                articles favoris
              </h2>

              <Link
                to="/nouveautes"
                className="favorites-continue-link"
              >
                Continuer mes achats

                <ArrowRight
                  size={16}
                />
              </Link>
            </div>

            {favoriteProducts.length > 0 ? (
              <div className="favorites-grid">
                {favoriteProducts.map(
                  (product) => (
                    <article
                      key={
                        product.databaseId ||
                        product.id
                      }
                      className="favorite-card"
                    >
                      <div className="favorite-image-wrap">
                        <Link
                          to={`/produit/${product.id}`}
                        >
                          <img
                            src={
                              product.image
                            }
                            alt={
                              product.imageAlt ||
                              product.name
                            }
                          />
                        </Link>

                        <button
                          type="button"
                          className="favorite-heart-button"
                          onClick={() =>
                            handleRemoveFavorite(
                              product,
                            )
                          }
                          aria-label={`Supprimer ${product.name} des favoris`}
                        >
                          <Heart
                            size={21}
                            fill="currentColor"
                          />
                        </button>
                      </div>

                      <div className="favorite-card-info">
                        <Link
                          to={`/produit/${product.id}`}
                          className="favorite-product-name"
                        >
                          {product.name}
                        </Link>

                        <div className="favorite-price-stock">
                          <strong>
                            {product.price}
                          </strong>

                          {Number(
                            product.stock ||
                              0,
                          ) > 0 ? (
                            <span>
                              <i />
                              En stock
                            </span>
                          ) : (
                            <span>
                              Rupture de
                              stock
                            </span>
                          )}
                        </div>

                        {Number(
                          product.stock ||
                            0,
                        ) > 0 ? (
                          <Link
                            to={`/produit/${product.id}`}
                            className="favorite-cart-button"
                          >
                            Choisir les
                            options
                          </Link>
                        ) : (
                          <button
                            type="button"
                            className="favorite-cart-button"
                            disabled
                          >
                            Indisponible
                          </button>
                        )}
                      </div>
                    </article>
                  ),
                )}
              </div>
            ) : (
              <div className="favorites-empty">
                <Heart
                  size={38}
                  strokeWidth={1.3}
                />

                <h3>
                  Aucun favori
                </h3>

                <p>
                  Vous n'avez encore
                  ajouté aucun article
                  à vos favoris.
                </p>

                <Link to="/nouveautes">
                  Découvrir les
                  nouveautés
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

export default Favorites