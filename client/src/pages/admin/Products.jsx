import {
  Archive,
  AlertTriangle,
  Ban,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Edit3,
  EyeOff,
  Filter,
  MoreHorizontal,
  Package,
  Plus,
  Search,
  Trash2,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import AdminSidebar from '../../components/layout/AdminSidebar.jsx'
import AdminHeader from '../../components/layout/AdminHeader.jsx'
import {
  deleteProduct as deleteProductRequest,
  getAdminApiErrorMessages,
  getProducts,
  upsertProduct,
} from '../../services/adminService.js'

const productStatuses = [
  ['all', 'Tous les statuts'],
  ['in-stock', 'En stock'],
  ['low-stock', 'Stock faible'],
  ['out-stock', 'Rupture'],
]

const perPageOptions = [4, 8, 16]

function parseProductPrice(price) {
  return Number(String(price).replace(/\D/g, ''))
}

function ProductStatCard({
  icon: Icon,
  value,
  label,
  growth,
}) {
  return (
    <div className="products-stat-card">
      <div className="products-stat-card__icon">
        <Icon size={28} strokeWidth={1.6} />
      </div>

      <div className="products-stat-card__content">
        <div className="products-stat-card__top">
          <strong>{value}</strong>
          {growth ? (
            <span className="products-stat-card__growth">↗ {growth}</span>
          ) : null}
        </div>
        <div className="products-stat-card__bottom">
          <span>{label}</span>
          {growth ? <small>base de donnees</small> : null}
        </div>
      </div>
    </div>
  )
}

function ProductImage({ src, alt, fallback }) {
  return (
    <div className={`products-product-image products-product-image--${fallback}`}>
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

export default function Products() {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [apiError, setApiError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('recent')
  const [selectedIds, setSelectedIds] = useState([])
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(8)
  const [openMenuId, setOpenMenuId] = useState(null)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let isActive = true

    async function loadProducts() {
      setLoading(true)
      setApiError('')

      try {
        const nextProducts = await getProducts()

        if (isActive) {
          setProducts(nextProducts)
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

    loadProducts()

    return () => {
      isActive = false
    }
  }, [])

  const productCategories = useMemo(
    () =>
      Array.from(
        new Set(products.map((product) => product.category).filter(Boolean)),
      ),
    [products],
  )

  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    return products
      .filter((product) => {
        const matchesSearch =
          product.name.toLowerCase().includes(normalizedSearch) ||
          product.sku.toLowerCase().includes(normalizedSearch) ||
          product.category.toLowerCase().includes(normalizedSearch)
        const matchesCategory =
          categoryFilter === 'all' || product.category === categoryFilter
        const matchesStatus =
          statusFilter === 'all' || product.statusType === statusFilter

        return matchesSearch && matchesCategory && matchesStatus
      })
      .sort((first, second) => {
        if (sortBy === 'name') {
          return first.name.localeCompare(second.name)
        }

        if (sortBy === 'price-desc') {
          return (
            parseProductPrice(second.price) -
            parseProductPrice(first.price)
          )
        }

        if (sortBy === 'sales-desc') {
          return second.sales - first.sales
        }

        if (sortBy === 'stock-asc') {
          return first.stock - second.stock
        }

        return Number(first.id) - Number(second.id)
      })
  }, [categoryFilter, products, searchTerm, sortBy, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / perPage))
  const safePage = Math.min(page, totalPages)
  const visibleProducts = filteredProducts.slice(
    (safePage - 1) * perPage,
    safePage * perPage,
  )
  const allVisibleSelected =
    visibleProducts.length > 0 &&
    visibleProducts.every((product) => selectedIds.includes(product.id))
  const hasActiveFilters =
    searchTerm.trim() ||
    categoryFilter !== 'all' ||
    statusFilter !== 'all' ||
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
          (id) => !visibleProducts.some((product) => product.id === id),
        )
      }

      return Array.from(
        new Set([
          ...currentIds,
          ...visibleProducts.map((product) => product.id),
        ]),
      )
    })
  }

  const toggleProduct = (productId) => {
    setSelectedIds((currentIds) =>
      currentIds.includes(productId)
        ? currentIds.filter((id) => id !== productId)
        : [...currentIds, productId],
    )
  }

  const resetFilters = () => {
    setSearchTerm('')
    setCategoryFilter('all')
    setStatusFilter('all')
    setSortBy('recent')
    setSelectedIds([])
    setPage(1)
  }

  const deleteProduct = async (product) => {
    if (
      !window.confirm(
        `Supprimer ${product.name} de la base de donnees ?`,
      )
    ) {
      return
    }

    setApiError('')

    try {
      const result =
        await deleteProductRequest(product.id)

      if (result.action === 'archived' && result.product) {
        setProducts((currentProducts) =>
          currentProducts.map((item) =>
            item.id === product.id ? result.product : item,
          ),
        )
        setNotice(`${product.name} archive pour preserver l historique.`)
      } else {
        setProducts((currentProducts) =>
          currentProducts.filter((item) => item.id !== product.id),
        )
        setSelectedIds((currentIds) =>
          currentIds.filter((id) => id !== product.id),
        )
        setNotice(`${product.name} supprime en base.`)
      }
    } catch (error) {
      setNotice('')
      setApiError(getAdminApiErrorMessages(error).join(' '))
    } finally {
      setOpenMenuId(null)
    }
  }

  const toggleVisibility = async (product) => {
    const nextVisibility =
      product.visibility === 'hidden' ? 'visible' : 'hidden'

    setApiError('')

    try {
      const savedProduct = await upsertProduct({
        ...product,
        visibility: nextVisibility,
      })

      setProducts((currentProducts) =>
        currentProducts.map((item) =>
          item.id === product.id ? savedProduct : item,
        ),
      )
      setNotice(
        `${product.name} ${
          nextVisibility === 'visible' ? 'visible' : 'masque'
        } en base.`,
      )
    } catch (error) {
      setNotice('')
      setApiError(getAdminApiErrorMessages(error).join(' '))
    } finally {
      setOpenMenuId(null)
    }
  }

  const totalStock = products.filter(
    (product) => product.statusType === 'in-stock',
  ).length
  const lowStock = products.filter(
    (product) => product.statusType === 'low-stock',
  ).length
  const outStock = products.filter(
    (product) => product.statusType === 'out-stock',
  ).length

  return (
    <div className="admin-layout">
      <AdminSidebar />

      <div className="admin-main">
        <AdminHeader />

        <main className="admin-dashboard products-page">
          <section className="products-page__breadcrumb">
            <span>Accueil</span>
            <ChevronRight size={14} strokeWidth={1.7} />
            <strong>Produits</strong>
          </section>

          <section className="products-page__heading">
            <div>
              <h1>Gestion des produits</h1>
              <p>Ajoutez, modifiez et organisez vos produits facilement.</p>
            </div>

            <button
              className="products-add-button"
              type="button"
              onClick={() => navigate('/admin/produits/nouveau')}
            >
              <Plus size={18} strokeWidth={1.8} />
              <span>Ajouter un produit</span>
            </button>
          </section>

          {notice ? <p className="admin-local-notice">{notice}</p> : null}
          {loading ? (
            <p className="admin-local-notice">
              Chargement des produits depuis la base de donnees...
            </p>
          ) : null}
          {apiError ? (
            <div className="product-form-alert product-form-alert--error">
              {apiError}
            </div>
          ) : null}

          <section className="products-stats">
            <ProductStatCard
              icon={Package}
              value={products.length}
              label="Total produits"
              growth="+ DB"
            />
            <ProductStatCard
              icon={Archive}
              value={totalStock}
              label="En stock"
            />
            <ProductStatCard
              icon={AlertTriangle}
              value={lowStock}
              label="Stock faible"
            />
            <ProductStatCard
              icon={Ban}
              value={outStock}
              label="Rupture de stock"
            />
          </section>

          <section className="dashboard-card products-table-card">
            <div className="products-filters">
              <div className="products-search">
                <Search size={18} strokeWidth={1.7} />
                <input
                  type="search"
                  value={searchTerm}
                  placeholder="Rechercher un produit..."
                  onChange={resetToFirstPage(setSearchTerm)}
                />
              </div>

              <label className="products-filter-select">
                <span className="sr-only">Filtrer par categorie</span>
                <select
                  value={categoryFilter}
                  onChange={resetToFirstPage(setCategoryFilter)}
                >
                  <option value="all">Toutes les categories</option>
                  {productCategories.map((category) => (
                    <option value={category} key={category}>
                      {category}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} />
              </label>

              <label className="products-filter-select">
                <span className="sr-only">Filtrer par statut</span>
                <select
                  value={statusFilter}
                  onChange={resetToFirstPage(setStatusFilter)}
                >
                  {productStatuses.map(([value, label]) => (
                    <option value={value} key={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} />
              </label>

              <label className="products-filter-select">
                <span className="sr-only">Trier les produits</span>
                <select
                  value={sortBy}
                  onChange={resetToFirstPage(setSortBy)}
                >
                  <option value="recent">Trier par</option>
                  <option value="name">Nom</option>
                  <option value="price-desc">Prix eleve</option>
                  <option value="sales-desc">Meilleures ventes</option>
                  <option value="stock-asc">Stock faible</option>
                </select>
                <ChevronDown size={16} />
              </label>

              <button
                className="products-filter-button"
                type="button"
                onClick={resetFilters}
              >
                <Filter size={17} strokeWidth={1.7} />
                <span>{hasActiveFilters ? 'Reinitialiser' : 'Filtrer'}</span>
              </button>
            </div>

            <div className="products-table-wrap">
              <table className="products-table">
                <thead>
                  <tr>
                    <th className="products-table__checkbox">
                      <input
                        type="checkbox"
                        aria-label="Selectionner tous les produits visibles"
                        checked={allVisibleSelected}
                        onChange={toggleAllVisible}
                      />
                    </th>
                    <th>Produit</th>
                    <th>Categorie</th>
                    <th>Prix</th>
                    <th>Stock</th>
                    <th>Statut</th>
                    <th>Ventes</th>
                    <th>Date d'ajout</th>
                    <th className="products-table__actions-title">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {visibleProducts.map((product) => (
                    <tr key={product.id}>
                      <td className="products-table__checkbox">
                        <input
                          type="checkbox"
                          aria-label={`Selectionner ${product.name}`}
                          checked={selectedIds.includes(product.id)}
                          onChange={() => toggleProduct(product.id)}
                        />
                      </td>

                      <td>
                        <div className="products-product">
                          <ProductImage
                            src={product.image}
                            alt={product.name}
                            fallback={product.fallback}
                          />
                          <div className="products-product__info">
                            <strong>{product.name}</strong>
                            <span>SKU: {product.sku}</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="products-category">
                          {product.category}
                        </span>
                      </td>
                      <td>
                        <div className="products-price">
                          <strong>{product.price}</strong>
                          {product.oldPrice ? (
                            <del>{product.oldPrice}</del>
                          ) : null}
                        </div>
                      </td>
                      <td>
                        <span
                          className={
                            product.stock === 0
                              ? 'products-stock products-stock--empty'
                              : 'products-stock'
                          }
                        >
                          {product.stock}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`products-status products-status--${product.statusType}`}
                        >
                          {product.status}
                        </span>
                      </td>
                      <td>{product.sales}</td>
                      <td>{product.date}</td>
                      <td>
                        <div className="products-actions">
                          <button
                            type="button"
                            aria-label={`Modifier ${product.name}`}
                            onClick={() =>
                              navigate(
                                `/admin/produits/${product.id}/modifier`,
                              )
                            }
                          >
                            <Edit3 size={17} strokeWidth={1.7} />
                          </button>
                          <button
                            type="button"
                            aria-label={`Supprimer ${product.name}`}
                            onClick={() => deleteProduct(product)}
                          >
                            <Trash2 size={17} strokeWidth={1.7} />
                          </button>
                          <div className="admin-row-menu">
                            <button
                              type="button"
                              aria-label={`Plus d'actions pour ${product.name}`}
                              onClick={() =>
                                setOpenMenuId((currentId) =>
                                  currentId === product.id
                                    ? null
                                    : product.id,
                                )
                              }
                            >
                              <MoreHorizontal size={19} strokeWidth={1.8} />
                            </button>
                            {openMenuId === product.id ? (
                              <div className="admin-row-menu__panel">
                                <button
                                  type="button"
                                  onClick={() => toggleVisibility(product)}
                                >
                                  <EyeOff size={14} />
                                  {product.visibility === 'hidden'
                                    ? 'Rendre visible'
                                    : 'Masquer'}
                                </button>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {visibleProducts.length === 0 ? (
                    <tr>
                      <td className="products-table__empty" colSpan="9">
                        {loading
                          ? 'Chargement des produits...'
                          : 'Aucun produit trouve'}
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            <div className="products-pagination">
              <span>
                Affichage de{' '}
                {filteredProducts.length === 0
                  ? 0
                  : (safePage - 1) * perPage + 1}{' '}
                a {Math.min(safePage * perPage, filteredProducts.length)} sur{' '}
                {filteredProducts.length} produits
              </span>

              <div className="products-pagination__pages">
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

              <label className="products-per-page">
                <span>Produits par page</span>
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
                <ChevronDown size={15} />
              </label>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
