import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  CreditCard,
  Eye,
  Mail,
  MapPin,
  MessageSquareText,
  Phone,
  ReceiptText,
  ShoppingBag,
  Tag,
  UserRound,
  WalletCards,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import AdminHeader from '../../components/layout/AdminHeader.jsx'
import AdminSidebar from '../../components/layout/AdminSidebar.jsx'
import {
  getAdminApiErrorMessages,
  getCustomer,
  updateCustomerStatus as persistCustomerStatus,
} from '../../services/adminService.js'

const tagPool = [
  'VIP',
  'Casablanca',
  'Paiement carte',
  'Fidele',
  'Reactivation',
  'Support',
]

function CustomerStatCard({ icon: Icon, value, label }) {
  return (
    <div className="customer-details-stat-card">
      <div className="customer-details-stat-card__icon">
        <Icon size={24} strokeWidth={1.7} />
      </div>
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
    </div>
  )
}

function formatAmount(amount) {
  return new Intl.NumberFormat('fr-FR').format(amount).replace(/\u202f/g, ' ')
}

export default function CustomerDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [customer, setCustomer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let isActive = true

    async function loadCustomer() {
      setLoading(true)
      setError('')

      try {
        const nextCustomer = await getCustomer(id)

        if (isActive) {
          setCustomer(nextCustomer)
        }
      } catch (requestError) {
        if (isActive) {
          setCustomer(null)
          setError(getAdminApiErrorMessages(requestError).join(' '))
        }
      } finally {
        if (isActive) {
          setLoading(false)
        }
      }
    }

    loadCustomer()

    return () => {
      isActive = false
    }
  }, [id])

  const recentOrders = useMemo(
    () => customer?.recentOrders || [],
    [customer],
  )

  const activityItems = useMemo(
    () =>
      recentOrders.length > 0
        ? recentOrders.slice(0, 3).map(
            (order) =>
              `Commande ${order.id} - ${order.status}`,
          )
        : ['Aucune activite commande recente'],
    [recentOrders],
  )

  if (loading) {
    return (
      <div className="admin-layout">
        <AdminSidebar />

        <div className="admin-main">
          <AdminHeader />

          <main className="admin-dashboard customer-details-page">
            <section className="customer-details-heading">
              <div>
                <h1>Chargement du client</h1>
                <p>Lecture des donnees depuis la base.</p>
              </div>
            </section>
          </main>
        </div>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="admin-layout">
        <AdminSidebar />

        <div className="admin-main">
          <AdminHeader />

          <main className="admin-dashboard customer-details-page">
            <section className="customer-details-heading">
              <div>
                <h1>Client introuvable</h1>
                <p>
                  {error ||
                    'Aucun client en base ne correspond a cet identifiant.'}
                </p>
              </div>
              <Link
                className="customer-details-status-toggle"
                to="/admin/clients"
              >
                Retour aux clients
              </Link>
            </section>
          </main>
        </div>
      </div>
    )
  }

  const updateCustomerStatus = async (nextStatus) => {
    setError('')

    try {
      const savedCustomer = await persistCustomerStatus(
        customer.id,
        nextStatus,
      )

      setCustomer((currentCustomer) => ({
        ...currentCustomer,
        ...savedCustomer,
        recentOrders: currentCustomer.recentOrders,
        addresses: currentCustomer.addresses,
      }))
      setNotice('Client mis a jour en base.')
    } catch (requestError) {
      setNotice('')
      setError(getAdminApiErrorMessages(requestError).join(' '))
    }
  }

  const isActive = customer.statusType === 'active'

  const toggleTag = (tagName) => {
    setNotice(
      `Le tag "${tagName}" n'est pas persiste par le schema client actuel.`,
    )
  }

  return (
    <div className="admin-layout">
      <AdminSidebar />

      <div className="admin-main">
        <AdminHeader />

        <main className="admin-dashboard customer-details-page">
          <section className="customer-details-breadcrumb">
            <Link to="/admin">Accueil</Link>
            <ChevronRight size={14} strokeWidth={1.7} />
            <Link to="/admin/clients">Clients</Link>
            <ChevronRight size={14} strokeWidth={1.7} />
            <strong>{customer.name}</strong>
          </section>

          <section className="customer-details-heading">
            <div className="customer-details-heading__title">
              <Link
                className="customer-details-back"
                to="/admin/clients"
                aria-label="Retour aux clients"
              >
                <ArrowLeft size={18} strokeWidth={1.8} />
              </Link>

              <div>
                <h1>{customer.name}</h1>
                <p>Details du client et historique commercial.</p>
              </div>
            </div>

            <button
              className={
                isActive
                  ? 'customer-details-status-toggle'
                  : 'customer-details-status-toggle is-muted'
              }
              type="button"
              onClick={() =>
                updateCustomerStatus(isActive ? 'inactive' : 'active')
              }
            >
              <UserRound size={17} strokeWidth={1.8} />
              <span>{isActive ? 'Suspendre' : 'Reactiver'}</span>
            </button>
          </section>

          {notice ? <p className="admin-local-notice">{notice}</p> : null}
          {error ? (
            <div className="product-form-alert product-form-alert--error">
              {error}
            </div>
          ) : null}

          <section className="customer-details-profile-grid">
            <div className="dashboard-card customer-details-profile-card">
              <div className="customer-details-profile-main">
                <div className="customer-details-avatar">
                  {customer.initials}
                </div>
                <div>
                  <div className="customer-details-profile-title">
                    <h2>{customer.name}</h2>
                    <span
                      className={`admin-listing-status admin-listing-status--${customer.statusType}`}
                    >
                      {customer.status}
                    </span>
                  </div>
                  <div className="customer-details-contact-grid">
                    <span>
                      <Mail size={15} strokeWidth={1.7} />
                      {customer.email}
                    </span>
                    <span>
                      <Phone size={15} strokeWidth={1.7} />
                      {customer.phone}
                    </span>
                    <span>
                      <MapPin size={15} strokeWidth={1.7} />
                      {customer.city}
                    </span>
                    <span>
                      <CalendarDays size={15} strokeWidth={1.7} />
                      Inscrit le {customer.date}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="customer-details-stats">
              <CustomerStatCard
                icon={ShoppingBag}
                value={customer.orders}
                label="Total commandes"
              />
              <CustomerStatCard
                icon={WalletCards}
                value={`${formatAmount(customer.spent)} DH`}
                label="Montant depense"
              />
              <CustomerStatCard
                icon={CreditCard}
                value={
                  customer.orders
                    ? `${formatAmount(Math.round(customer.spent / customer.orders))} DH`
                    : '0 DH'
                }
                label="Panier moyen"
              />
              <CustomerStatCard
                icon={ReceiptText}
                value={recentOrders[0]?.id || 'Aucune'}
                label="Derniere commande"
              />
            </div>
          </section>

          <section className="customer-details-content-grid">
            <div className="customer-details-main-column">
              <div className="dashboard-card customer-details-card">
                <div className="customer-details-card__header">
                  <h2>Commandes recentes</h2>
                  <span>{recentOrders.length} commandes</span>
                </div>

                <div className="customer-details-table-wrap">
                  <table className="customer-details-orders-table">
                    <thead>
                      <tr>
                        <th>Commande</th>
                        <th>Date</th>
                        <th>Produits</th>
                        <th>Montant</th>
                        <th>Paiement</th>
                        <th>Statut</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.map((order) => (
                        <tr key={order.id}>
                          <td>
                            <strong>{order.id}</strong>
                          </td>
                          <td>{order.date}</td>
                          <td>{order.products}</td>
                          <td>{order.amount}</td>
                          <td>{order.payment}</td>
                          <td>
                            <span
                              className={`orders-status orders-status--${order.statusClass}`}
                            >
                              {order.status}
                            </span>
                          </td>
                          <td>
                            <button
                              className="customer-details-order-action"
                              type="button"
                              aria-label={`Voir la commande #${order.id}`}
                              onClick={() =>
                                navigate(
                                  `/admin/commandes/${String(
                                    order.rawId || order.id,
                                  ).replace('#', '')}`,
                                )
                              }
                            >
                              <Eye size={17} strokeWidth={1.8} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {recentOrders.length === 0 ? (
                        <tr>
                          <td colSpan="7">Aucune commande trouvee.</td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <aside className="customer-details-side-column">
              <div className="dashboard-card customer-details-card">
                <div className="customer-details-card__header">
                  <h2>Adresse principale</h2>
                </div>
                <div className="customer-details-address">
                  <MapPin size={18} strokeWidth={1.8} />
                  <p>
                    <strong>{customer.name}</strong>
                    <span>{customer.addresses[0]?.address_line1 || customer.city}</span>
                    <span>
                      {[customer.addresses[0]?.city || customer.city, customer.country]
                        .filter(Boolean)
                        .join(', ')}
                    </span>
                    <span>{customer.phone}</span>
                  </p>
                </div>
              </div>

              <div className="dashboard-card customer-details-card">
                <div className="customer-details-card__header">
                  <h2>Tags</h2>
                </div>
                <div className="customer-details-tags">
                  {tagPool.map((tagName) => (
                    <button
                      className={
                        customer.tags?.includes(tagName) ? 'is-selected' : ''
                      }
                      key={tagName}
                      type="button"
                      onClick={() => toggleTag(tagName)}
                    >
                      <Tag size={13} strokeWidth={1.8} />
                      <span>{tagName}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="dashboard-card customer-details-card">
                <div className="customer-details-card__header">
                  <h2>Notes</h2>
                </div>
                <label className="customer-details-note">
                  <MessageSquareText size={17} strokeWidth={1.8} />
                  <textarea
                    value="Notes client non disponibles dans le schema actuel."
                    readOnly
                    onFocus={() =>
                      setNotice(
                        'Notes client non persistantes dans le schema actuel.',
                      )
                    }
                  />
                </label>
              </div>

              <div className="dashboard-card customer-details-card">
                <div className="customer-details-card__header">
                  <h2>Activite recente</h2>
                </div>
                <div className="customer-details-activity">
                  {activityItems.map((item) => (
                    <div key={item}>
                      <span />
                      <strong>{item}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </section>
        </main>
      </div>
    </div>
  )
}
