import {
  Heart,
  Star,
} from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

import { useWishlist } from '../../context/WishlistContext.jsx'

function ProductCard({
  product,
  variant = 'default',
}) {
  const stars = Array.from(
    { length: 5 },
    (_, index) => index,
  )

  const [favoriteLoading, setFavoriteLoading] =
    useState(false)

  const isCatalog =
    variant === 'catalog'

  const {
    isFavorite,
    toggleFavorite,
  } = useWishlist()

  const favorite =
    isFavorite(product)

  const badgeLabel = isCatalog
    ? product.isNew
      ? 'Nouveau'
      : null
    : product.discount

  const productImage =
    String(product.image || '').trim()

  const handleFavoriteClick = async (
    event,
  ) => {
    event.preventDefault()
    event.stopPropagation()

    if (favoriteLoading) {
      return
    }

    const hasBackendId =
      Number.isInteger(Number(product.databaseId)) &&
      Number(product.databaseId) > 0

    if (!hasBackendId) {
      toast.error(
        'Favoris indisponibles hors connexion API pour ce produit.',
      )
      return
    }

    setFavoriteLoading(true)

    try {
      await toggleFavorite(product)
    } catch (error) {
      toast.error(
        error.message ||
          'Impossible de modifier les favoris.',
      )
    } finally {
      setFavoriteLoading(false)
    }
  }

  return (
    <article
      className={`product-card ${
        isCatalog
          ? 'product-card-catalog'
          : ''
      }`}
    >
      <div className="product-image-wrap">
        <Link
          to={`/produit/${product.id}`}
          className="product-card-image-link"
          aria-label={`Voir ${product.name}`}
        >
          {productImage ? (
            <img
              className="product-image"
              src={productImage}
              alt={
                product.imageAlt ||
                product.name
              }
              style={
                product.imagePosition
                  ? {
                      objectPosition:
                        product.imagePosition,
                    }
                  : undefined
              }
            />
          ) : (
            <div
              className="product-image-placeholder"
              aria-label={
                product.imageAlt ||
                product.name
              }
            >
              NOVA
            </div>
          )}
        </Link>

        {badgeLabel ? (
          <span
            className={
              isCatalog
                ? 'new-badge'
                : 'discount-badge'
            }
          >
            {badgeLabel}
          </span>
        ) : null}

        <button
          className={`favorite-button ${
            favorite
              ? 'is-active'
              : ''
          }`}
          type="button"
          aria-label={
            favorite
              ? `Retirer ${product.name} des favoris`
              : `Ajouter ${product.name} aux favoris`
          }
          disabled={favoriteLoading}
          onClick={handleFavoriteClick}
        >
          <Heart
            size={18}
            fill={
              favorite
                ? 'currentColor'
                : 'none'
            }
            strokeWidth={1.5}
          />
        </button>
      </div>

      <Link
        to={`/produit/${product.id}`}
        className="product-card-content-link"
      >
        <div className="product-info">
          <h3>{product.name}</h3>

          {product.description ? (
            <p>
              {product.description}
            </p>
          ) : null}

          {product.rating ? (
            <div
              className="rating-row"
              aria-label={`${
                product.rating
              } sur 5, ${
                product.reviews || 0
              } avis`}
            >
              <span
                className="stars"
                aria-hidden="true"
              >
                {stars.map(
                  (star) => (
                    <Star
                      key={star}
                      size={11}
                      fill={
                        star <
                        product.rating
                          ? 'currentColor'
                          : 'none'
                      }
                      strokeWidth={
                        star <
                        product.rating
                          ? 0
                          : 1
                      }
                    />
                  ),
                )}
              </span>

              <span>
                ({product.reviews || 0})
              </span>
            </div>
          ) : null}

          <div className="price-row">
            <span className="current-price">
              {product.price}
            </span>

            {product.oldPrice ? (
              <span className="old-price">
                {product.oldPrice}
              </span>
            ) : null}
          </div>
        </div>
      </Link>
    </article>
  )
}

export default ProductCard
