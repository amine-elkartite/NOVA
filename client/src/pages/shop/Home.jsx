import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  LockKeyhole,
  RefreshCw,
  Truck,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import ProductCard from '../../components/product/ProductCard.jsx'
import productService from '../../services/productService.js'

import heroImage from '../../assets/images/nova-home-hero.jpg'
import categoryMen from '../../assets/images/nova-category-men.jpg'
import categoryWomen from '../../assets/images/nova-category-women.jpg'
import categoryAccessories from '../../assets/images/nova-category-accessories.jpg'

const categories = [
  {
    title: 'Homme',
    subtitle: 'Allure et modernite',
    image: categoryMen,
    imageAlt:
      'Homme portant une veste noire et des lunettes de soleil',
    link: '/homme',
  },
  {
    title: 'Femme',
    subtitle: 'Elegance naturelle',
    image: categoryWomen,
    imageAlt: 'Femme portant un blazer beige',
    link: '/femme',
  },
  {
    title: 'Accessoires',
    subtitle: 'Les details qui font la difference',
    image: categoryAccessories,
    imageAlt:
      'Sac noir, montre et lunettes sur pierre claire',
    link: '/accessoires',
  },
]

const services = [
  {
    title: 'Livraison rapide',
    subtitle: 'Partout au Maroc',
    icon: Truck,
  },
  {
    title: 'Paiement securise',
    subtitle: '100% fiable et crypte',
    icon: LockKeyhole,
  },
  {
    title: 'Retours faciles',
    subtitle: 'Sous 14 jours',
    icon: RefreshCw,
  },
]

function formatPrice(value) {
  return `${Number(value).toLocaleString('fr-FR')} DH`
}

function Home() {
  const [databaseProducts, setDatabaseProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function loadProducts() {
      try {
        setLoading(true)
        setError('')

        const data = await productService.getProducts()

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

        setError(
          requestError?.message ||
            'Impossible de charger les produits.',
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
  }, [])

  const bestSellers = useMemo(() => {
    return databaseProducts
      .filter(
        (product) =>
          product.status === 'active' &&
          Number(product.stock || 0) > 0,
      )
      .sort((first, second) => {
        if (
          Boolean(second.featured) !==
          Boolean(first.featured)
        ) {
          return (
            Number(Boolean(second.featured)) -
            Number(Boolean(first.featured))
          )
        }

        return (
          new Date(second.created_at || 0).getTime() -
          new Date(first.created_at || 0).getTime()
        )
      })
      .slice(0, 4)
      .map((databaseProduct) => {
        const priceValue = Number(
          databaseProduct.price,
        )

        const oldPriceValue =
          databaseProduct.old_price !== null &&
          databaseProduct.old_price !== undefined
            ? Number(databaseProduct.old_price)
            : null

        const discount =
          oldPriceValue &&
          oldPriceValue > priceValue
            ? `-${Math.round(
                ((oldPriceValue - priceValue) /
                  oldPriceValue) *
                  100,
              )}%`
            : undefined

        return {
          id: databaseProduct.slug,

          slug: databaseProduct.slug,

          databaseId: databaseProduct.id,

          name: databaseProduct.name,

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

          price: formatPrice(priceValue),

          oldPrice: oldPriceValue
            ? formatPrice(oldPriceValue)
            : undefined,

          discount,

          stock: Number(databaseProduct.stock),

          availability:
            Number(databaseProduct.stock) > 0
              ? 'En stock'
              : 'Rupture de stock',

          gender: databaseProduct.gender,

          brand: databaseProduct.brand,

          status: databaseProduct.status,

          featured: Boolean(
            databaseProduct.featured,
          ),

          categoryId:
            databaseProduct.category_id,

          categoryName:
            databaseProduct.category_name,

          categorySlug:
            databaseProduct.category_slug,

          isNew: Boolean(
            databaseProduct.featured,
          ),

          rating: 0,

          reviews: 0,
        }
      })
  }, [databaseProducts])

  return (
    <main className="home-page">
      <section
        className="home-hero"
        aria-labelledby="home-hero-title"
      >
        <img
          className="hero-photo"
          src={heroImage}
          alt="Nouvelle collection portee par un couple en tenue elegante"
        />

        <div className="nova-container hero-inner">
          <div className="hero-copy">
            <p className="hero-eyebrow">
              STYLE - QUALITE - PLUS LOIN ENSEMBLE
            </p>

            <h1 id="home-hero-title">
              La nouvelle collection
              <br />
              est arriv&eacute;e
            </h1>

            <p className="hero-description">
              Des pieces intemporelles pour une vie moderne.
              <br />
              Elegance, confort et caractere, en toute saison.
            </p>

            <Link
              className="hero-cta"
              to="/nouveautes"
            >
              Decouvrir la collection
              <ArrowRight
                size={16}
                strokeWidth={1.6}
              />
            </Link>

            <div
              className="hero-dots"
              aria-hidden="true"
            >
              <span className="is-active" />
              <span />
              <span />
            </div>
          </div>
        </div>
      </section>

      <section
        className="category-strip nova-container"
        aria-label="Categories"
      >
        {categories.map((category) => (
          <article
            className="category-card"
            key={category.title}
          >
            <img
              src={category.image}
              alt={category.imageAlt}
            />

            <div className="category-content">
              <h2>{category.title}</h2>
              <p>{category.subtitle}</p>

              <Link to={category.link}>
                Decouvrir
                <ArrowRight
                  size={13}
                  strokeWidth={1.55}
                />
              </Link>
            </div>
          </article>
        ))}
      </section>

      <section
        className="services-row"
        aria-label="Services"
      >
        <div className="nova-container services-grid">
          {services.map(
            ({
              title,
              subtitle,
              icon: Icon,
            }) => (
              <div
                className="service-item"
                key={title}
              >
                <Icon
                  size={24}
                  strokeWidth={1.55}
                />

                <div>
                  <h2>{title}</h2>
                  <p>{subtitle}</p>
                </div>
              </div>
            ),
          )}
        </div>
      </section>

      <section
        className="best-sellers nova-container"
        id="best-sellers"
        aria-labelledby="best-sellers-title"
      >
        <div className="section-heading">
          <h2 id="best-sellers-title">
            Nos meilleures ventes
          </h2>

          <Link to="/nouveautes">
            Voir tout
            <ArrowRight
              size={14}
              strokeWidth={1.55}
            />
          </Link>
        </div>

        {loading ? (
          <p>Chargement des produits...</p>
        ) : error ? (
          <p role="alert">{error}</p>
        ) : bestSellers.length > 0 ? (
          <div className="products-grid">
            {bestSellers.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
              />
            ))}
          </div>
        ) : (
          <p>Aucun produit actif a afficher pour le moment.</p>
        )}
      </section>
    </main>
  )
}

export default Home
