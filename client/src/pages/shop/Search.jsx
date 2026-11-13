import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  Link,
  useSearchParams,
} from 'react-router-dom'

import {
  Search as SearchIcon,
} from 'lucide-react'

import ProductGrid from '../../components/product/ProductGrid.jsx'

import productService from '../../services/productService.js'

function formatPrice(value) {
  return `${Number(value).toLocaleString(
    'fr-FR',
  )} DH`
}

function Search() {
  const [
    searchParams,
    setSearchParams,
  ] = useSearchParams()

  const query =
    searchParams.get('q') || ''

  const [databaseProducts, setDatabaseProducts] =
    useState([])

  const [loading, setLoading] =
    useState(false)

  const [error, setError] =
    useState('')

  useEffect(() => {
    let active = true

    async function loadProducts() {
      const cleanQuery =
        query.trim()

      if (!cleanQuery) {
        setDatabaseProducts([])
        setError('')
        setLoading(false)

        return
      }

      try {
        setLoading(true)
        setError('')

        const data =
          await productService.getProducts({
            search: cleanQuery,
          })

        if (!active) {
          return
        }

        setDatabaseProducts(
          Array.isArray(data.products)
            ? data.products
            : [],
        )
      } catch (requestError) {
        if (!active) {
          return
        }

        setDatabaseProducts([])

        setError(
          requestError?.message ||
            'Impossible d’effectuer la recherche.',
        )
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadProducts()

    return () => {
      active = false
    }
  }, [query])

  const results = useMemo(() => {
    return databaseProducts
      .map((databaseProduct) => {
        const priceValue =
          Number(
            databaseProduct.price,
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

        const discount =
          oldPriceValue &&
          oldPriceValue >
            priceValue
            ? `-${Math.round(
                ((oldPriceValue -
                  priceValue) /
                  oldPriceValue) *
                  100,
              )}%`
            : undefined

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

          image:
            databaseProduct.image_url || '',

          imageAlt:
            databaseProduct.image_alt ||
            databaseProduct.name ||
            'Produit NOVA',

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

          discount,

          stock:
            Number(
              databaseProduct.stock,
            ),

          availability:
            Number(
              databaseProduct.stock,
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
            databaseProduct.category_name || '',

          categorySlug:
            databaseProduct.category_slug || '',

          department:
            databaseProduct.category_name || '',

          group:
            databaseProduct.category_name || '',

          isNew:
            Boolean(databaseProduct.featured),

          rating: 0,

          reviews: 0,
        }
      })
  }, [databaseProducts])

  return (
    <main className="search-page">
      <div className="nova-catalog-container">
        <nav
          className="search-breadcrumb"
          aria-label="Fil d'Ariane"
        >
          <Link to="/">
            Accueil
          </Link>

          <span>/</span>

          <span>
            Recherche
          </span>
        </nav>

        <section
          className="search-heading"
          aria-labelledby="search-title"
        >
          <div>
            <p>
              Recherche NOVA
            </p>

            <h1 id="search-title">
              Résultats de recherche
            </h1>
          </div>

          <form
            className="search-page-form"
            onSubmit={(event) => {
              event.preventDefault()

              const formData =
                new FormData(
                  event.currentTarget,
                )

              const value =
                String(
                  formData.get(
                    'q',
                  ) || '',
                ).trim()

              setSearchParams(
                value
                  ? {
                      q: value,
                    }
                  : {},
              )
            }}
          >
            <SearchIcon
              size={18}
              strokeWidth={1.5}
            />

            <input
              key={query}
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Rechercher un produit..."
              aria-label="Rechercher un produit"
            />

            <button type="submit">
              Rechercher
            </button>
          </form>
        </section>

        {query.trim() ? (
          <p className="search-results-count">
            {loading
              ? 'Recherche en cours...'
              : `${results.length} résultat${
                  results.length >
                  1
                    ? 's'
                    : ''
                } pour “${query.trim()}”`}
          </p>
        ) : (
          <p className="search-results-count">
            Entrez un produit,
            une catégorie ou une
            collection.
          </p>
        )}

        {error ? (
          <p className="catalog-status" role="status">
            Impossible d'effectuer la recherche sur le serveur.
          </p>
        ) : null}

        {loading ? (
          <p>
            Recherche des
            produits...
          </p>
        ) : results.length >
          0 ? (
          <ProductGrid
            products={results}
            variant="catalog"
          />
        ) : query.trim() ? (
          <div
            className="catalog-empty"
            role="status"
          >
            Aucun produit ne
            correspond à cette
            recherche.
          </div>
        ) : null}
      </div>
    </main>
  )
}

export default Search
