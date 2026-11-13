import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  CreditCard,
  Download,
  Mail,
  MapPin,
  PackageCheck,
  Phone,
  ReceiptText,
  Truck,
  UserRound,
  XCircle,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import AdminHeader from '../../components/layout/AdminHeader.jsx'
import AdminSidebar from '../../components/layout/AdminSidebar.jsx'
import {
  getAdminApiErrorMessages,
  getOrder,
  orderStatusLabels,
  printInvoice,
  updateOrderStatus as persistOrderStatus,
} from '../../services/adminService.js'

const timelineProgressByStatus = {
  pending: 0,
  confirmed: 1,
  preparing: 2,
  shipped: 3,
  delivered: 4,
  cancelled: -1,
}

const statusActions = [
  {
    label: 'Confirmer',
    statusKey: 'confirmed',
    icon: CheckCircle2,
    primary: true,
  },
  {
    label: 'Preparer',
    statusKey: 'preparing',
    icon: PackageCheck,
  },
  {
    label: 'Marquer comme expediee',
    statusKey: 'shipped',
    icon: Truck,
  },
  {
    label: 'Marquer comme livree',
    statusKey: 'delivered',
    icon: CheckCircle2,
  },
]

const timelineItems = [
  ['created', 'Commande creee', '30 sept. 2026, 14:32'],
  ['paid', 'Paiement confirme', 'Carte bancaire validee'],
  ['preparing', 'Commande preparee', 'Articles en preparation'],
  ['shipped', 'Expediee', 'Transporteur Amana Express'],
  ['delivered', 'Livree', 'Confirmation client attendue'],
]

