import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import Pagination from '../common/Pagination.jsx'
import ProductFilters from './ProductFilters.jsx'
import ProductGrid from './ProductGrid.jsx'

import productService from '../../services/productService.js'

const sortOptions = [
  {
    value: 'newest',
    label: 'Plus récents',
  },
  {
    value: 'priceAsc',
    label: 'Prix croissant',
  },
  {
    value: 'priceDesc',
    label: 'Prix décroissant',
  },
  {
    value: 'popularity',
    label: 'Popularité',
  },
]

function formatPrice(value) {
  return `${Number(
    value || 0,
  ).toLocaleString('fr-FR')} DH`
}

function getDiscount(
  priceValue,
  oldPriceValue,
) {
  if (
    !oldPriceValue ||
    oldPriceValue <= priceValue
  ) {
    return undefined
  }

  return `-${Math.round(
    ((oldPriceValue -
      priceValue) /
      oldPriceValue) *
      100,
  )}%`
}

function sortProducts(
  products,
  sortBy,
) {
  const sortedProducts = [
    ...products,
  ]

  if (
    sortBy ===
    'priceAsc'
  ) {
    return sortedProducts.sort(
      (a, b) =>
        a.priceValue -
        b.priceValue,
    )
  }

  if (
    sortBy ===
    'priceDesc'
  ) {
    return sortedProducts.sort(
      (a, b) =>
        b.priceValue -
        a.priceValue,
    )
  }

  if (
    sortBy ===
    'popularity'
  ) {
    return sortedProducts.sort(
      (a, b) =>
        Number(
          b.reviews || 0,
        ) *
          Number(
            b.rating || 0,
          ) -
        Number(
          a.reviews || 0,
        ) *
          Number(
            a.rating || 0,
          ),
    )
  }

  return sortedProducts.sort(
    (a, b) => {
      const dateA =
        a.createdAt
          ? new Date(
              a.createdAt,
            ).getTime()
          : 0

      const dateB =
        b.createdAt
          ? new Date(
              b.createdAt,
            ).getTime()
          : 0

      if (
        dateA !==
        dateB
      ) {
        return dateB - dateA
      }

      return (
        Number(
          b.databaseId || 0,
        ) -
        Number(
          a.databaseId || 0,
        )
      )
    },
  )
}

function getPageProducts(
  products,
  pageKey,
) {
  if (
    pageKey ===
    'homme'
  ) {
    return products.filter(
      (product) =>
        product.gender ===
          'homme' ||
        product.department ===
          'Homme',
    )
  }

  if (
    pageKey ===
    'femme'
  ) {
    return products.filter(
      (product) =>
        product.gender ===
          'femme' ||
        product.department ===
          'Femme',
    )
  }

  if (
    pageKey ===
    'accessoires'
  ) {
    return products.filter(
      (product) =>
        product.categorySlug ===
          'accessoires' ||
        product.department ===
          'Accessoires',
    )
  }

  if (
    pageKey ===
    'nouveautes'
  ) {
    return products
  }

  return products
}

