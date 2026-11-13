import {
  CalendarDays,
  ClipboardList,
  FileText,
  MoreHorizontal,
  ShoppingCart,
  Tag,
  Users,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import AdminSidebar from '../../components/layout/AdminSidebar'
import AdminHeader from '../../components/layout/AdminHeader'
import StatCard from '../../components/admin/StatCard'
import SalesChart from '../../components/admin/SalesChart'
import StatusChart from '../../components/admin/StatusChart'
import {
  getAdminAnalytics,
  getAdminApiErrorMessages,
} from '../../services/adminService.js'

const dateRanges = [
  ['current_month', 'Mois en cours'],
  ['last_7_days', 'Derniers 7 jours'],
  ['all', 'Toutes les dates'],
]

function formatNumber(value) {
  return Number(value || 0).toLocaleString('fr-FR').replace(/\u202f/g, ' ')
}

function formatPrice(value) {
  return `${formatNumber(value)} DH`
}

export default function Dashboard() {
  const [dateRangeIndex, setDateRangeIndex] = useState(0)
  const [chartPeriod, setChartPeriod] = useState('monthly')
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const selectedRange = dateRanges[dateRangeIndex][0]
  const stats = analytics?.stats || {}
  const latestOrders = analytics?.latestOrders || []
  const bestProducts = analytics?.bestProducts || []

  useEffect(() => {
    let isActive = true

    async function loadDashboard() {
      setLoading(true)
      setError('')

      try {
        const data = await getAdminAnalytics(selectedRange)

        if (isActive) {
          setAnalytics(data)
        }
      } catch (requestError) {
        if (isActive) {
          setError(getAdminApiErrorMessages(requestError).join(' '))
        }
      } finally {
        if (isActive) {
          setLoading(false)
        }
      }
    }

    loadDashboard()

    return () => {
      isActive = false
    }
  }, [selectedRange])

  return (
    <div className="admin-layout">
      <AdminSidebar />

      <div className="admin-main">
        <AdminHeader />

        <main className="admin-dashboard">
          <section className="dashboard-heading">
            <div>
              <p className="dashboard-welcome">
                Bienvenue
              </p>

              <h1>Tableau de bord</h1>
            </div>

            <button
              className="dashboard-date-filter"
              type="button"
              onClick={() =>
                setDateRangeIndex((currentIndex) =>
                  currentIndex + 1 >= dateRanges.length
                    ? 0
                    : currentIndex + 1,
                )
              }
            >
              <CalendarDays
                size={18}
                strokeWidth={1.8}
              />

              <span>{dateRanges[dateRangeIndex][1]}</span>

              <span className="dashboard-date-filter__static" hidden>
                Mois en cours
              </span>

              <span className="dashboard-date-filter__arrow">
                v
              </span>
            </button>
          </section>

          {loading ? (
            <p className="admin-local-notice">
              Chargement des statistiques depuis la base de donnees...
            </p>
          ) : null}

          {error ? (
            <div className="product-form-alert product-form-alert--error">
              {error}
            </div>
          ) : null}

          <section className="dashboard-stats">
            <StatCard
              icon={ShoppingCart}
              value={formatNumber(stats.ordersCount)}
              label="Commandes"
              growth="DB"
            />

            <StatCard
              icon={Users}
              value={formatNumber(stats.customersCount)}
              label="Clients"
              growth="DB"
            />

            <StatCard
              icon={Tag}
              value={formatNumber(stats.productsSold)}
              label="Produits vendus"
              growth="DB"
            />

            <StatCard
              icon={FileText}
              value={formatPrice(stats.revenue)}
              label="Chiffre d'affaires"
              growth="DB"
            />
          </section>

          <section className="dashboard-grid">
            <div className="dashboard-left">
              <div className="dashboard-card dashboard-sales-card">
                <div className="dashboard-card__header">
                  <h2>Ventes</h2>

                  <div className="sales-card__actions">
                    <div className="sales-card__legend">
                      <span>
                        <i className="legend-dot legend-dot--current" />
                        Periode actuelle
                      </span>

                      <span>
                        <i className="legend-dot legend-dot--previous" />
                        Periode precedente
                      </span>
                    </div>

                    <select
                      value={chartPeriod}
                      onChange={(event) =>
                        setChartPeriod(event.target.value)
                      }
                    >
                      <option value="monthly">
                        Mensuel
                      </option>

                      <option value="weekly">
                        Hebdomadaire
                      </option>

                      <option value="daily">
                        Journalier
                      </option>
                    </select>
                  </div>
                </div>

                <SalesChart
                  period={chartPeriod}
                  data={analytics?.salesChart}
                />
              </div>

              <div className="dashboard-card latest-orders">
                <div className="dashboard-card__header">
                  <h2>
                    Dernieres commandes
                  </h2>

                  <Link
                    className="dashboard-link"
                    to="/admin/commandes"
                  >
                    Voir tout
                  </Link>
                </div>

                <div className="latest-orders__table-wrap">
                  <table className="latest-orders__table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Client</th>
                        <th>Produits</th>
                        <th>Montant</th>
                        <th>Statut</th>
                        <th>Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {latestOrders.map((order) => (
                        <tr key={order.rawId || order.id}>
                          <td>{order.id}</td>

                          <td>
                            <div className="client-cell">
                              <div className="client-avatar">
                                {order.initials}
                              </div>

                              <span>{order.customer}</span>
                            </div>
                          </td>

                          <td>{order.products}</td>

                          <td>{order.amount}</td>

                          <td>
                            <span className={`status-badge status-badge--${order.statusClass}`}>
                              {order.status}
                            </span>
                          </td>

                          <td>{order.date}</td>

                          <td>
                            <Link
                              className="dashboard-row-action"
                              to={`/admin/commandes/${String(
                                order.rawId || order.id,
                              ).replace('#', '')}`}
                              aria-label={`Voir la commande ${order.id}`}
                            >
                              <MoreHorizontal size={18} strokeWidth={1.8} />
                            </Link>
                          </td>
                        </tr>
                      ))}

                      {latestOrders.length === 0 ? (
                        <tr>
                          <td colSpan="7">Aucune commande trouvee.</td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <aside className="dashboard-right">
              <div className="dashboard-card sales-distribution">
                <h2>
                  Repartition des ventes
                </h2>

                <div className="sales-distribution__content">
                  <div className="donut-chart">
                    <div className="donut-chart__center">
                      <strong>
                        {formatPrice(stats.revenue)}
                      </strong>

                      <span>Total</span>
                    </div>
                  </div>

                  <div className="sales-distribution__legend">
                    <div>
                      <span>
                        <i className="legend-dot legend-dot--web" />
                        Non disponible
                      </span>

                      <strong>0%</strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className="dashboard-card order-status-card">
                <div className="dashboard-card__header">
                  <h2>
                    Statut des commandes
                  </h2>

                  <Link
                    className="dashboard-link"
                    to="/admin/commandes"
                  >
                    Voir tout
                  </Link>
                </div>

                <StatusChart data={analytics?.statusChart || []} />
              </div>

              <div className="dashboard-card best-products-card">
                <div className="dashboard-card__header">
                  <h2>
                    Produits les plus vendus
                  </h2>

                  <Link
                    className="dashboard-link"
                    to="/admin/produits"
                  >
                    Voir tout
                  </Link>
                </div>

                <div className="best-products-list">
                  {bestProducts.map((product) => (
                    <div
                      className="best-product-item"
                      key={product.id || product.name}
                    >
                      <div className="best-product-item__image">
                        <ClipboardList
                          size={19}
                          strokeWidth={1.6}
                        />
                      </div>

                      <div className="best-product-item__info">
                        <strong>
                          {product.name}
                        </strong>

                        <span>
                          {formatNumber(product.sales)} ventes
                        </span>
                      </div>

                      <strong className="best-product-item__price">
                        {formatPrice(product.price)}
                      </strong>
                    </div>
                  ))}

                  {bestProducts.length === 0 ? (
                    <div className="best-product-item">
                      <div className="best-product-item__image">
                        <ClipboardList
                          size={19}
                          strokeWidth={1.6}
                        />
                      </div>

                      <div className="best-product-item__info">
                        <strong>Aucun produit vendu</strong>
                        <span>Base de donnees</span>
                      </div>

                      <strong className="best-product-item__price">
                        0 DH
                      </strong>
                    </div>
                  ) : null}
                </div>
              </div>
            </aside>
          </section>
        </main>
      </div>
    </div>
  )
}
