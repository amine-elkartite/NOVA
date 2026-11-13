import {
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Download,
  FileText,
  Monitor,
  ShoppingBag,
  ShoppingCart,
  Tablet,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import AdminHeader from '../../components/layout/AdminHeader.jsx'
import AdminSidebar from '../../components/layout/AdminSidebar.jsx'
import {
  getAdminAnalytics,
  getAdminApiErrorMessages,
} from '../../services/adminService.js'

const reportRanges = [
  ['current_month', 'Mois en cours'],
  ['last_7_days', 'Derniers 7 jours'],
  ['all', 'Toutes les dates'],
]

const categoryColors = [
  '#8b998c',
  '#354231',
  '#c7baa7',
  '#d8cebf',
  '#687466',
  '#ded7ca',
]

function formatNumber(value) {
  return Number(value || 0).toLocaleString('fr-FR').replace(/\u202f/g, ' ')
}

function formatPrice(value) {
  return `${formatNumber(value)} DH`
}

function createPoints(data, width, height, maxValue) {
  const safeData = data.length > 1 ? data : [0, ...data]

  return safeData.map((value, index) => ({
    x: (index / (safeData.length - 1)) * width,
    y: height - (value / maxValue) * height,
  }))
}

function createSmoothPath(points) {
  return points
    .map((point, index) => {
      if (index === 0) {
        return `M ${point.x} ${point.y}`
      }

      const previous = points[index - 1]
      const midX = (previous.x + point.x) / 2

      return `C ${midX} ${previous.y}, ${midX} ${point.y}, ${point.x} ${point.y}`
    })
    .join(' ')
}

function AnalyticsStatCard({
  icon: Icon,
  label,
  value,
  change,
  danger = false,
}) {
  const TrendIcon = danger ? TrendingDown : TrendingUp

  return (
    <div className="analytics-stat-card">
      <div className="analytics-stat-card__icon">
        <Icon size={28} strokeWidth={1.65} />
      </div>

      <div className="analytics-stat-card__content">
        <span>{label}</span>

        <div className="analytics-stat-card__value-row">
          <strong>{value}</strong>

          <small
            className={`analytics-stat-card__change ${
              danger ? 'is-danger' : ''
            }`}
          >
            <TrendIcon size={15} strokeWidth={1.8} />
            {change}
          </small>
        </div>

        <em>base de donnees</em>
      </div>
    </div>
  )
}

function SalesEvolutionChart({
  period,
  data,
}) {
  const width = 880
  const height = 210
  const stepByPeriod = {
    daily: 1,
    weekly: 2,
    monthly: 3,
  }
  const step = stepByPeriod[period] || 1
  const currentData = (data?.current || [0]).filter(
    (_, index) => index % step === 0,
  )
  const previousData = (data?.previous || [0]).filter(
    (_, index) => index % step === 0,
  )
  const labels = (data?.labels || ['DB']).filter(
    (_, index) => index % step === 0,
  )
  const maxValue = Math.max(
    1000,
    Math.ceil(Math.max(...currentData, ...previousData) / 1000) * 1000,
  )
  const currentPoints = createPoints(currentData, width, height, maxValue)
  const previousPoints = createPoints(previousData, width, height, maxValue)
  const currentPath = createSmoothPath(currentPoints)
  const previousPath = createSmoothPath(previousPoints)
  const areaPath = `${currentPath} L ${width} ${height} L 0 ${height} Z`

  return (
    <div className="analytics-line-chart">
      <div className="analytics-line-chart__body">
        <div className="analytics-line-chart__y-axis">
          <span>{formatNumber(maxValue)}</span>
          <span>{formatNumber(maxValue * 0.75)}</span>
          <span>{formatNumber(maxValue * 0.5)}</span>
          <span>{formatNumber(maxValue * 0.25)}</span>
          <span>0</span>
        </div>

        <div className="analytics-line-chart__graph">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <defs>
              <linearGradient
                id="analyticsSalesGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor="#40513f"
                  stopOpacity="0.16"
                />
                <stop
                  offset="100%"
                  stopColor="#40513f"
                  stopOpacity="0"
                />
              </linearGradient>
            </defs>

            {[0, 1, 2, 3, 4].map((line) => {
              const y = (line / 4) * height

              return (
                <line
                  key={`horizontal-${line}`}
                  x1="0"
                  y1={y}
                  x2={width}
                  y2={y}
                  className="analytics-line-chart__grid"
                />
              )
            })}

            <path
              d={areaPath}
              className="analytics-line-chart__area"
            />

            <path
              d={previousPath}
              className="analytics-line-chart__path analytics-line-chart__path--previous"
            />

            <path
              d={currentPath}
              className="analytics-line-chart__path analytics-line-chart__path--current"
            />
          </svg>

          <div className="analytics-line-chart__x-axis">
            {labels.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function UnavailableDonut({
  label,
}) {
  return (
    <div className="analytics-traffic">
      <div className="analytics-donut">
        <div className="analytics-donut__center">
          <strong>0</strong>
          <span>{label}</span>
        </div>
      </div>

      <div className="analytics-traffic__legend">
        <div>
          <span>
            <i style={{ background: '#687466' }} />
            Non disponible
          </span>
          <strong>0%</strong>
        </div>
      </div>
    </div>
  )
}

function CategoryBars({
  metric,
  categories,
}) {
  const maxValue = Math.max(
    1,
    ...categories.map((category) =>
      metric === 'sales' ? category.sales : category.revenue,
    ),
  )

  return (
    <div className="analytics-bars">
      <div className="analytics-bars__body">
        <div className="analytics-bars__y-axis">
          <span>{formatNumber(maxValue)}</span>
          <span>{formatNumber(maxValue * 0.75)}</span>
          <span>{formatNumber(maxValue * 0.5)}</span>
          <span>{formatNumber(maxValue * 0.25)}</span>
          <span>0</span>
        </div>

        <div className="analytics-bars__plot">
          <div className="analytics-bars__grid" />

          {categories.map((category, index) => {
            const value = metric === 'sales' ? category.sales : category.revenue

            return (
              <div
                className="analytics-bar"
                key={category.name}
              >
                <strong>
                  {metric === 'sales'
                    ? `${formatNumber(value)} ventes`
                    : formatPrice(value)}
                </strong>
                <span
                  style={{
                    height: `${Math.max((value / maxValue) * 100, 2)}%`,
                    background: categoryColors[index % categoryColors.length],
                  }}
                />
                <em>{category.name}</em>
              </div>
            )
          })}

          {categories.length === 0 ? (
            <div className="analytics-bar">
              <strong>0</strong>
              <span style={{ height: '2%', background: '#c7baa7' }} />
              <em>Aucune donnee</em>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function ProductThumb({
  src,
  alt,
}) {
  return (
    <div className="analytics-product-thumb analytics-product-thumb--sneakers">
      {src ? (
        <img
          src={src}
          alt={alt}
          onError={(event) => {
            event.currentTarget.style.display = 'none'
          }}
        />
      ) : null}
    </div>
  )
}

export default function Analytics() {
  const [period, setPeriod] = useState('daily')
  const [metric, setMetric] = useState('revenue')
  const [deviceMetric, setDeviceMetric] = useState('device')
  const [reportRangeIndex, setReportRangeIndex] = useState(0)
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const selectedRange = reportRanges[reportRangeIndex][0]
  const stats = analytics?.stats || {}
  const topProducts = analytics?.bestProducts || []
  const categories = analytics?.categorySales || []

  useEffect(() => {
    let isActive = true

    async function loadAnalytics() {
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

    loadAnalytics()

    return () => {
      isActive = false
    }
  }, [selectedRange])

  const statCards = useMemo(
    () => [
      {
        icon: FileText,
        label: "Chiffre d'affaires",
        value: formatPrice(stats.revenue),
        change: 'DB',
      },
      {
        icon: ShoppingCart,
        label: 'Commandes',
        value: formatNumber(stats.ordersCount),
        change: 'DB',
      },
      {
        icon: ShoppingBag,
        label: 'Panier moyen',
        value: formatPrice(stats.averageOrderValue),
        change: 'DB',
      },
      {
        icon: Users,
        label: 'Clients',
        value: formatNumber(stats.customersCount),
        change: 'DB',
      },
    ],
    [stats],
  )

  const selectedDistribution =
    deviceMetric === 'channel'
      ? [
          {
            icon: Monitor,
            label: 'Canal non disponible',
            percent: 0,
            orders: 'Schema non renseigne',
          },
        ]
      : [
          {
            icon: Tablet,
            label: 'Appareil non disponible',
            percent: 0,
            orders: 'Schema non renseigne',
          },
        ]

  const exportReport = () => {
    const rows = [
      ['Indicateur', 'Valeur'],
      ['Periode', reportRanges[reportRangeIndex][1]],
      ["Chiffre d'affaires", formatPrice(stats.revenue)],
      ['Commandes', formatNumber(stats.ordersCount)],
      ['Panier moyen', formatPrice(stats.averageOrderValue)],
      ['Clients', formatNumber(stats.customersCount)],
      ['Produits vendus', formatNumber(stats.productsSold)],
    ]
    const csv = rows
      .map((row) =>
        row
          .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
          .join(','),
      )
      .join('\n')
    const blob = new Blob([csv], {
      type: 'text/csv;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = 'rapport-analyses-nova.csv'
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="admin-layout">
      <AdminSidebar />

      <div className="admin-main">
        <AdminHeader />

        <main className="admin-dashboard analytics-page">
          <section className="analytics-page__breadcrumb">
            <span>Accueil</span>
            <ChevronRight size={14} strokeWidth={1.7} />
            <strong>Analyses</strong>
          </section>

          <section className="analytics-page__heading">
            <div>
              <h1>Analyses des performances</h1>

              <p>
                Suivez vos ventes, vos commandes et vos tendances.
              </p>
            </div>

            <div className="analytics-page__actions">
              <button
                className="analytics-date-button"
                type="button"
                onClick={() =>
                  setReportRangeIndex((currentIndex) =>
                    currentIndex + 1 >= reportRanges.length
                      ? 0
                      : currentIndex + 1,
                  )
                }
              >
                <CalendarDays size={17} strokeWidth={1.8} />
                <span>{reportRanges[reportRangeIndex][1]}</span>
                <span className="analytics-date-button__static" hidden>
                  <span>Mois en cours</span>
                </span>
                <ChevronDown size={16} strokeWidth={1.7} />
              </button>

              <button
                className="analytics-export-button"
                type="button"
                onClick={exportReport}
              >
                <Download size={17} strokeWidth={1.8} />
                <span>Exporter le rapport</span>
              </button>
            </div>
          </section>

          {loading ? (
            <p className="admin-local-notice">
              Chargement des analyses depuis la base de donnees...
            </p>
          ) : null}

          {error ? (
            <div className="product-form-alert product-form-alert--error">
              {error}
            </div>
          ) : null}

          <section className="analytics-stats">
            {statCards.map((stat) => (
              <AnalyticsStatCard
                key={stat.label}
                {...stat}
              />
            ))}
          </section>

          <section className="analytics-top-grid">
            <div className="dashboard-card analytics-sales-card">
              <div className="analytics-card-header">
                <h2>Evolution des ventes</h2>

                <div className="analytics-card-header__tools">
                  <div className="analytics-legend">
                    <span>
                      <i className="analytics-legend__dot analytics-legend__dot--current" />
                      Periode actuelle
                    </span>
                    <span>
                      <i className="analytics-legend__dot analytics-legend__dot--previous" />
                      Periode precedente
                    </span>
                  </div>

                  <label className="analytics-select">
                    <span className="sr-only">
                      Periode du graphique
                    </span>
                    <select
                      value={period}
                      onChange={(event) =>
                        setPeriod(event.target.value)
                      }
                    >
                      <option value="daily">Journalier</option>
                      <option value="weekly">Hebdomadaire</option>
                      <option value="monthly">Mensuel</option>
                    </select>
                    <ChevronDown size={15} strokeWidth={1.7} />
                  </label>
                </div>
              </div>

              <SalesEvolutionChart
                period={period}
                data={analytics?.salesChart}
              />
            </div>

            <div className="dashboard-card analytics-traffic-card">
              <h2>Sources de trafic</h2>
              <UnavailableDonut label="Trafic" />
            </div>
          </section>

          <section className="analytics-bottom-grid">
            <div className="dashboard-card analytics-category-card">
              <div className="analytics-card-header">
                <h2>Ventes par categorie</h2>

                <label className="analytics-select">
                  <span className="sr-only">
                    Metrique par categorie
                  </span>
                  <select
                    value={metric}
                    onChange={(event) =>
                      setMetric(event.target.value)
                    }
                  >
                    <option value="revenue">
                      Chiffre d'affaires
                    </option>
                    <option value="sales">Ventes</option>
                  </select>
                  <ChevronDown size={15} strokeWidth={1.7} />
                </label>
              </div>

              <CategoryBars metric={metric} categories={categories} />
            </div>

            <div className="dashboard-card analytics-products-card">
              <div className="analytics-card-header">
                <h2>Produits les plus performants</h2>

                <Link
                  className="analytics-link"
                  to="/admin/produits"
                >
                  Voir tout
                </Link>
              </div>

              <div className="analytics-products-table-wrap">
                <table className="analytics-products-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Produit</th>
                      <th>Ventes</th>
                      <th>Chiffre d'affaires</th>
                    </tr>
                  </thead>

                  <tbody>
                    {topProducts.map((product) => (
                      <tr key={product.id || product.name}>
                        <td>{product.rank}</td>

                        <td>
                          <div className="analytics-product-cell">
                            <ProductThumb
                              src={product.image}
                              alt={product.name}
                            />
                            <span>{product.name}</span>
                          </div>
                        </td>

                        <td>{formatNumber(product.sales)} ventes</td>
                        <td>
                          <strong>{formatPrice(product.revenue)}</strong>
                        </td>
                      </tr>
                    ))}

                    {topProducts.length === 0 ? (
                      <tr>
                        <td colSpan="4">Aucun produit vendu.</td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="dashboard-card analytics-devices-card">
              <div className="analytics-card-header">
                <h2>Repartition des commandes</h2>

                <label className="analytics-select">
                  <span className="sr-only">
                    Repartition par
                  </span>
                  <select
                    value={deviceMetric}
                    onChange={(event) =>
                      setDeviceMetric(event.target.value)
                    }
                  >
                    <option value="device">Par appareil</option>
                    <option value="channel">Par canal</option>
                  </select>
                  <ChevronDown size={15} strokeWidth={1.7} />
                </label>
              </div>

              <div className="analytics-device-list">
                {selectedDistribution.map((device) => {
                  const Icon = device.icon

                  return (
                    <div
                      className="analytics-device-item"
                      key={device.label}
                    >
                      <div className="analytics-device-item__icon">
                        <Icon size={25} strokeWidth={1.7} />
                      </div>

                      <div className="analytics-device-item__body">
                        <div className="analytics-device-item__top">
                          <strong>{device.label}</strong>
                          <span>{device.percent}%</span>
                        </div>

                        <div className="analytics-device-progress">
                          <span
                            style={{
                              width: `${device.percent}%`,
                            }}
                          />
                        </div>

                        <small>{device.orders}</small>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