function normalizeOrderId(id) {
  return id ? id.replace(/^#/, '') : ''
}

function DetailRow({ label, value }) {
  return (
    <div className="order-details-info-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

export default function OrderDetails() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let isActive = true

    async function loadOrder() {
      setLoading(true)
      setError('')

      try {
        const nextOrder = await getOrder(normalizeOrderId(id))

        if (isActive) {
          setOrder(nextOrder)
        }
      } catch (requestError) {
        if (isActive) {
          setOrder(null)
          setError(getAdminApiErrorMessages(requestError).join(' '))
        }
      } finally {
        if (isActive) {
          setLoading(false)
        }
      }
    }

    loadOrder()

    return () => {
      isActive = false
    }
  }, [id])

  if (loading) {
    return (
      <div className="admin-layout">
        <AdminSidebar />

        <div className="admin-main">
          <AdminHeader />

          <main className="admin-dashboard order-details-page">
            <section className="order-details-heading">
              <div>
                <h1>Chargement de la commande</h1>
                <p>Lecture des donnees depuis la base.</p>
              </div>
            </section>
          </main>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="admin-layout">
        <AdminSidebar />

        <div className="admin-main">
          <AdminHeader />

          <main className="admin-dashboard order-details-page">
            <section className="order-details-heading">
              <div>
                <h1>Commande introuvable</h1>
                <p>
                  {error ||
                    'Aucune commande en base ne correspond a cet identifiant.'}
                </p>
              </div>
              <Link
                className="order-details-action order-details-action--primary"
                to="/admin/commandes"
              >
                Retour aux commandes
              </Link>
            </section>
          </main>
        </div>
      </div>
    )
  }

  const updateStatus = async (nextStatusKey) => {
    setError('')

    try {
      const savedOrder = await persistOrderStatus(order.id, nextStatusKey)

      setOrder(savedOrder)
      setNotice(`Statut mis a jour : ${orderStatusLabels[nextStatusKey]}.`)
    } catch (requestError) {
      setNotice('')
      setError(getAdminApiErrorMessages(requestError).join(' '))
    }
  }

  const progressIndex = timelineProgressByStatus[order.statusClass] ?? -1
  const trackingNumber =
    order.statusClass === 'shipped' || order.statusClass === 'delivered'
      ? `NVA-CASA-${normalizeOrderId(order.id)}`
      : 'Non attribue'

  return (
    <div className="admin-layout">
      <AdminSidebar />

      <div className="admin-main">
        <AdminHeader />

        <main className="admin-dashboard order-details-page">
          <section className="order-details-breadcrumb">
            <Link to="/admin">Accueil</Link>
            <ChevronRight size={14} strokeWidth={1.7} />
            <Link to="/admin/commandes">Commandes</Link>
            <ChevronRight size={14} strokeWidth={1.7} />
            <strong>Commande {order.id}</strong>
          </section>

          <section className="order-details-heading">
            <div className="order-details-heading__title">
              <Link
                className="order-details-back"
                to="/admin/commandes"
                aria-label="Retour aux commandes"
              >
                <ArrowLeft size={18} strokeWidth={1.8} />
              </Link>
              <div>
                <div className="order-details-title-line">
                  <h1>Commande {order.id}</h1>
                  <span
                    className={`orders-status orders-status--${order.statusClass}`}
                  >
                    {order.status}
                  </span>
                </div>
                <p>Commande passee le {order.date}</p>
              </div>
            </div>

            <div className="order-details-actions">
              {statusActions.map((action) => {
                const Icon = action.icon

                return (
                  <button
                    className={
                      action.primary
                        ? 'order-details-action order-details-action--primary'
                        : 'order-details-action'
                    }
                    key={action.statusKey}
                    type="button"
                    onClick={() => updateStatus(action.statusKey)}
                  >
                    <Icon size={16} strokeWidth={1.8} />
                    <span>{action.label}</span>
                  </button>
                )
              })}

              <button
                className="order-details-action order-details-action--danger"
                type="button"
                onClick={() => updateStatus('cancelled')}
              >
                <XCircle size={16} strokeWidth={1.8} />
                <span>Annuler</span>
              </button>
              <button
                className="order-details-action"
                type="button"
                onClick={() => printInvoice(order)}
              >
                <Download size={16} strokeWidth={1.8} />
                <span>Imprimer / telecharger facture</span>
              </button>
            </div>
          </section>

          {notice ? <p className="order-details-notice">{notice}</p> : null}
          {error ? (
            <div className="product-form-alert product-form-alert--error">
              {error}
            </div>
          ) : null}

          <section className="order-details-summary-grid">
            <div className="dashboard-card order-details-summary-card">
              <CalendarDays size={19} strokeWidth={1.7} />
              <span>Date</span>
              <strong>{order.date}</strong>
            </div>
            <div className="dashboard-card order-details-summary-card">
              <CreditCard size={19} strokeWidth={1.7} />
              <span>Paiement</span>
              <strong>{order.payment}</strong>
            </div>
            <div className="dashboard-card order-details-summary-card">
              <Truck size={19} strokeWidth={1.7} />
              <span>Livraison</span>
              <strong>{trackingNumber}</strong>
            </div>
            <div className="dashboard-card order-details-summary-card">
              <ReceiptText size={19} strokeWidth={1.7} />
              <span>Total</span>
              <strong>{order.amount}</strong>
            </div>
          </section>

          <section className="order-details-grid">
            <div className="order-details-main-column">
              <div className="dashboard-card order-details-card">
                <div className="order-details-card__header">
                  <h2>Resume de la commande</h2>
                </div>
                <div className="order-details-info-grid">
                  <DetailRow
                    label="Numero de commande"
                    value={order.orderNumber}
                  />
                  <DetailRow label="Date" value={order.date} />
                  <DetailRow label="Statut" value={order.status} />
                  <DetailRow label="Mode de paiement" value={order.payment} />
                  <DetailRow label="Mode de livraison" value="Standard 48h" />
                  <DetailRow label="Numero de suivi" value={trackingNumber} />
                </div>
              </div>

              <div className="dashboard-card order-details-card">
                <div className="order-details-card__header">
                  <h2>Produits commandes</h2>
                  <span>{order.products}</span>
                </div>
                <div className="order-details-table-wrap">
                  <table className="order-details-products-table">
                    <thead>
                      <tr>
                        <th>Produit</th>
                        <th>SKU</th>
                        <th>Prix unitaire</th>
                        <th>Qte</th>
                        <th>Sous-total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.length > 0 ? (
                        order.items.map((item) => (
                          <tr key={item.id}>
                            <td>
                              <div className="order-details-product-cell">
                                <div className="order-details-product-thumb order-details-product-thumb--sneakers" />
                                <div>
                                  <strong>{item.product_name}</strong>
                                  <span>
                                    {[item.size, item.color]
                                      .filter(Boolean)
                                      .join(' / ') || 'Article commande'}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td>{item.product_sku || '-'}</td>
                            <td>{`${Number(item.unit_price || 0).toLocaleString('fr-FR')} DH`}</td>
                            <td>{item.quantity}</td>
                            <td>
                              <strong>{`${Number(item.total_price || 0).toLocaleString('fr-FR')} DH`}</strong>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5">Aucun article trouve.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="dashboard-card order-details-card">
                <div className="order-details-card__header">
                  <h2>Chronologie</h2>
                </div>
                <div className="order-details-timeline">
                  {timelineItems.map(([key, label, detail], index) => {
                    const isComplete =
                      index <= progressIndex && order.statusClass !== 'cancelled'

                    return (
                      <div
                        className={
                          isComplete
                            ? 'order-details-timeline__item is-complete'
                            : 'order-details-timeline__item'
                        }
                        key={key}
                      >
                        <span />
                        <div>
                          <strong>{label}</strong>
                          <small>{detail}</small>
                        </div>
                      </div>
                    )
                  })}
                  {order.statusClass === 'cancelled' ? (
                    <div className="order-details-timeline__item is-cancelled">
                      <span />
                      <div>
                        <strong>Commande annulee</strong>
                        <small>Action enregistree en base</small>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <aside className="order-details-side-column">
              <div className="dashboard-card order-details-card">
                <div className="order-details-card__header">
                  <h2>Client</h2>
                  <Link to={`/admin/clients/${order.customerId}`}>
                    Voir le profil
                  </Link>
                </div>
                <div className="order-details-customer-card">
                  <div className="order-details-avatar">{order.initials}</div>
                  <div>
                    <strong>{order.customer}</strong>
                    <span>
                      <Mail size={14} strokeWidth={1.7} />
                      {order.customerEmail || 'Email non renseigne'}
                    </span>
                    <span>
                      <Phone size={14} strokeWidth={1.7} />
                      {order.customerPhone || 'Telephone non renseigne'}
                    </span>
                  </div>
                </div>
                <div className="order-details-customer-meta">
                  <div>
                    <UserRound size={16} strokeWidth={1.7} />
                    <span>Client NOVA</span>
                  </div>
                  <div>
                    <ReceiptText size={16} strokeWidth={1.7} />
                    <span>{order.products}</span>
                  </div>
                </div>
              </div>

              <div className="dashboard-card order-details-card">
                <div className="order-details-card__header">
                  <h2>Adresse de livraison</h2>
                </div>
                <div className="order-details-address">
                  <MapPin size={18} strokeWidth={1.8} />
                  <p>
                    <span>{order.customer}</span>
                    <span>
                      {order.shippingAddress?.address_line1 ||
                        'Adresse non renseignee'}
                    </span>
                    <span>
                      {[order.shippingAddress?.city, order.shippingAddress?.country]
                        .filter(Boolean)
                        .join(', ') || 'Ville non renseignee'}
                    </span>
                  </p>
                </div>
              </div>

              <div className="dashboard-card order-details-card">
                <div className="order-details-card__header">
                  <h2>Totaux</h2>
                </div>
                <div className="order-details-totals">
                  <div>
                    <span>Sous-total</span>
                    <strong>{order.subtotal}</strong>
                  </div>
                  <div>
                    <span>Livraison</span>
                    <strong>{order.shipping}</strong>
                  </div>
                  <div>
                    <span>Remise</span>
                    <strong>{order.discount}</strong>
                  </div>
                  <div className="order-details-totals__final">
                    <strong>Total</strong>
                    <strong>{order.amount}</strong>
                  </div>
                </div>
              </div>

              <div className="dashboard-card order-details-card order-details-delivery-card">
                <Clock3 size={18} strokeWidth={1.8} />
                <div>
                  <strong>Creneau estime</strong>
                  <span>2 oct. 2026, entre 10:00 et 14:00</span>
                </div>
              </div>
            </aside>
          </section>
        </main>
      </div>
    </div>
  )
}
