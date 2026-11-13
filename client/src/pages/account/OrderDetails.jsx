import {
  useEffect,
  useState,
} from 'react'

import {
  Link,
  useParams,
} from 'react-router-dom'

import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  FileText,
  MapPin,
  Package,
  Truck,
} from 'lucide-react'

import AccountSidebar from '../../components/layout/AccountSidebar.jsx'
import orderService from '../../services/orderService.js'


const formatPrice = (value) => {
  const amount = Number(value || 0)

  return `${amount.toLocaleString(
    'fr-FR',
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    },
  )} DH`
}


const formatDate = (value) => {
  if (!value) {
    return ''
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return new Intl.DateTimeFormat(
    'fr-FR',
    {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    },
  ).format(date)
}


const getStatusInfo = (status) => {
  switch (status) {
    case 'pending':
      return {
        label: 'En attente',
        key: 'active',
      }

    case 'confirmed':
      return {
        label: 'Confirmée',
        key: 'active',
      }

    case 'processing':
      return {
        label: 'En préparation',
        key: 'active',
      }

    case 'shipped':
      return {
        label: 'En livraison',
        key: 'active',
      }

    case 'delivered':
      return {
        label: 'Livrée',
        key: 'delivered',
      }

    case 'cancelled':
      return {
        label: 'Annulée',
        key: 'cancelled',
      }

    default:
      return {
        label: status || 'En attente',
        key: 'active',
      }
  }
}


const parseShippingAddress = (value) => {
  if (!value) {
    return {}
  }

  if (typeof value === 'object') {
    return value
  }

  try {
    return JSON.parse(value)
  } catch {
    return {}
  }
}


const getPaymentMethodLabel = (method) => {
  switch (method) {
    case 'cash_on_delivery':
      return 'Paiement à la livraison'

    case 'card':
      return 'Carte bancaire'

    case 'paypal':
      return 'PayPal'

    default:
      return method || 'Non renseigné'
  }
}


const getPaymentStatusLabel = (status) => {
  switch (status) {
    case 'pending':
      return 'En attente'

    case 'paid':
      return 'Payé'

    case 'failed':
      return 'Échoué'

    case 'cancelled':
      return 'Annulé'

    case 'refunded':
      return 'Remboursé'

    default:
      return status || 'En attente'
  }
}


const getTrackingState = (status) => {
  const levels = {
    pending: 0,
    confirmed: 1,
    processing: 2,
    shipped: 3,
    delivered: 4,
  }

  return levels[status] ?? 0
}


function OrderDetails() {
  const { id } = useParams()

  const [order, setOrder] =
    useState(null)

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState('')

  const [pendingAction, setPendingAction] =
    useState('')


  useEffect(() => {
    let active = true

    const loadOrder = async () => {
      try {
        setLoading(true)
        setError('')

        const response =
          await orderService.getOrderById(id)

        if (active) {
          setOrder(
            response?.order || null,
          )
        }
      } catch (requestError) {
        console.error(
          'Order details loading error:',
          requestError,
        )

        if (active) {
          setError(
            requestError?.message ||
              'Impossible de charger cette commande.',
          )
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadOrder()

    return () => {
      active = false
    }
  }, [id])


  const handleDownloadInvoice = async () => {
    if (!order) {
      return
    }

    try {
      setPendingAction(
        'Génération de la facture...',
      )

      const blob =
        await orderService.getInvoice(
          order.id,
        )

      const url =
        window.URL.createObjectURL(
          new Blob(
            [blob],
            {
              type: 'application/pdf',
            },
          ),
        )

      const link =
        document.createElement('a')

      link.href = url

      link.download =
        `facture-${
          order.order_number ||
          order.id
        }.pdf`

      document.body.appendChild(
        link,
      )

      link.click()
      link.remove()

      window.URL.revokeObjectURL(
        url,
      )

      setPendingAction('')
    } catch (requestError) {
      console.error(
        'Invoice download error:',
        requestError,
      )

      setPendingAction(
        requestError?.message ||
          'Impossible de générer la facture.',
      )
    }
  }


  if (loading) {
    return (
      <main className="order-details-page">

        <section className="account-hero">
          <div className="nova-container">

            <h1>
              Détails de la commande
            </h1>

            <p>
              Chargement de votre commande...
            </p>

          </div>
        </section>

      </main>
    )
  }


  if (error || !order) {
    return (
      <main className="order-details-page">

        <section className="account-hero">
          <div className="nova-container">

            <h1>
              Commande introuvable
            </h1>

            <p>
              {error ||
                "Cette commande n'existe pas."}
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

            <Link to="/mon-compte/commandes">
              Mes commandes
            </Link>

          </nav>


          <Link
            to="/mon-compte/commandes"
            className="order-details-screen-back"
          >
            <ArrowLeft size={15} />
            Retour aux commandes
          </Link>

        </div>

      </main>
    )
  }


  const statusInfo =
    getStatusInfo(order.status)

  const shippingAddress =
    parseShippingAddress(
      order.shipping_address,
    )

  const items =
    Array.isArray(order.items)
      ? order.items
      : []


  const displayProducts =
    items.map((item) => {
      const variantParts = [
        item.color,
        item.size,
      ].filter(Boolean)

      return {
        id: item.id,

        productId:
          item.product_id,

        slug:
          item.slug || '',

        name:
          item.product_name ||
          'Produit NOVA',

        image: null,

        imageAlt:
          item.product_name ||
          'Produit NOVA',

        quantity:
          Number(item.quantity || 0),

        variant:
          variantParts.join(' · '),

        lineTotal:
          formatPrice(
            item.total_price,
          ),
      }
    })


  const trackingLevel =
    getTrackingState(order.status)

  const isCancelled =
    order.status === 'cancelled'


  return (
    <main className="order-details-page">

      {/* HERO */}

      <section className="account-hero">

        <div className="nova-container">

          <h1>
            Détails de la commande
          </h1>

          <p>
            Consultez les informations et le suivi de votre commande.
          </p>

        </div>

      </section>


      <div className="nova-container">

        {/* BREADCRUMB */}

        <nav className="account-breadcrumb">

          <Link to="/">
            Accueil
          </Link>

          <span>/</span>

          <Link to="/mon-compte">
            Mon compte
          </Link>

          <span>/</span>

          <Link to="/mon-compte/commandes">
            Mes commandes
          </Link>

          <span>/</span>

          <span>
            #
            {order.order_number ||
              order.id}
          </span>

        </nav>


        <div className="account-layout">

          <AccountSidebar />


          <div className="order-details-screen">

            {/* BACK */}

            <Link
              to="/mon-compte/commandes"
              className="order-details-screen-back"
            >
              <ArrowLeft size={15} />

              Retour aux commandes
            </Link>


            {/* HEADER */}

            <section className="order-detail-box order-detail-header">

              <div>

                <h2>
                  Commande #
                  {order.order_number ||
                    order.id}
                </h2>

                <span>
                  {formatDate(
                    order.created_at,
                  )}
                </span>

              </div>


              <div className="order-detail-header-actions">

                <span
                  className={`orders-status-badge ${statusInfo.key}`}
                >

                  {statusInfo.key ===
                  'active' ? (

                    <Truck
                      size={15}
                      strokeWidth={1.5}
                    />

                  ) : (

                    <CheckCircle2
                      size={15}
                      strokeWidth={1.5}
                    />

                  )}

                  {statusInfo.label}

                </span>


                <button
                  type="button"
                  className="order-detail-invoice"
                  onClick={
                    handleDownloadInvoice
                  }
                >
                  <FileText size={15} />

                  Facture
                </button>

              </div>

            </section>


            {pendingAction ? (
              <p
                className="account-pending-message"
                role="status"
              >
                {pendingAction}
              </p>
            ) : null}


            {/* TRACKING */}

            <section className="order-detail-box">

              <div className="order-detail-section-title">

                <Truck
                  size={21}
                  strokeWidth={1.5}
                />

                <div>

                  <h3>
                    Suivi de commande
                  </h3>

                  <p>
                    Suivez l’évolution de votre livraison.
                  </p>

                </div>

              </div>


              {isCancelled ? (

                <p className="account-pending-message">
                  Cette commande a été annulée.
                </p>

              ) : (

                <div className="order-detail-tracking">

                  <div
                    className={`detail-track-step ${
                      trackingLevel >= 1
                        ? 'completed'
                        : trackingLevel === 0
                          ? 'current'
                          : ''
                    }`}
                  >

                    <div className="detail-track-dot">
                      <CheckCircle2 size={16} />
                    </div>

                    <strong>
                      Confirmée
                    </strong>

                    <span>
                      {trackingLevel >= 1
                        ? formatDate(
                            order.created_at,
                          )
                        : 'À venir'}
                    </span>

                  </div>


                  <div
                    className={`detail-track-line ${
                      trackingLevel >= 2
                        ? 'completed'
                        : ''
                    }`}
                  />


                  <div
                    className={`detail-track-step ${
                      trackingLevel >= 2
                        ? 'completed'
                        : trackingLevel === 1
                          ? 'current'
                          : ''
                    }`}
                  >

                    <div className="detail-track-dot">
                      <Package size={16} />
                    </div>

                    <strong>
                      En préparation
                    </strong>

                    <span>
                      {trackingLevel >= 2
                        ? 'En cours'
                        : 'À venir'}
                    </span>

                  </div>


                  <div
                    className={`detail-track-line ${
                      trackingLevel >= 3
                        ? 'completed'
                        : ''
                    }`}
                  />


                  <div
                    className={`detail-track-step ${
                      trackingLevel >= 3
                        ? 'completed'
                        : trackingLevel === 2
                          ? 'current'
                          : ''
                    }`}
                  >

                    <div className="detail-track-dot">
                      <Truck size={16} />
                    </div>

                    <strong>
                      Expédiée
                    </strong>

                    <span>
                      {trackingLevel >= 3
                        ? 'En cours'
                        : 'À venir'}
                    </span>

                  </div>


                  <div
                    className={`detail-track-line ${
                      trackingLevel >= 4
                        ? 'completed'
                        : ''
                    }`}
                  />


                  <div
                    className={`detail-track-step ${
                      trackingLevel >= 4
                        ? 'completed'
                        : trackingLevel === 3
                          ? 'current'
                          : ''
                    }`}
                  >

                    <div className="detail-track-dot">
                      <Package size={16} />
                    </div>

                    <strong>
                      Livrée
                    </strong>

                    <span>
                      {trackingLevel >= 4
                        ? 'Terminée'
                        : 'À venir'}
                    </span>

                  </div>

                </div>

              )}

            </section>


            {/* ARTICLES */}

            <section className="order-detail-box">

              <div className="order-detail-section-heading">

                <h3>
                  Articles commandés
                </h3>

                <span>
                  {displayProducts.reduce(
                    (total, product) =>
                      total +
                      product.quantity,
                    0,
                  )}{' '}
                  {displayProducts.reduce(
                    (total, product) =>
                      total +
                      product.quantity,
                    0,
                  ) > 1
                    ? 'articles'
                    : 'article'}
                </span>

              </div>


              <div className="order-detail-products">

                {displayProducts.map(
                  (product) => (

                    <article
                      key={product.id}
                      className="order-detail-product"
                    >

                      {product.slug &&
                      product.image ? (

                        <Link
                          to={`/produit/${product.slug}`}
                          className="order-detail-product-image"
                        >
                          <img
                            src={
                              product.image
                            }
                            alt={
                              product.imageAlt
                            }
                          />
                        </Link>

                      ) : (

                        <div className="order-detail-product-image">
                          <Package size={28} />
                        </div>

                      )}


                      <div className="order-detail-product-info">

                        {product.slug ? (

                          <Link
                            to={`/produit/${product.slug}`}
                          >
                            <strong>
                              {product.name}
                            </strong>
                          </Link>

                        ) : (

                          <strong>
                            {product.name}
                          </strong>

                        )}


                        {product.variant ? (
                          <span>
                            {product.variant}
                          </span>
                        ) : null}


                        <span>
                          Quantité :{' '}
                          {product.quantity}
                        </span>

                      </div>


                      <strong className="order-detail-product-price">
                        {product.lineTotal}
                      </strong>

                    </article>

                  ),
                )}

              </div>

            </section>


            {/* ADDRESS / PAYMENT */}

            <div className="order-detail-two-columns">

              <section className="order-detail-box">

                <div className="order-detail-section-title">

                  <MapPin
                    size={21}
                    strokeWidth={1.5}
                  />

                  <div>
                    <h3>
                      Adresse de livraison
                    </h3>
                  </div>

                </div>


                <div className="order-detail-address">

                  <strong>
                    {shippingAddress.full_name ||
                      'Non renseigné'}
                  </strong>


                  {shippingAddress.address_line1 ? (
                    <p>
                      {shippingAddress.address_line1}
                    </p>
                  ) : null}


                  {shippingAddress.address_line2 ? (
                    <p>
                      {shippingAddress.address_line2}
                    </p>
                  ) : null}


                  <p>
                    {[
                      shippingAddress.postal_code,
                      shippingAddress.city,
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    {shippingAddress.country
                      ? ` · ${shippingAddress.country}`
                      : ''}
                  </p>


                  {shippingAddress.phone ? (
                    <p>
                      {shippingAddress.phone}
                    </p>
                  ) : null}


                  {shippingAddress.email ? (
                    <p>
                      {shippingAddress.email}
                    </p>
                  ) : null}

                </div>

              </section>


              <section className="order-detail-box">

                <div className="order-detail-section-title">

                  <CreditCard
                    size={21}
                    strokeWidth={1.5}
                  />

                  <div>
                    <h3>
                      Paiement
                    </h3>
                  </div>

                </div>


                <div className="order-detail-payment">

                  <div>

                    <span>
                      Mode de paiement
                    </span>

                    <strong>
                      {getPaymentMethodLabel(
                        order.payment_method,
                      )}
                    </strong>

                  </div>


                  <div>

                    <span>
                      Statut
                    </span>

                    <strong
                      className={
                        order.payment_status ===
                        'paid'
                          ? 'order-payment-paid'
                          : ''
                      }
                    >
                      {getPaymentStatusLabel(
                        order.payment_status,
                      )}
                    </strong>

                  </div>

                </div>

              </section>

            </div>


            {/* SUMMARY */}

            <section className="order-detail-box">

              <div className="order-detail-section-heading">

                <h3>
                  Résumé de la commande
                </h3>

              </div>


              <div className="order-detail-summary">

                <div>

                  <span>
                    Sous-total
                  </span>

                  <strong>
                    {formatPrice(
                      order.subtotal,
                    )}
                  </strong>

                </div>


                <div>

                  <span>
                    Livraison
                  </span>

                  <strong>
                    {Number(
                      order.shipping_cost ||
                        0,
                    ) === 0
                      ? 'Gratuite'
                      : formatPrice(
                          order.shipping_cost,
                        )}
                  </strong>

                </div>


                <div>

                  <span>
                    Réduction
                  </span>

                  <strong>
                    {formatPrice(
                      order.discount,
                    )}
                  </strong>

                </div>


                <div className="order-detail-total">

                  <span>
                    Total
                  </span>

                  <strong>
                    {formatPrice(
                      order.total,
                    )}
                  </strong>

                </div>

              </div>

            </section>

          </div>

        </div>

      </div>

    </main>
  )
}

export default OrderDetails
