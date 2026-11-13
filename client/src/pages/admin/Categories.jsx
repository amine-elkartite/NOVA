import {
  Box,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Eye,
  Filter,
  Folder,
  MoreHorizontal,
  Package,
  Plus,
  Search,
  Tag,
  Trash2,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import AdminSidebar from '../../components/layout/AdminSidebar.jsx'
import AdminHeader from '../../components/layout/AdminHeader.jsx'
import {
  deleteCategory as deleteCategoryRequest,
  getAdminApiErrorMessages,
  getCategories,
  upsertCategory,
} from '../../services/adminService.js'

function AdminStatCard({ icon: Icon, value, label, growth }) {
  return (
    <div className="admin-listing-stat-card">
      <div className="admin-listing-stat-card__icon">
        <Icon size={28} strokeWidth={1.6} />
      </div>
      <div className="admin-listing-stat-card__content">
        <div className="admin-listing-stat-card__top">
          <strong>{value}</strong>
          {growth ? (
            <span className="admin-listing-stat-card__growth">↗ {growth}</span>
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

function CategoryImage({ category }) {
  return (
    <div
      className={`categories-admin-image categories-admin-image--${category.fallback}`}
    >
      {category.image ? (
        <img
          src={category.image}
          alt={category.name}
          onError={(event) => {
            event.currentTarget.style.display = 'none'
          }}
        />
      ) : (
        <Box size={20} strokeWidth={1.6} />
      )}
    </div>
  )
}

export default function Categories() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [apiError, setApiError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('recent')
  const [selectedIds, setSelectedIds] = useState([])
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(8)
  const [openMenuId, setOpenMenuId] = useState(null)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let isActive = true

    async function loadCategories() {
      setLoading(true)
      setApiError('')

      try {
        const nextCategories = await getCategories()

        if (isActive) {
          setCategories(nextCategories)
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

    loadCategories()

    return () => {
      isActive = false
    }
  }, [])

  const filteredCategories = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    return categories
      .filter((category) => {
        const matchesSearch =
          category.name.toLowerCase().includes(normalizedSearch) ||
          category.description.toLowerCase().includes(normalizedSearch) ||
          category.slug?.toLowerCase().includes(normalizedSearch)
        const matchesStatus =
          statusFilter === 'all' || category.statusType === statusFilter

        return matchesSearch && matchesStatus
      })
      .sort((first, second) => {
        if (sortBy === 'name') {
          return first.name.localeCompare(second.name)
        }

        if (sortBy === 'products-desc') {
          return second.products - first.products
        }

        if (sortBy === 'products-asc') {
          return first.products - second.products
        }

        return Number(first.id) - Number(second.id)
      })
  }, [categories, searchTerm, sortBy, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filteredCategories.length / perPage))
  const safePage = Math.min(page, totalPages)
  const visibleCategories = filteredCategories.slice(
    (safePage - 1) * perPage,
    safePage * perPage,
  )
  const allVisibleSelected =
    visibleCategories.length > 0 &&
    visibleCategories.every((category) => selectedIds.includes(category.id))
  const hasActiveFilters =
    searchTerm.trim() || statusFilter !== 'all' || sortBy !== 'recent'

  const resetToFirstPage = (setter) => (event) => {
    setter(event.target.value)
    setPage(1)
    setSelectedIds([])
  }

  const toggleAllVisible = () => {
    setSelectedIds((currentIds) => {
      if (allVisibleSelected) {
        return currentIds.filter(
          (id) => !visibleCategories.some((category) => category.id === id),
        )
      }

      return Array.from(
        new Set([
          ...currentIds,
          ...visibleCategories.map((category) => category.id),
        ]),
      )
    })
  }

  const toggleCategory = (categoryId) => {
    setSelectedIds((currentIds) =>
      currentIds.includes(categoryId)
        ? currentIds.filter((id) => id !== categoryId)
        : [...currentIds, categoryId],
    )
  }

  const resetFilters = () => {
    setSearchTerm('')
    setStatusFilter('all')
    setSortBy('recent')
    setSelectedIds([])
    setPage(1)
  }

  const deleteCategory = async (category) => {
    if (
      !window.confirm(
        `Supprimer ${category.name} de la base de donnees ?`,
      )
    ) {
      return
    }

    setApiError('')

    try {
      await deleteCategoryRequest(category.id)

      setCategories((currentCategories) =>
        currentCategories.filter(
          (currentCategory) => currentCategory.id !== category.id,
        ),
      )
      setSelectedIds((currentIds) =>
        currentIds.filter((id) => id !== category.id),
      )
      setNotice(`${category.name} supprimee en base.`)
    } catch (error) {
      setNotice('')
      setApiError(getAdminApiErrorMessages(error).join(' '))
    } finally {
      setOpenMenuId(null)
    }
  }

  const toggleStatus = async (category) => {
    const nextStatus =
      category.statusType === 'active' ? 'inactive' : 'active'

    setApiError('')

    try {
      const savedCategory = await upsertCategory({
        ...category,
        statusType: nextStatus,
      })

      setCategories((currentCategories) =>
        currentCategories.map((currentCategory) =>
          currentCategory.id === category.id
            ? savedCategory
            : currentCategory,
        ),
      )
      setNotice(`${category.name} mise a jour en base.`)
    } catch (error) {
      setNotice('')
      setApiError(getAdminApiErrorMessages(error).join(' '))
    } finally {
      setOpenMenuId(null)
    }
  }

  const inactiveCount = categories.filter(
    (category) => category.statusType === 'inactive',
  ).length

  return (
    <div className="admin-layout">
      <AdminSidebar />

      <div className="admin-main">
        <AdminHeader />

        <main className="admin-dashboard categories-admin-page admin-listing-page">
          <section className="admin-listing-breadcrumb">
            <span>Accueil</span>
            <ChevronRight size={14} strokeWidth={1.7} />
            <strong>Categories</strong>
          </section>

          <section className="admin-listing-heading">
            <div>
              <h1>Gestion des categories</h1>
              <p>
                Organisez vos produits par categories pour une meilleure
                experience d'achat.
              </p>
            </div>

            <button
              className="admin-listing-add-button"
              type="button"
              onClick={() => navigate('/admin/categories/nouvelle')}
            >
              <Plus size={18} strokeWidth={1.8} />
              <span>Ajouter une categorie</span>
            </button>
          </section>

          {notice ? <p className="admin-local-notice">{notice}</p> : null}
          {loading ? (
            <p className="admin-local-notice">
              Chargement des categories depuis la base de donnees...
            </p>
          ) : null}
          {apiError ? (
            <div className="product-form-alert product-form-alert--error">
              {apiError}
            </div>
          ) : null}

          <section className="admin-listing-stats">
            <AdminStatCard
              icon={Folder}
              value={categories.length}
              label="Categories"
              growth="+ DB"
            />
            <AdminStatCard
              icon={Package}
              value={categories.reduce(
                (total, category) => total + Number(category.products || 0),
                0,
              )}
              label="Produits"
            />
            <AdminStatCard
              icon={Eye}
              value="24 580"
              label="Vues"
            />
            <AdminStatCard
              icon={Tag}
              value={inactiveCount}
              label="Categories inactives"
            />
          </section>

          <section className="dashboard-card admin-listing-table-card categories-admin-table-card">
            <div className="admin-listing-filters">
              <div className="admin-listing-search">
                <Search size={18} strokeWidth={1.7} />
                <input
                  type="search"
                  value={searchTerm}
                  placeholder="Rechercher une categorie..."
                  onChange={resetToFirstPage(setSearchTerm)}
                />
              </div>

              <label className="admin-listing-select">
                <span className="sr-only">Trier les categories</span>
                <select value={sortBy} onChange={resetToFirstPage(setSortBy)}>
                  <option value="recent">Trier par</option>
                  <option value="name">Nom</option>
                  <option value="products-desc">Plus de produits</option>
                  <option value="products-asc">Moins de produits</option>
                </select>
                <ChevronDown size={16} />
              </label>

              <label className="admin-listing-select">
                <span className="sr-only">Filtrer par statut</span>
                <select
                  value={statusFilter}
                  onChange={resetToFirstPage(setStatusFilter)}
                >
                  <option value="all">Tous les statuts</option>
                  <option value="active">Actives</option>
                  <option value="inactive">Inactives</option>
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
              <table className="admin-listing-table categories-admin-table">
                <thead>
                  <tr>
                    <th className="admin-listing-table__checkbox">
                      <input
                        type="checkbox"
                        aria-label="Selectionner toutes les categories visibles"
                        checked={allVisibleSelected}
                        onChange={toggleAllVisible}
                      />
                    </th>
                    <th>Image</th>
                    <th>Nom</th>
                    <th>Description</th>
                    <th>Produits</th>
                    <th>Statut</th>
                    <th>Date d'ajout</th>
                    <th className="admin-listing-table__actions-title">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {visibleCategories.map((category) => (
                    <tr key={category.id}>
                      <td className="admin-listing-table__checkbox">
                        <input
                          type="checkbox"
                          aria-label={`Selectionner ${category.name}`}
                          checked={selectedIds.includes(category.id)}
                          onChange={() => toggleCategory(category.id)}
                        />
                      </td>
                      <td>
                        <CategoryImage category={category} />
                      </td>
                      <td>
                        <strong className="admin-listing-name">
                          {category.name}
                        </strong>
                      </td>
                      <td className="admin-listing-muted-cell">
                        {category.description}
                      </td>
                      <td>{category.products}</td>
                      <td>
                        <span
                          className={`admin-listing-status admin-listing-status--${category.statusType}`}
                        >
                          {category.status}
                        </span>
                      </td>
                      <td className="admin-listing-muted-cell">
                        {category.date}
                      </td>
                      <td>
                        <div className="admin-listing-actions">
                          <button
                            type="button"
                            aria-label={`Modifier ${category.name}`}
                            onClick={() =>
                              navigate(
                                `/admin/categories/${category.id}/modifier`,
                              )
                            }
                          >
                            <Edit3 size={17} strokeWidth={1.7} />
                          </button>
                          <button
                            type="button"
                            aria-label={`Supprimer ${category.name}`}
                            onClick={() => deleteCategory(category)}
                          >
                            <Trash2 size={17} strokeWidth={1.7} />
                          </button>
                          <div className="admin-row-menu">
                            <button
                              type="button"
                              aria-label={`Plus d'actions pour ${category.name}`}
                              onClick={() =>
                                setOpenMenuId((currentId) =>
                                  currentId === category.id
                                    ? null
                                    : category.id,
                                )
                              }
                            >
                              <MoreHorizontal size={19} strokeWidth={1.8} />
                            </button>
                            {openMenuId === category.id ? (
                              <div className="admin-row-menu__panel">
                                <button
                                  type="button"
                                  onClick={() => toggleStatus(category)}
                                >
                                  {category.statusType === 'active'
                                    ? 'Desactiver'
                                    : 'Activer'}
                                </button>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {visibleCategories.length === 0 ? (
                    <tr>
                      <td className="admin-listing-table__empty" colSpan="8">
                        {loading
                          ? 'Chargement des categories...'
                          : 'Aucune categorie trouvee'}
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            <div className="admin-listing-pagination categories-admin-pagination">
              <span>
                Affichage de{' '}
                {filteredCategories.length === 0
                  ? 0
                  : (safePage - 1) * perPage + 1}{' '}
                a {Math.min(safePage * perPage, filteredCategories.length)} sur{' '}
                {filteredCategories.length} categories
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
                <span>Categories par page</span>
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