function CatalogPage({
  title,
  description,
  breadcrumb,
  categoryField = 'category',
  filterOptions,
  heroImage,
  heroImageAlt,
  pageKey,
}) {
  const [
    categoryFilter,
    setCategoryFilter,
  ] =
    useState('all')

  const [
    sortBy,
    setSortBy,
  ] =
    useState('newest')

  const [
    currentPage,
    setCurrentPage,
  ] =
    useState(1)

  const [
    databaseProducts,
    setDatabaseProducts,
  ] =
    useState([])

  const [
    loading,
    setLoading,
  ] =
    useState(true)

  const [
    error,
    setError,
  ] =
    useState('')

  const itemsPerPage = 8

  useEffect(() => {
    let active = true

    async function loadProducts() {
      try {
        setLoading(
          true,
        )

        setError('')

        const data =
          await productService.getProducts()

        if (!active) {
          return
        }

        setDatabaseProducts(
          Array.isArray(
            data?.products,
          )
            ? data.products
            : [],
        )
      } catch (
        requestError
      ) {
        if (!active) {
          return
        }

        setError(
          requestError?.message ||
            'Impossible de charger les produits.',
        )
      } finally {
        if (active) {
          setLoading(
            false,
          )
        }
      }
    }

    loadProducts()

    return () => {
      active = false
    }
  }, [])

  const normalizedProducts =
    useMemo(() => {
      if (loading) {
        return []
      }

      return databaseProducts.map(
        (
          databaseProduct,
          index,
        ) => {
          const priceValue =
            Number(
              databaseProduct.price ||
                0,
            )

          const oldPriceValue =
            databaseProduct.old_price !==
              null &&
            databaseProduct.old_price !==
              undefined
              ? Number(
                  databaseProduct.old_price,
                )
              : null

          const image =
            databaseProduct.image_url || ''

          const imageAlt =
            databaseProduct.image_alt ||
            databaseProduct.name ||
            'Produit NOVA'

          return {
            id:
              databaseProduct.slug,

            slug:
              databaseProduct.slug,

            databaseId:
              databaseProduct.id,

            name:
              databaseProduct.name,

            description:
              databaseProduct.short_description ||
              databaseProduct.description ||
              '',

            image,

            imageAlt,

            priceValue,

            price:
              formatPrice(
                priceValue,
              ),

            oldPrice:
              oldPriceValue
                ? formatPrice(
                    oldPriceValue,
                  )
                : undefined,

            discount:
              getDiscount(
                priceValue,
                oldPriceValue,
              ),

            stock:
              Number(
                databaseProduct.stock ||
                  0,
              ),

            availability:
              Number(
                databaseProduct.stock ||
                  0,
              ) > 0
                ? 'En stock'
                : 'Rupture de stock',

            gender:
              databaseProduct.gender,

            brand:
              databaseProduct.brand,

            status:
              databaseProduct.status,

            featured:
              Boolean(
                databaseProduct.featured,
              ),

            categoryId:
              databaseProduct.category_id,

            categoryName:
              databaseProduct.category_name,

            categorySlug:
              databaseProduct.category_slug,

            department:
              databaseProduct.category_name ||
              '',

            group:
              databaseProduct.category_name ||
              '',

            createdAt:
              databaseProduct.created_at,

            updatedAt:
              databaseProduct.updated_at,

            isNew:
              Boolean(
                databaseProduct.featured,
              ),

            rating: 0,

            reviews: 0,

            sortIndex:
              index + 1,
          }
        },
      )
    }, [
      databaseProducts,
      loading,
    ])

  const pageProducts =
    useMemo(
      () =>
        getPageProducts(
          normalizedProducts,
          pageKey,
        ),
      [
        normalizedProducts,
        pageKey,
      ],
    )

  const filteredProducts =
    useMemo(
      () =>
        pageProducts.filter(
          (product) => {
            if (
              categoryFilter ===
              'all'
            ) {
              return true
            }

            return (
              product[
                categoryField
              ] ===
              categoryFilter
            )
          },
        ),
      [
        pageProducts,
        categoryField,
        categoryFilter,
      ],
    )

  const sortedProducts =
    useMemo(
      () =>
        sortProducts(
          filteredProducts,
          sortBy,
        ),
      [
        filteredProducts,
        sortBy,
      ],
    )

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        sortedProducts.length /
          itemsPerPage,
      ),
    )

  const safePage =
    Math.min(
      currentPage,
      totalPages,
    )

  const visibleProducts =
    sortedProducts.slice(
      (safePage - 1) *
        itemsPerPage,

      safePage *
        itemsPerPage,
    )

  const handleCategoryChange =
    (value) => {
      setCurrentPage(1)
      setCategoryFilter(
        value,
      )
    }

  const handleSortChange =
    (value) => {
      setCurrentPage(1)
      setSortBy(value)
    }

  return (
    <main
      className={`catalog-page catalog-page-${pageKey}`}
    >
      <section
        className={`catalog-hero catalog-hero-${pageKey}`}
        aria-labelledby={`catalog-${pageKey}-title`}
      >
        <img
          className="catalog-hero-image"
          src={heroImage}
          alt={
            heroImageAlt
          }
        />

        <div
          className="catalog-hero-overlay"
          aria-hidden="true"
        />

        <div className="catalog-hero-inner nova-container">
          <div className="catalog-hero-copy">
            <p className="catalog-hero-eyebrow">
              STYLE · QUALITÉ ·
              PLUS LOIN ENSEMBLE
            </p>

            <h1
              id={`catalog-${pageKey}-title`}
            >
              {title}
            </h1>

            <p className="catalog-hero-description">
              {description}
            </p>
          </div>
        </div>
      </section>

      <section
        className="catalog-shop nova-catalog-container"
        aria-label={`Catalogue ${title}`}
      >
        <div className="catalog-toolbar">
          <nav
            className="breadcrumb"
            aria-label="Fil d'Ariane"
          >
            {breadcrumb.map(
              (
                item,
                index,
              ) => (
                <span
                  className={
                    index === 0
                      ? 'breadcrumb-home'
                      : 'breadcrumb-current'
                  }
                  key={
                    item
                  }
                >
                  {index ===
                  0
                    ? item
                    : `/ ${item}`}
                </span>
              ),
            )}
          </nav>

          <ProductFilters
            options={
              filterOptions
            }
            value={
              categoryFilter
            }
            onChange={
              handleCategoryChange
            }
          />

          <div className="catalog-sort">
            <span
              className="catalog-sort-divider"
              aria-hidden="true"
            />

            <label className="sort-control">
              <span>
                Trier par :
              </span>

              <select
                value={
                  sortBy
                }
                onChange={(
                  event,
                ) =>
                  handleSortChange(
                    event
                      .target
                      .value,
                  )
                }
              >
                {sortOptions.map(
                  (
                    option,
                  ) => (
                    <option
                      key={
                        option.value
                      }
                      value={
                        option.value
                      }
                    >
                      {
                        option.label
                      }
                    </option>
                  ),
                )}
              </select>
            </label>
          </div>
        </div>

        {loading ? (
          <p>
            Chargement des
            produits...
          </p>
        ) : (
          <>
            {error ? (
              <p className="catalog-status" role="status">
                Impossible de charger les produits depuis le serveur.
              </p>
            ) : null}

            <ProductGrid
              products={
                visibleProducts
              }
              variant="catalog"
            />

            <Pagination
              currentPage={
                safePage
              }
              totalPages={
                totalPages
              }
              onPageChange={
                setCurrentPage
              }
            />
          </>
        )}
      </section>
    </main>
  )
}

export default CatalogPage
