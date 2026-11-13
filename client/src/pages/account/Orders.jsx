import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import { Link } from 'react-router-dom'

import {
  CheckCircle2,
  FileText,
  Search,
  Truck,
} from 'lucide-react'

import AccountSidebar from '../../components/layout/AccountSidebar.jsx'

import orderService from '../../services/orderService.js'


const filters = [
  {
    label: 'Toutes',
    value: 'all',
  },
  {
    label: 'En cours',
    value: 'active',
  },
  {
    label: 'Livrées',
    value: 'delivered',
  },
  {
    label: 'Annulées',
    value: 'cancelled',
  },
]


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


const formatDate = (dateValue) => {
  if (!dateValue) {
    return ''
  }

  const date = new Date(dateValue)

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


function Orders() {
  const [orders, setOrders] =
    useState([])

  const [activeFilter, setActiveFilter] =
    useState('all')

  const [search, setSearch] =
    useState('')

  const [pendingAction, setPendingAction] =
    useState('')

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState('')


  useEffect(() => {
    let active = true

    const loadOrders = async () => {
      try {
        setLoading(true)
        setError('')

        const response =
          await orderService.getOrders()

        const baseOrders =
          Array.isArray(response?.orders)
            ? response.orders
            : []

        const detailedOrders =
          await Promise.all(
            baseOrders.map(
              async (baseOrder) => {
                try {
                  const detailsResponse =
                    await orderService.getOrderById(
                      baseOrder.id,
                    )

                  const detailedOrder =
                    detailsResponse?.order ||
                    baseOrder

                  return {
                    ...baseOrder,
                    ...detailedOrder,
                    items:
                      detailedOrder?.items ||
                      detailsResponse?.items ||
                      [],
                  }
                } catch (detailsError) {
                  console.error(
                    `Impossible de charger la commande ${baseOrder.id}:`,
                    detailsError,
                  )

                  return {
                    ...baseOrder,
                    items: [],
                  }
                }
              },
            ),
          )

        if (active) {
          setOrders(detailedOrders)
        }
      } catch (requestError) {
        console.error(
          'Orders loading error:',
          requestError,
        )

        if (active) {
          setError(
            requestError?.message ||
              'Impossible de charger vos commandes.',
          )
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadOrders()

    return () => {
      active = false
    }
  }, [])


  const handleDownloadInvoice = async (order) => {
    try {
      setPendingAction(
        `Génération de la facture #${order.displayNumber}...`,
      )

      const blob =
        await orderService.getInvoice(
          order.id,
        )

      const url =
        window.URL.createObjectURL(
          new Blob([blob], {
            type: 'application/pdf',
          }),
        )

      const link =
        document.createElement('a')

      link.href = url

      link.download = `facture-${
        order.displayNumber || order.id
      }.pdf`

      document.body.appendChild(link)

      link.click()
      link.remove()

      setTimeout(() => {
        window.URL.revokeObjectURL(url)
      }, 1000)

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


  const normalizedOrders =
    useMemo(() => {
      return orders.map((order) => {
        const statusInfo =
          getStatusInfo(order.status)

        const items =
          Array.isArray(order.items)
            ? order.items
            : []

        const displayProducts =
          items.map((item) => {
            return {
              id:
                item.id ||
                `${order.id}-${item.product_id}`,

              name:
                item.product_name ||
                'Produit',

              image: null,

              imageAlt:
                item.product_name ||
                'Produit NOVA',
            }
          })

        const articleCount =
          items.reduce(
            (total, item) =>
              total +
              Number(item.quantity || 0),
            0,
          )

        return {
          ...order,

          displayNumber:
            order.order_number ||
            order.id,

          date:
            formatDate(
              order.created_at ||
                order.createdAt,
            ),

          statusLabel:
            statusInfo.label,

          statusKey:
            statusInfo.key,

          totalLabel:
            formatPrice(order.total),

          articleCount,

          products: displayProducts,
        }
      })
    }, [orders])


  const filteredOrders =
    useMemo(() => {
      const query =
        search.trim().toLowerCase()

      return normalizedOrders.filter(
        (order) => {
          const matchesFilter =
            activeFilter === 'all' ||
            order.statusKey ===
              activeFilter

          const matchesOrderNumber =
            String(
              order.displayNumber || '',
            )
              .toLowerCase()
              .includes(query)

          const matchesProduct =
            order.products.some(
              (product) =>
                product.name
                  .toLowerCase()
                  .includes(query),
            )

          const matchesSearch =
            !query ||
            matchesOrderNumber ||
            matchesProduct

          return (
            matchesFilter &&
            matchesSearch
          )
        },
      )
    }, [
      normalizedOrders,
      activeFilter,
      search,
    ])


  return (
    <main className="orders-page">

      {/* HERO */}

      <section className="account-hero">
        <div className="nova-container">

          <h1>
            Mes commandes
          </h1>

          <p>
            Retrouvez vos achats et suivez leur livraison.
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

          <span>
            Mes commandes
          </span>

        </nav>


        <div className="account-layout">

          <AccountSidebar />


          <div className="orders-content">

            {/* TOP BAR */}

            <div className="orders-topbar">

              <span className="orders-count">
                {orders.length}{' '}
                {orders.length > 1
                  ? 'commandes'
                  : 'commande'}
              </span>


              <div className="orders-topbar-right">

                <div className="orders-filter-pills">

                  {filters.map(
                    (filter) => (
                      <button
                        key={filter.value}
                        type="button"
                        className={
                          activeFilter ===
                          filter.value
                            ? 'active'
                            : ''
                        }
                        onClick={() =>
                          setActiveFilter(
                            filter.value,
                          )
                        }
                      >
                        {filter.label}
                      </button>
                    ),
                  )}

                </div>


                <label className="orders-search-box">

                  <Search
                    size={17}
                    strokeWidth={1.5}
                  />

                  <input
                    type="search"
                    placeholder="Rechercher une commande"
                    value={search}
                    onChange={(event) =>
                      setSearch(
                        event.target.value,
                      )
                    }
                  />

                </label>

              </div>
            </div>


            {pendingAction ? (
              <p
                className="account-pending-message"
                role="status"
              >
                {pendingAction}
              </p>
            ) : null}


            {error ? (
              <p
                className="account-pending-message"
                role="alert"
              >
                {error}
              </p>
            ) : null}


            {/* ORDERS */}

            <div className="orders-screen-list">

              {loading ? (

                <div className="orders-no-results">
                  Chargement de vos commandes...
                </div>

              ) : filteredOrders.length > 0 ? (

                filteredOrders.map(
                  (order) => (

                    <article
                      key={order.id}
                      className="orders-screen-card"
                    >

                      {/* LEFT */}

                      <div className="orders-card-left">

                        <div className="orders-card-title">

                          <h2>
                            Commande #
                            {order.displayNumber}
                          </h2>

                          <span>
                            {order.date}
                          </span>

                        </div>


                        <div className="orders-card-body">

                          <div className="orders-product-images">

                            {order.products.map(
                              (product) => (

                                product.image ? (
                                  <div
                                    key={product.id}
                                    className="orders-product-image"
                                  >
                                    <img
                                      src={
                                        product.image
                                      }
                                      alt={
                                        product.imageAlt
                                      }
                                    />
                                  </div>
                                ) : null

                              ),
                            )}

                          </div>


                          <div className="orders-product-info">

                            <strong>

                              {order.products.length >
                              0
                                ? order.products
                                    .map(
                                      (product) =>
                                        product.name,
                                    )
                                    .join(' · ')
                                : 'Commande NOVA'}

                            </strong>


                            <span>

                              {order.articleCount}{' '}

                              {order.articleCount > 1
                                ? 'articles'
                                : 'article'}

                            </span>


                            <b>
                              {order.totalLabel}
                            </b>

                          </div>

                        </div>

                      </div>


                      {/* STATUS */}

                      <div className="orders-card-status">

                        <span
                          className={`orders-status-badge ${order.statusKey}`}
                        >

                          {order.statusKey ===
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

                          {order.statusLabel}

                        </span>

                      </div>


                      {/* ACTIONS */}

                      <div className="orders-card-actions">

                        {order.statusKey ===
                        'active' ? (

                          <>

                            <button
                              type="button"
                              className="orders-track-button"
                              onClick={() =>
                                setPendingAction(
                                  'Le suivi en temps réel sera disponible lorsque le système de livraison sera connecté.',
                                )
                              }
                            >
                              Suivre ma commande
                            </button>


                            <Link
                              to={`/mon-compte/commandes/${order.id}`}
                              className="orders-details-link"
                            >
                              Voir les détails
                            </Link>

                          </>

                        ) : (

                          <>

                            <Link
                              to={`/mon-compte/commandes/${order.id}`}
                              className="orders-details-outline"
                            >
                              Voir les détails
                            </Link>


                            <button
                              type="button"
                              className="orders-invoice-link"
                              onClick={() =>
                                handleDownloadInvoice(order)
                              }
                            >

                              <FileText
                                size={16}
                                strokeWidth={1.5}
                              />

                              Facture

                            </button>

                          </>

                        )}

                      </div>

                    </article>

                  ),
                )

              ) : (

                <div className="orders-no-results">

                  {orders.length === 0
                    ? 'Vous n’avez encore aucune commande.'
                    : 'Aucune commande trouvée.'}

                </div>

              )}

            </div>

          </div>

        </div>

      </div>

    </main>
  )
}

export default Orders
