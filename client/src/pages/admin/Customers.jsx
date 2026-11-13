import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  MoreHorizontal,
  Plus,
  Search,
  ShoppingBag,
  User,
  UserRoundX,
  Users,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import AdminSidebar from '../../components/layout/AdminSidebar.jsx'
import AdminHeader from '../../components/layout/AdminHeader.jsx'
import {
  getAdminApiErrorMessages,
  getCustomers,
  updateCustomerStatus as persistCustomerStatus,
} from '../../services/adminService.js'

function AdminStatCard({
  icon: Icon,
  value,
  label,
  growth,
  danger = false,
}) {
  return (
    <div className="admin-listing-stat-card">
      <div className="admin-listing-stat-card__icon">
        <Icon size={28} strokeWidth={1.6} />
      </div>
      <div className="admin-listing-stat-card__content">
        <div className="admin-listing-stat-card__top">
          <strong>{value}</strong>
          {growth ? (
            <span
              className={`admin-listing-stat-card__growth ${
                danger ? 'is-danger' : ''
              }`}
            >
              ↗ {growth}
            </span>
          ) : null}
        </div>
        <div className="admin-listing-stat-card__bottom">
          <span>{label}</span>
          {growth ? <small>base de donnees</small> : null}
        </div>
      </div>
    </div>
  )
}

function formatAmount(amount) {
  return new Intl.NumberFormat('fr-FR').format(amount).replace(/\u202f/g, ' ')
}

