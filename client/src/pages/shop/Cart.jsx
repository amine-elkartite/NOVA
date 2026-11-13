import {
  ArrowRight,
  LockKeyhole,
  RefreshCw,
  Truck,
} from 'lucide-react'

import {
  Link,
} from 'react-router-dom'

import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import CartItem from '../../components/cart/CartItem.jsx'
import CartSummary from '../../components/cart/CartSummary.jsx'

import { useCart } from '../../context/CartContext.jsx'
import productService from '../../services/productService.js'

function Cart() {
  const {
    cartItems,
    subtotal,
    itemCount,

    increaseQuantity,
    decreaseQuantity,
    removeFromCart,

    appliedPromotion,
    discount,
    freeShipping,
    promoMessage,
    promoError,
    promoLoading,
    applyPromotion,
    totalAfterDiscount,
  } = useCart()

  const [
    databaseProducts,
    setDatabaseProducts,
  ] = useState([])

  const [
    recommendationsLoading,
    setRecommendationsLoading,
  ] = useState(true)

  const [
    recommendationsError,
    setRecommendationsError,
  ] = useState('')

  /* =========================================================
     PROMOTION
  ========================================================= */

  const handleApplyPromo = async (code) => {
    try {
      await applyPromotion(code)
    } catch {
      /*
        L'erreur est déjà gérée
        dans CartContext.
      */
    }
  }

  /* =========================================================
     LOAD PRODUCTS FROM DATABASE
  ========================================================= */

  useEffect(() => {
    let active = true

    async function loadProducts() {
      try {
        setRecommendationsLoading(true)
        setRecommendationsError('')

        const data =
          await productService.getProducts()

        if (!active) {
          return
        }

        const loadedProducts =
          Array.isArray(data?.products)
            ? data.products
            : []

        setDatabaseProducts(
          loadedProducts,
        )
      } catch (error) {
        if (!active) {
          return
        }

        setDatabaseProducts([])

        setRecommendationsError(
          error?.message ||
            'Impossible de charger les recommandations.',
        )
      } finally {
        if (active) {
          setRecommendationsLoading(
            false,
          )
        }
      }
    }

    loadProducts()

    return () => {
      active = false
    }
  }, [])

  /* =========================================================
     PRODUCTS ALREADY IN CART
  ========================================================= */

  const cartProductIds = useMemo(() => {
    return new Set(
      cartItems
        .map((item) =>
          Number(
            item.productId ??
              item.product_id ??
              item.databaseId,
          ),
        )
        .filter((id) =>
          Number.isInteger(id),
        ),
    )
  }, [cartItems])

  /* =========================================================
     DATABASE-FIRST RECOMMENDATIONS
  ========================================================= */

  const recommendations =
    useMemo(() => {
      return databaseProducts
        .filter((product) => {
          const productId =
            Number(product.id)

          if (
            !Number.isInteger(
              productId,
            )
          ) {
            return false
          }

          if (
            product.status !==
            'active'
          ) {
            return false
          }

          if (
            Number(product.stock) <=
            0
          ) {
            return false
          }

          if (
            cartProductIds.has(
              productId,
            )
          ) {
            return false
          }

          return true
        })
        .sort((a, b) => {
          if (
            Boolean(b.featured) !==
            Boolean(a.featured)
          ) {
            return (
              Number(
                Boolean(b.featured),
              ) -
              Number(
                Boolean(a.featured),
              )
            )
          }

          const aDate =
            new Date(
              a.created_at || 0,
            ).getTime() || 0

          const bDate =
            new Date(
              b.created_at || 0,
            ).getTime() || 0

          return bDate - aDate
        })
        .slice(0, 3)
        .map((product) => {
          const price =
            Number(product.price) || 0

          return {
            id: product.slug,

            slug: product.slug,

            databaseId:
              Number(product.id),

            name: product.name,

            price:
              `${price.toLocaleString(
                'fr-FR',
              )} DH`,

            priceValue: price,

            image:
              product.image_url || '',

            imageAlt:
              product.image_alt ||
              product.name,

            stock:
              Number(
                product.stock,
              ) || 0,

            categoryName:
              product.category_name ||
              '',

            categorySlug:
              product.category_slug ||
              '',

            gender:
              product.gender,

            brand:
              product.brand,

            featured:
              Boolean(
                product.featured,
              ),
          }
        })
    }, [
      databaseProducts,
      cartProductIds,
    ])

  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <main className="cart-page">
      <div className="nova-container">
        <nav className="cart-breadcrumb">
          <Link to="/">
            Accueil
          </Link>

          <span>›</span>

          <span>
            Mon panier
          </span>
        </nav>

        <div className="cart-layout">
          <div className="cart-left">
            <div className="cart-title">
              <h1>
                Mon panier
              </h1>

              <p>
                {itemCount}{' '}
                {itemCount > 1
                  ? 'articles'
                  : 'article'}{' '}
                dans votre panier
              </p>
            </div>

            {cartItems.length > 0 ? (
              <div className="cart-items">
                {cartItems.map(
                  (item) => (
                    <CartItem
                      key={
                        item.cartKey
                      }
                      item={item}
                      onIncrease={
                        increaseQuantity
                      }
                      onDecrease={
                        decreaseQuantity
                      }
                      onRemove={
                        removeFromCart
                      }
                    />
                  ),
                )}
              </div>
            ) : (
              <div className="cart-empty">
                <h2>
                  Votre panier est vide
                </h2>

                <p>
                  Découvrez la
                  collection NOVA et
                  ajoutez vos articles
                  préférés.
                </p>

                <Link to="/nouveautes">
                  Découvrir la
                  collection
                </Link>
              </div>
            )}

            <section className="cart-recommendations">
              <div className="cart-recommendations-heading">
                <h2>
                  Vous pourriez aussi
                  aimer
                </h2>

                <Link to="/nouveautes">
                  Voir tout

                  <ArrowRight
                    size={15}
                  />
                </Link>
              </div>

              {recommendationsLoading ? (
                <p className="cart-recommendations-status">
                  Chargement des
                  recommandations...
                </p>
              ) : null}

              {!recommendationsLoading &&
              recommendationsError ? (
                <p className="cart-recommendations-status">
                  {
                    recommendationsError
                  }
                </p>
              ) : null}

              {!recommendationsLoading &&
              !recommendationsError &&
              recommendations.length ===
                0 ? (
                <p className="cart-recommendations-status">
                  Aucun produit à
                  recommander pour le
                  moment.
                </p>
              ) : null}

              {!recommendationsLoading &&
              recommendations.length >
                0 ? (
                <div className="cart-recommendation-grid">
                  {recommendations.map(
                    (product) => (
                      <article
                        className="cart-recommendation-card"
                        key={
                          product.databaseId
                        }
                      >
                        <Link
                          to={`/produit/${product.slug}`}
                          className="cart-recommendation-image"
                        >
                          {product.image ? (
                            <img
                              src={
                                product.image
                              }
                              alt={
                                product.imageAlt
                              }
                            />
                          ) : (
                            <div
                              className="cart-recommendation-placeholder"
                              aria-label={
                                product.name
                              }
                            >
                              NOVA
                            </div>
                          )}
                        </Link>

                        <div className="cart-recommendation-content">
                          <Link
                            to={`/produit/${product.slug}`}
                          >
                            <h3>
                              {
                                product.name
                              }
                            </h3>
                          </Link>

                          <strong>
                            {
                              product.price
                            }
                          </strong>

                          <Link
                            to={`/produit/${product.slug}`}
                            className="cart-recommendation-options"
                          >
                            Choisir les
                            options
                          </Link>
                        </div>
                      </article>
                    ),
                  )}
                </div>
              ) : null}
            </section>
          </div>

          <CartSummary
            subtotal={subtotal}
            discount={discount}
            total={
              totalAfterDiscount
            }
            itemCount={itemCount}
            onApplyPromo={
              handleApplyPromo
            }
            appliedPromotion={
              appliedPromotion
            }
            promoMessage={
              promoMessage
            }
            promoError={
              promoError
            }
            promoLoading={
              promoLoading
            }
            freeShipping={
              freeShipping
            }
          />
        </div>
      </div>

      <section className="cart-bottom-services">
        <div className="nova-container cart-bottom-services-grid">
          <div>
            <Truck size={25} />

            <span>
              <strong>
                Livraison rapide
              </strong>

              Partout au Maroc
            </span>
          </div>

          <div>
            <LockKeyhole
              size={23}
            />

            <span>
              <strong>
                Paiement sécurisé
              </strong>

              100% fiable et crypté
            </span>
          </div>

          <div>
            <RefreshCw
              size={23}
            />

            <span>
              <strong>
                Retours faciles
              </strong>

              Sous 14 jours
            </span>
          </div>
        </div>
      </section>
    </main>
  )
}

export default Cart