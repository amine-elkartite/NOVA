import {
  BarChart3,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  CreditCard,
  Download,
  Eye,
  Mail,
  MapPin,
  MoreHorizontal,
  Phone,
  Search,
  ShoppingBag,
  Truck,
  XCircle,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import AdminSidebar from '../../components/layout/AdminSidebar'
import AdminHeader from '../../components/layout/AdminHeader'
import {
  getAdminApiErrorMessages,
  getOrders,
  orderStatusLabels,
  printInvoice,
  updateOrderStatus as persistOrderStatus,
} from '../../services/adminService.js'

const tabs = [
  ['Toutes', 'all'],
  ['En attente', 'pending'],
  ['Confirmee', 'confirmed'],
  ['En preparation', 'preparing'],
  ['Expediee', 'shipped'],
  ['Livree', 'delivered'],
  ['Annulee', 'cancelled'],
]

const paymentFilters = [
  ['all', 'Tous les paiements'],
  ['card', 'Carte bancaire'],
  ['paypal', 'PayPal'],
  ['delivery', 'A la livraison'],
]

const perPageOptions = [4, 8, 16]

function PaymentIcon({ type }) {
  if (type === 'delivery') {
    return <Truck size={15} strokeWidth={1.8} />
  }

  if (type === 'paypal') {
    return <span className="orders-paypal-icon">P</span>
  }

  return <CreditCard size={15} strokeWidth={1.8} />
}

function OrdersStatCard({ icon: Icon, value, label, growth, danger = false }) {
  return (
    <div className="orders-stat-card">
      <div className="orders-stat-card__icon">
        <Icon size={27} strokeWidth={1.6} />
      </div>
      <div className="orders-stat-card__main">
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
      <div className={`orders-stat-card__growth ${danger ? 'is-danger' : ''}`}>
        <span>↗</span>
        <strong>{growth}</strong>
        <small>base de donnees</small>
      </div>
    </div>
  )
}

function formatCsvCell(value) {
  return `"${String(value).replace(/"/g, '""')}"`
}

export default function Orders() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [apiError, setApiError] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [selectedIds, setSelectedIds] = useState([])
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(8)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let isActive = true

    async function loadOrders() {
      setLoading(true)
      setApiError('')

      try {
        const nextOrders = await getOrders()

        if (isActive) {
          setOrders(nextOrders)
        }
      } catch (error) {
        if (isActive) {
          setApiError(getAdminApiErrorMessages(error).join(' '))
        }
      } finally {
        if (isActive) {
          setLoading(false)
        }
      }
    }

    loadOrders()

    return () => {
      isActive = false
    }
  }, [])
  const orderDates = useMemo(
    () => Array.from(new Set(orders.map((order) => order.date))),
    [orders],
  )

  const filteredOrders = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    return orders.filter((order) => {
      const matchesStatus =
        statusFilter === 'all' || order.statusClass === statusFilter
      const matchesSearch =
        order.id.toLowerCase().includes(normalizedSearch) ||
        order.orderNumber.toLowerCase().includes(normalizedSearch) ||
        order.customer.toLowerCase().includes(normalizedSearch)
      const matchesDate = dateFilter === 'all' || order.date === dateFilter
      const matchesPayment =
        paymentFilter === 'all' || order.paymentType === paymentFilter

      return matchesStatus && matchesSearch && matchesDate && matchesPayment
    })
  }, [dateFilter, orders, paymentFilter, searchTerm, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / perPage))
  const safePage = Math.min(page, totalPages)
  const visibleOrders = filteredOrders.slice(
    (safePage - 1) * perPage,
    safePage * perPage,
  )
  const allVisibleSelected =
    visibleOrders.length > 0 &&
    visibleOrders.every((order) => selectedIds.includes(order.id))

  const resetToFirstPage = (setter) => (event) => {
    setter(event.target.value)
    setPage(1)
    setSelectedIds([])
  }

  const updateOrderStatus = async (orderId, statusKey) => {
    setApiError('')

    try {
      const savedOrder = await persistOrderStatus(orderId, statusKey)

      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order.id === orderId ? savedOrder : order,
        ),
      )
      setNotice(`${orderId} mis a jour : ${orderStatusLabels[statusKey]}.`)
    } catch (error) {
      setNotice('')
      setApiError(getAdminApiErrorMessages(error).join(' '))
    }
  }

  const toggleAllVisible = () => {
    setSelectedIds((currentIds) => {
      if (allVisibleSelected) {
        return currentIds.filter(
          (id) => !visibleOrders.some((order) => order.id === id),
        )
      }

      return Array.from(
        new Set([...currentIds, ...visibleOrders.map((order) => order.id)]),
      )
    })
  }

  const toggleOrder = (orderId) => {
    setSelectedIds((currentIds) =>
      currentIds.includes(orderId)
        ? currentIds.filter((id) => id !== orderId)
        : [...currentIds, orderId],
    )
  }

  const resetFilters = () => {
    setStatusFilter('all')
    setSearchTerm('')
    setDateFilter('all')
    setPaymentFilter('all')
    setPage(1)
    setSelectedIds([])
  }

  const exportVisibleOrders = () => {
    const headers = [
      'Commande',
      'Client',
      'Produits',
      'Montant',
      'Paiement',
      'Statut',
      'Date',
    ]
    const rows = filteredOrders.map((order) => [
      order.id,
      order.customer,
      order.products,
      order.amount,
      order.payment,
      order.status,
      order.date,
    ])
    const csv = [headers, ...rows]
      .map((row) => row.map(formatCsvCell).join(','))
      .join('\n')
    const blob = new Blob([csv], {
      type: 'text/csv;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = 'commandes-admin.csv'
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  const firstOrder = orders[0]
  const pendingCount = orders.filter(
    (order) => order.statusClass === 'pending',
  ).length
  const shippedCount = orders.filter(
    (order) => order.statusClass === 'shipped',
  ).length
  const generatedRevenue = orders.reduce(
    (total, order) => total + Number(order.amountValue || 0),
    0,
  )

  return (
    <div className="admin-layout">
      <AdminSidebar />

      <div className="admin-main">
        <AdminHeader />

        <main className="admin-dashboard orders-page">
          <section className="orders-page__heading">
            <div>
              <h1>Gestion des commandes</h1>
              <p>Suivez, filtrez et gerez toutes les commandes.</p>
            </div>

            <button
              className="orders-date-button"
              type="button"
              onClick={() => {
                setDateFilter((currentFilter) =>
                  currentFilter === 'all' && orderDates[0]
                    ? orderDates[0]
                    : 'all',
                )
                setPage(1)
              }}
            >
              <CalendarDays size={17} />
              <span>
                {dateFilter === 'all'
                  ? 'Toutes les dates'
                  : dateFilter}
              </span>
              <ChevronDown size={16} />
            </button>
          </section>

          {notice ? <p className="admin-local-notice">{notice}</p> : null}
          {loading ? (
            <p className="admin-local-notice">
              Chargement des commandes depuis la base de donnees...
            </p>
          ) : null}
          {apiError ? (
            <div className="product-form-alert product-form-alert--error">
              {apiError}
            </div>
          ) : null}

          <section className="orders-stats">
            <OrdersStatCard
              icon={ShoppingBag}
              value={orders.length}
              label="Total commandes"
              growth="+ DB"
            />
            <OrdersStatCard
              icon={Clock3}
              value={pendingCount}
              label="En attente"
              growth="+ DB"
              danger
            />
            <OrdersStatCard
              icon={Truck}
              value={shippedCount}
              label="Expediees"
              growth="+ DB"
            />
            <OrdersStatCard
              icon={BarChart3}
              value={`${new Intl.NumberFormat('fr-FR')
                .format(generatedRevenue)
                .replace(/\u202f/g, ' ')} DH`}
              label="Chiffre genere"
              growth="+ DB"
            />
          </section>

          <section className="orders-content">
            <div className="dashboard-card orders-list-card">
              <h2>Toutes les commandes</h2>

              <div className="orders-tabs">
                {tabs.map(([label, status]) => (
                  <button
                    key={status}
                    className={`orders-tab ${
                      statusFilter === status ? 'is-active' : ''
                    }`}
                    type="button"
                    onClick={() => {
                      setStatusFilter(status)
                      setPage(1)
                    }}
                  >
                    <span>{label}</span>
                    <strong>
                      {status === 'all'
                        ? orders.length
                        : orders.filter(
                            (order) => order.statusClass === status,
                          ).length}
                    </strong>
                  </button>
                ))}
              </div>

              <div className="orders-toolbar">
                <div className="orders-toolbar__search">
                  <Search size={17} />
                  <input
                    type="search"
                    value={searchTerm}
                    placeholder="Rechercher une commande, un client..."
                    onChange={resetToFirstPage(setSearchTerm)}
                  />
                </div>

                <label className="orders-toolbar__button orders-toolbar__select">
                  <CalendarDays size={16} />
                  <span className="sr-only">Filtrer par date</span>
                  <select
                    value={dateFilter}
                    onChange={resetToFirstPage(setDateFilter)}
                  >
                    <option value="all">Toutes les dates</option>
                    {orderDates.map((date) => (
                      <option value={date} key={date}>
                        {date}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={15} />
                </label>

                <label className="orders-toolbar__button orders-toolbar__select">
                  <span className="sr-only">Filtrer par paiement</span>
                  <select
                    value={paymentFilter}
                    onChange={resetToFirstPage(setPaymentFilter)}
                  >
                    {paymentFilters.map(([value, label]) => (
                      <option value={value} key={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={15} />
                </label>

                <button
                  className="orders-export-button"
                  type="button"
                  onClick={exportVisibleOrders}
                >
                  <Download size={17} />
                  Exporter
                </button>
              </div>

              <div className="orders-table-wrap">
                <table className="orders-table">
                  <thead>
                    <tr>
                      <th>
                        <input
                          type="checkbox"
                          aria-label="Selectionner toutes les commandes visibles"
                          checked={allVisibleSelected}
                          onChange={toggleAllVisible}
                        />
                      </th>
                      <th>Commande</th>
                      <th>Client</th>
                      <th>Produits</th>
                      <th>Montant</th>
                      <th>Paiement</th>
                      <th>Statut</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {visibleOrders.map((order) => (
                      <tr key={order.id}>
                        <td>
                          <input
                            type="checkbox"
                            aria-label={`Selectionner ${order.id}`}
                            checked={selectedIds.includes(order.id)}
                            onChange={() => toggleOrder(order.id)}
                          />
                        </td>
                        <td>
                          <strong>{order.id}</strong>
                        </td>
                        <td>
                          <div className="orders-customer">
                            <div className="orders-customer__avatar">
                              {order.initials}
                            </div>
                            <span>{order.customer}</span>
                          </div>
                        </td>
                        <td>
                          <div className="orders-product-cell">
                            <div className="orders-product-thumb" />
                            <div className="orders-product-thumb orders-product-thumb--dark" />
                            <span>{order.products}</span>
                          </div>
                        </td>
                        <td>
                          <strong>{order.amount}</strong>
                        </td>
                        <td>
                          <div className="orders-payment">
                            <PaymentIcon type={order.paymentType} />
                            <span>{order.payment}</span>
                          </div>
                        </td>
                        <td>
                          <span
                            className={`orders-status orders-status--${order.statusClass}`}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td>{order.date}</td>
                        <td>
                          <div className="orders-row-actions">
                            <button
                              className="orders-more-button"
                              type="button"
                              aria-label={`Voir la commande ${order.id}`}
                              onClick={() =>
                                navigate(
                                  `/admin/commandes/${order.id.replace(
                                    '#',
                                    '',
                                  )}`,
                                )
                              }
                            >
                              <MoreHorizontal size={18} />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                updateOrderStatus(order.id, 'confirmed')
                              }
                            >
                              <Check size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                updateOrderStatus(order.id, 'shipped')
                              }
                            >
                              <Truck size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                updateOrderStatus(order.id, 'cancelled')
                              }
                            >
                              <XCircle size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {visibleOrders.length === 0 ? (
                      <tr>
                        <td className="orders-table__empty" colSpan="9">
                          {loading
                            ? 'Chargement des commandes...'
                            : 'Aucune commande trouvee'}
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>

              <div className="orders-pagination">
                <span>
                  Affichage de{' '}
                  {filteredOrders.length === 0
                    ? 0
                    : (safePage - 1) * perPage + 1}{' '}
                  a {Math.min(safePage * perPage, filteredOrders.length)} sur{' '}
                  {filteredOrders.length} commandes
                </span>

                <div className="orders-pagination__pages">
                  <button
                    type="button"
                    disabled={safePage === 1}
                    onClick={() =>
                      setPage((currentPage) => Math.max(1, currentPage - 1))
                    }
                  >
                    <ChevronLeft size={15} />
                  </button>
                  {Array.from({ length: totalPages }, (_, index) => index + 1)
                    .slice(0, 5)
                    .map((pageNumber) => (
                      <button
                        type="button"
                        className={safePage === pageNumber ? 'is-active' : ''}
                        key={pageNumber}
                        onClick={() => setPage(pageNumber)}
                      >
                        {pageNumber}
                      </button>
                    ))}
                  <button
                    type="button"
                    disabled={safePage === totalPages}
                    onClick={() =>
                      setPage((currentPage) =>
                        Math.min(totalPages, currentPage + 1),
                      )
                    }
                  >
                    <ChevronRight size={15} />
                  </button>
                </div>

                <label className="orders-per-page">
                  <span>Par page</span>
                  <select
                    value={perPage}
                    onChange={(event) => {
                      setPerPage(Number(event.target.value))
                      setPage(1)
                    }}
                  >
                    {perPageOptions.map((option) => (
                      <option value={option} key={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} />
                </label>
              </div>
            </div>

            <aside className="orders-details-column">
              <div className="dashboard-card orders-status-card">
                <div className="orders-side-heading">
                  <h2>Statut des commandes</h2>
                  <button type="button" onClick={resetFilters}>
                    Voir tout
                  </button>
                </div>
                <div className="orders-status-list">
                  {tabs.slice(1).map(([, status]) => (
                    <div key={status}>
                      <span>
                        <i className={`orders-status-dot orders-status-dot--${status}`} />
                        {orderStatusLabels[status]}
                      </span>
                      <strong>
                        {
                          orders.filter((order) => order.statusClass === status)
                            .length
                        }
                      </strong>
                    </div>
                  ))}
                </div>
              </div>

              {firstOrder ? (
                <div className="dashboard-card order-detail-card">
                  <div className="orders-side-heading">
                    <h2>Details de commande</h2>
                    <strong>{firstOrder.id}</strong>
                  </div>

                  <div className="order-detail-customer">
                    <div className="order-detail-avatar">
                      {firstOrder.initials}
                    </div>
                    <div>
                      <strong>{firstOrder.customer}</strong>
                      <span>
                        <Mail size={13} />
                        {firstOrder.customerEmail || 'Email non renseigne'}
                      </span>
                      <span>
                        <Phone size={13} />
                        {firstOrder.customerPhone || 'Non renseigne'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/admin/clients/${firstOrder.customerId}`)
                      }
                    >
                      Voir le profil
                    </button>
                  </div>

                  <div className="order-detail-section">
                    <div className="order-detail-section__title">
                      <MapPin size={16} />
                      <strong>Adresse de livraison</strong>
                    </div>
                    <p>
                      {firstOrder.shippingAddressText ||
                        'Adresse non renseignee'}
                    </p>
                  </div>

                  <div className="order-detail-actions">
                    <button
                      className="order-action-primary"
                      type="button"
                      onClick={() =>
                        updateOrderStatus(firstOrder.id, 'confirmed')
                      }
                    >
                      <Check size={16} />
                      Confirmer
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updateOrderStatus(firstOrder.id, 'shipped')
                      }
                    >
                      <Truck size={16} />
                      Marquer expediee
                    </button>
                    <button
                      type="button"
                      onClick={() => printInvoice(firstOrder)}
                    >
                      <Eye size={16} />
                      Voir la facture
                    </button>
                  </div>
                </div>
              ) : null}
            </aside>
          </section>
        </main>
      </div>
    </div>
  )
}