export default function Customers() {
  const navigate = useNavigate()
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [apiError, setApiError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [cityFilter, setCityFilter] = useState('all')
  const [sortBy, setSortBy] = useState('recent')
  const [selectedIds, setSelectedIds] = useState([])
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(8)
  const [openMenuId, setOpenMenuId] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [notice, setNotice] = useState('')
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
  })

  useEffect(() => {
    let isActive = true

    async function loadCustomers() {
      setLoading(true)
      setApiError('')

      try {
        const nextCustomers = await getCustomers()

        if (isActive) {
          setCustomers(nextCustomers)
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

    loadCustomers()

    return () => {
      isActive = false
    }
  }, [])

  const cities = useMemo(
    () =>
      Array.from(
        new Set(customers.map((customer) => customer.city).filter(Boolean)),
      ),
    [customers],
  )

  const filteredCustomers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    return customers
      .filter((customer) => {
        const matchesSearch =
          customer.name.toLowerCase().includes(normalizedSearch) ||
          customer.email.toLowerCase().includes(normalizedSearch) ||
          String(customer.phone || '').toLowerCase().includes(normalizedSearch)
        const matchesStatus =
          statusFilter === 'all' || customer.statusType === statusFilter
        const matchesCity =
          cityFilter === 'all' || customer.city === cityFilter

        return matchesSearch && matchesStatus && matchesCity
      })
      .sort((first, second) => {
        if (sortBy === 'name') {
          return first.name.localeCompare(second.name)
        }

        if (sortBy === 'orders-desc') {
          return second.orders - first.orders
        }

        if (sortBy === 'spent-desc') {
          return second.spent - first.spent
        }

        return Number(first.id) - Number(second.id)
      })
  }, [cityFilter, customers, searchTerm, sortBy, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / perPage))
  const safePage = Math.min(page, totalPages)
  const visibleCustomers = filteredCustomers.slice(
    (safePage - 1) * perPage,
    safePage * perPage,
  )
  const allVisibleSelected =
    visibleCustomers.length > 0 &&
    visibleCustomers.every((customer) => selectedIds.includes(customer.id))
  const hasActiveFilters =
    searchTerm.trim() ||
    statusFilter !== 'all' ||
    cityFilter !== 'all' ||
    sortBy !== 'recent'

  const resetToFirstPage = (setter) => (event) => {
    setter(event.target.value)
    setPage(1)
    setSelectedIds([])
  }

  const toggleAllVisible = () => {
    setSelectedIds((currentIds) => {
      if (allVisibleSelected) {
        return currentIds.filter(
          (id) => !visibleCustomers.some((customer) => customer.id === id),
        )
      }

      return Array.from(
        new Set([
          ...currentIds,
          ...visibleCustomers.map((customer) => customer.id),
        ]),
      )
    })
  }

  const toggleCustomer = (customerId) => {
    setSelectedIds((currentIds) =>
      currentIds.includes(customerId)
        ? currentIds.filter((id) => id !== customerId)
        : [...currentIds, customerId],
    )
  }

  const resetFilters = () => {
    setSearchTerm('')
    setStatusFilter('all')
    setCityFilter('all')
    setSortBy('recent')
    setSelectedIds([])
    setPage(1)
  }

  const addCustomer = (event) => {
    event.preventDefault()

    if (!newCustomer.name.trim() || !newCustomer.email.trim()) {
      setNotice('Nom et email client requis.')
      return
    }

    setNotice(
      'Creation client depuis admin non disponible dans le backend actuel. Utilisez le flux inscription client.',
    )
  }

  const toggleCustomerStatus = async (customer) => {
    const nextStatus =
      customer.statusType === 'active' ? 'inactive' : 'active'

    setApiError('')

    try {
      const savedCustomer = await persistCustomerStatus(
        customer.id,
        nextStatus,
      )

      setCustomers((currentCustomers) =>
        currentCustomers.map((currentCustomer) =>
          currentCustomer.id === customer.id
            ? savedCustomer
            : currentCustomer,
        ),
      )
      setNotice(`${customer.name} mis a jour en base.`)
    } catch (error) {
      setNotice('')
      setApiError(getAdminApiErrorMessages(error).join(' '))
    } finally {
      setOpenMenuId(null)
    }
  }

  const activeCount = customers.filter(
    (customer) => customer.statusType === 'active',
  ).length
  const inactiveCount = customers.filter(
    (customer) => customer.statusType !== 'active',
  ).length

  return (
    <div className="admin-layout">
      <AdminSidebar />

      <div className="admin-main">
        <AdminHeader />

        <main className="admin-dashboard customers-admin-page admin-listing-page">
          <section className="admin-listing-breadcrumb">
            <span>Accueil</span>
            <ChevronRight size={14} strokeWidth={1.7} />
            <strong>Clients</strong>
          </section>

          <section className="admin-listing-heading">
            <div>
              <h1>Gestion des clients</h1>
              <p>Consultez et gerez vos clients facilement.</p>
            </div>

            <button
              className="admin-listing-add-button customers-admin-add-button"
              type="button"
              onClick={() => setShowAddForm((isOpen) => !isOpen)}
            >
              <Plus size={18} strokeWidth={1.8} />
              <span>Ajouter un client</span>
            </button>
          </section>

          {notice ? <p className="admin-local-notice">{notice}</p> : null}
          {loading ? (
            <p className="admin-local-notice">
              Chargement des clients depuis la base de donnees...
            </p>
          ) : null}
          {apiError ? (
            <div className="product-form-alert product-form-alert--error">
              {apiError}
            </div>
          ) : null}

          {showAddForm ? (
            <form className="dashboard-card admin-inline-form" onSubmit={addCustomer}>
              <input
                value={newCustomer.name}
                placeholder="Nom complet"
                onChange={(event) =>
                  setNewCustomer((currentCustomer) => ({
                    ...currentCustomer,
                    name: event.target.value,
                  }))
                }
              />
              <input
                value={newCustomer.email}
                type="email"
                placeholder="Email"
                onChange={(event) =>
                  setNewCustomer((currentCustomer) => ({
                    ...currentCustomer,
                    email: event.target.value,
                  }))
                }
              />
              <input
                value={newCustomer.phone}
                placeholder="Telephone"
                onChange={(event) =>
                  setNewCustomer((currentCustomer) => ({
                    ...currentCustomer,
                    phone: event.target.value,
                  }))
                }
              />
              <input
                value={newCustomer.city}
                placeholder="Ville"
                onChange={(event) =>
                  setNewCustomer((currentCustomer) => ({
                    ...currentCustomer,
                    city: event.target.value,
                  }))
                }
              />
              <button type="submit">Creer</button>
            </form>
          ) : null}

          <section className="admin-listing-stats">
            <AdminStatCard
              icon={User}
              value={customers.length}
              label="Clients total"
              growth="+ DB"
            />
            <AdminStatCard icon={Users} value={activeCount} label="Actifs" />
            <AdminStatCard
              icon={ShoppingBag}
              value={customers.reduce(
                (total, customer) => total + customer.orders,
                0,
              )}
              label="Commandes"
            />
            <AdminStatCard
              icon={UserRoundX}
              value={inactiveCount}
              label="Inactifs"
              danger
            />
          </section>

          <section className="dashboard-card admin-listing-table-card customers-admin-table-card">
            <div className="admin-listing-filters">
              <div className="admin-listing-search">
                <Search size={18} strokeWidth={1.7} />
                <input
                  type="search"
                  value={searchTerm}
                  placeholder="Rechercher un client..."
                  onChange={resetToFirstPage(setSearchTerm)}
                />
              </div>

              <label className="admin-listing-select">
                <span className="sr-only">Filtrer par statut</span>
                <select
                  value={statusFilter}
                  onChange={resetToFirstPage(setStatusFilter)}
                >
                  <option value="all">Tous les statuts</option>
                  <option value="active">Actifs</option>
                  <option value="inactive">Inactifs</option>
                  <option value="blocked">Bloques</option>
                </select>
                <ChevronDown size={16} />
              </label>

              <label className="admin-listing-select">
                <span className="sr-only">Filtrer par ville</span>
                <select value={cityFilter} onChange={resetToFirstPage(setCityFilter)}>
                  <option value="all">Toutes les villes</option>
                  {cities.map((city) => (
                    <option value={city} key={city}>
                      {city}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} />
              </label>

              <label className="admin-listing-select">
                <span className="sr-only">Trier les clients</span>
                <select value={sortBy} onChange={resetToFirstPage(setSortBy)}>
                  <option value="recent">Trier par</option>
                  <option value="name">Nom</option>
                  <option value="orders-desc">Plus de commandes</option>
                  <option value="spent-desc">Montant depense</option>
                </select>
                <ChevronDown size={16} />
              </label>

              <button
                className="admin-listing-filter-button"
                type="button"
                onClick={resetFilters}
              >
                <Filter size={17} strokeWidth={1.7} />
                <span>{hasActiveFilters ? 'Reinitialiser' : 'Filtrer'}</span>
              </button>
            </div>

            <div className="admin-listing-table-wrap">
              <table className="admin-listing-table customers-admin-table">
                <thead>
                  <tr>
                    <th className="admin-listing-table__checkbox">
                      <input
                        type="checkbox"
                        aria-label="Selectionner tous les clients visibles"
                        checked={allVisibleSelected}
                        onChange={toggleAllVisible}
                      />
                    </th>
                    <th>Client</th>
                    <th>Email</th>
                    <th>Telephone</th>
                    <th>Ville</th>
                    <th>Total commandes</th>
                    <th>Montant depense</th>
                    <th>Statut</th>
                    <th>Date d'inscription</th>
                    <th className="admin-listing-table__actions-title">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {visibleCustomers.map((customer) => (
                    <tr key={customer.id}>
                      <td className="admin-listing-table__checkbox">
                        <input
                          type="checkbox"
                          aria-label={`Selectionner ${customer.name}`}
                          checked={selectedIds.includes(customer.id)}
                          onChange={() => toggleCustomer(customer.id)}
                        />
                      </td>
                      <td>
                        <div className="customers-admin-client">
                          <div className="customers-admin-avatar">
                            {customer.initials}
                          </div>
                          <strong>{customer.name}</strong>
                        </div>
                      </td>
                      <td className="admin-listing-muted-cell">
                        {customer.email}
                      </td>
                      <td>{customer.phone}</td>
                      <td className="admin-listing-muted-cell">
                        {customer.city}
                      </td>
                      <td>{customer.orders}</td>
                      <td>{formatAmount(customer.spent)} DH</td>
                      <td>
                        <span
                          className={`admin-listing-status admin-listing-status--${customer.statusType}`}
                        >
                          {customer.status}
                        </span>
                      </td>
                      <td className="admin-listing-muted-cell">
                        {customer.date}
                      </td>
                      <td>
                        <div className="admin-listing-actions customers-admin-actions">
                          <button
                            type="button"
                            aria-label={`Voir ${customer.name}`}
                            onClick={() =>
                              navigate(`/admin/clients/${customer.id}`)
                            }
                          >
                            <Eye size={18} strokeWidth={1.8} />
                          </button>
                          <div className="admin-row-menu">
                            <button
                              type="button"
                              aria-label={`Plus d'actions pour ${customer.name}`}
                              onClick={() =>
                                setOpenMenuId((currentId) =>
                                  currentId === customer.id
                                    ? null
                                    : customer.id,
                                )
                              }
                            >
                              <MoreHorizontal size={19} strokeWidth={1.8} />
                            </button>
                            {openMenuId === customer.id ? (
                              <div className="admin-row-menu__panel">
                                <button
                                  type="button"
                                  onClick={() => toggleCustomerStatus(customer)}
                                >
                                  {customer.statusType !== 'active'
                                    ? 'Reactiver'
                                    : 'Desactiver'}
                                </button>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {visibleCustomers.length === 0 ? (
                    <tr>
                      <td className="admin-listing-table__empty" colSpan="10">
                        {loading
                          ? 'Chargement des clients...'
                          : 'Aucun client trouve'}
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            <div className="admin-listing-pagination customers-admin-pagination">
              <span>
                Affichage de{' '}
                {filteredCustomers.length === 0
                  ? 0
                  : (safePage - 1) * perPage + 1}{' '}
                a {Math.min(safePage * perPage, filteredCustomers.length)} sur{' '}
                {filteredCustomers.length} clients
              </span>

              <div className="admin-listing-pagination__pages">
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

              <label className="admin-listing-per-page">
                <span>Clients par page</span>
                <select
                  value={perPage}
                  onChange={(event) => {
                    setPerPage(Number(event.target.value))
                    setPage(1)
                  }}
                >
                  {[4, 8, 16].map((option) => (
                    <option value={option} key={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <ChevronDown size={15} />
              </label>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
