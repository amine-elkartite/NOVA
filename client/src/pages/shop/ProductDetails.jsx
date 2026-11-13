import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import {
  Heart,
  ShoppingBag,
  Truck,
  LockKeyhole,
  RefreshCw,
  Headphones,
  Star,
  Minus,
  Plus,
  Share2,
  Ruler,
} from 'lucide-react'

import ProductCard from '../../components/product/ProductCard.jsx'
import ProductReviews from '../../components/product/ProductReviews.jsx'

import { useCart } from '../../context/CartContext.jsx'
import { useWishlist } from '../../context/WishlistContext.jsx'
import { useStorefrontSettings } from '../../context/StorefrontSettingsContext.jsx'

import productService from '../../services/productService.js'

const variantColorValues = {
  Noir: '#111111',
  Beige: '#d8cdbd',
  Kaki: '#6f725c',
  Gris: '#8b8b88',
  Brun: '#6b4f3a',
  Doré: '#b08d57',
}


function formatPrice(value) {
  return `${Number(value || 0).toLocaleString('fr-FR')} DH`
}

function normalizeListingProduct(databaseProduct) {
  const priceValue = Number(databaseProduct.price || 0)

  const oldPriceValue =
    databaseProduct.old_price !== null &&
    databaseProduct.old_price !== undefined
      ? Number(databaseProduct.old_price)
      : null

  const discount =
    oldPriceValue && oldPriceValue > priceValue
      ? `-${Math.round(
          ((oldPriceValue - priceValue) / oldPriceValue) * 100,
        )}%`
      : undefined

  return {
    id: databaseProduct.slug,
    slug: databaseProduct.slug,
    databaseId: Number(databaseProduct.id),

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

    oldPrice:
      oldPriceValue !== null
        ? formatPrice(oldPriceValue)
        : undefined,

    discount,

    stock: Number(databaseProduct.stock || 0),
    gender: databaseProduct.gender,
    brand: databaseProduct.brand,
    status: databaseProduct.status,
    featured: Boolean(databaseProduct.featured),

    categoryId: databaseProduct.category_id,
    categoryName: databaseProduct.category_name || '',
    categorySlug: databaseProduct.category_slug || '',

    department:
      databaseProduct.category_name || '',

    group:
      databaseProduct.category_name || '',

    isNew: Boolean(databaseProduct.featured),
    rating: 0,
    reviews: 0,
  }
}

function ProductDetails() {
  const { settings } = useStorefrontSettings()
  const { slug } = useParams()
  const navigate = useNavigate()

  const { addToCart } = useCart()
  const { isFavorite, toggleFavorite } = useWishlist()

  /* =========================================================
     DATABASE PRODUCT
  ========================================================= */

  const [databaseProduct, setDatabaseProduct] = useState(null)
  const [productLoading, setProductLoading] = useState(true)
  const [productError, setProductError] = useState('')
  const [databaseSimilarProducts, setDatabaseSimilarProducts] =
    useState([])

  useEffect(() => {
    let active = true

    async function loadProduct() {
      try {
        setProductLoading(true)
        setProductError('')

        const data = await productService.getProductBySlug(slug)

        if (!active) {
          return
        }

        setDatabaseProduct(data.product || null)
      } catch (error) {
        if (!active) {
          return
        }

        setDatabaseProduct(null)
        setDatabaseSimilarProducts([])

        setProductError(
          error?.message || 'Impossible de charger le produit.',
        )
      } finally {
        if (active) {
          setProductLoading(false)
        }
      }
    }

    loadProduct()

    return () => {
      active = false
    }
  }, [slug])

  /* =========================================================
     MERGED PRODUCT — DATABASE FIRST
  ========================================================= */

  const product = useMemo(() => {
    if (!databaseProduct) {
      return null
    }

    const priceValue = Number(databaseProduct.price || 0)

    const oldPriceValue =
      databaseProduct.old_price !== null &&
      databaseProduct.old_price !== undefined
        ? Number(databaseProduct.old_price)
        : null

    const discount =
      oldPriceValue && oldPriceValue > priceValue
        ? `-${Math.round(
            ((oldPriceValue - priceValue) / oldPriceValue) * 100,
          )}%`
        : undefined

    const databaseImages = Array.isArray(databaseProduct.images)
      ? [...databaseProduct.images].sort((a, b) => {
          if (Number(b.is_primary) !== Number(a.is_primary)) {
            return Number(b.is_primary) - Number(a.is_primary)
          }

          if (Number(a.sort_order) !== Number(b.sort_order)) {
            return Number(a.sort_order) - Number(b.sort_order)
          }

          return Number(a.id) - Number(b.id)
        })
      : []

    const primaryDatabaseImage = databaseImages[0]

    return {
      id: databaseProduct.slug,
      slug: databaseProduct.slug,
      databaseId: Number(databaseProduct.id),

      name: databaseProduct.name,

      description:
        databaseProduct.short_description ||
        databaseProduct.description ||
        '',

      fullDescription:
        databaseProduct.description ||
        databaseProduct.short_description ||
        '',

      image:
        primaryDatabaseImage?.image_url || '',

      imageAlt:
        primaryDatabaseImage?.alt_text ||
        databaseProduct.name ||
        'Produit NOVA',

      priceValue,
      price: formatPrice(priceValue),

      oldPrice:
        oldPriceValue !== null
          ? formatPrice(oldPriceValue)
          : undefined,

      discount,

      stock: Number(databaseProduct.stock || 0),

      availability:
        Number(databaseProduct.stock || 0) > 0
          ? 'En stock'
          : 'Rupture de stock',

      gender: databaseProduct.gender,
      brand: databaseProduct.brand,
      status: databaseProduct.status,
      featured: Boolean(databaseProduct.featured),

      categoryId: databaseProduct.category_id,
      categoryName: databaseProduct.category_name || '',
      categorySlug: databaseProduct.category_slug || '',

      department:
        databaseProduct.category_name || '',

      group:
        databaseProduct.category_name || '',

      isNew: Boolean(databaseProduct.featured),
      rating: 0,
      reviews: 0,

      reference:
        databaseProduct.sku ||
        `NOVA-${String(databaseProduct.id).padStart(3, '0')}`,

      variants: Array.isArray(databaseProduct.variants)
        ? databaseProduct.variants
        : [],

      images: databaseImages,
    }
  }, [databaseProduct])

  /* =========================================================
     GALLERY
  ========================================================= */

  const galleryImages = useMemo(() => {
    if (!product) {
      return []
    }

    const databaseImages = Array.isArray(product.images)
      ? product.images
          .map((image) => image.image_url)
          .filter(Boolean)
      : []

    if (databaseImages.length > 0) {
      return databaseImages
    }

    return product.image ? [product.image] : []
  }, [product])

  /* =========================================================
     SIMILAR PRODUCTS — DATABASE FIRST
  ========================================================= */

  useEffect(() => {
    let active = true

    async function loadSimilarProducts() {
      if (!databaseProduct?.category_slug) {
        setDatabaseSimilarProducts([])
        return
      }

      try {
        const data = await productService.getProducts({
          category: databaseProduct.category_slug,
        })

        if (!active) {
          return
        }

        const normalized = Array.isArray(data?.products)
          ? data.products
              .filter(
                (item) =>
                  item.slug !== databaseProduct.slug,
              )
              .map(normalizeListingProduct)
              .slice(0, 4)
          : []

        setDatabaseSimilarProducts(normalized)
      } catch {
        if (active) {
          setDatabaseSimilarProducts([])
        }
      }
    }

    loadSimilarProducts()

    return () => {
      active = false
    }
  }, [databaseProduct])

  const similarProducts = useMemo(() => {
    return databaseSimilarProducts
  }, [databaseSimilarProducts])

  /* =========================================================
     STATES
  ========================================================= */

  const [mainImage, setMainImage] = useState('')

  const [selectedColor, setSelectedColor] =
    useState('')

  const [selectedSize, setSelectedSize] =
    useState('')

  const [quantity, setQuantity] = useState(1)

  const [activeTab, setActiveTab] =
    useState('description')

  const [addedToCart, setAddedToCart] =
    useState(false)

  const [addingToCart, setAddingToCart] =
    useState(false)

  const [productNotice, setProductNotice] =
    useState('')

  /* =========================================================
     VARIANTS
  ========================================================= */

  const variants = useMemo(() => {
    if (!Array.isArray(databaseProduct?.variants)) {
      return []
    }

    return databaseProduct.variants
  }, [databaseProduct])

  /* =========================================================
     COLORS FROM DATABASE
  ========================================================= */

  const colors = useMemo(() => {
    const uniqueColors = [
      ...new Set(
        variants
          .map((variant) => variant.color)
          .filter(Boolean),
      ),
    ]

    if (uniqueColors.length === 0) {
      return []
    }

    return uniqueColors.map((color) => ({
      name: color,
      value:
        variantColorValues[color] ||
        '#8b8b88',
    }))
  }, [variants])

  /* =========================================================
     SIZES FROM DATABASE
  ========================================================= */

  const sizeNames = useMemo(() => {
    const databaseSizes = [
      ...new Set(
        variants
          .map((variant) => variant.size)
          .filter(Boolean),
      ),
    ]

    if (databaseSizes.length > 0) {
      return databaseSizes
    }

    return []
  }, [variants])

  const sizes = useMemo(() => {
    return sizeNames.map((size) => {
      const matchingVariants = variants.filter(
        (variant) =>
          variant.size === size &&
          (
            !selectedColor ||
            variant.color === selectedColor
          ),
      )

      const available = matchingVariants.some(
        (variant) =>
          Number(variant.stock) > 0,
      )

      return {
        name: size,
        available,
      }
    })
  }, [
    sizeNames,
    variants,
    selectedColor,
  ])

  /* =========================================================
     SELECTED VARIANT
  ========================================================= */

  const selectedVariant = useMemo(() => {
    if (variants.length === 0) {
      return null
    }

    return (
      variants.find(
        (variant) => {
          const variantSize =
            variant.size || ''

          const variantColor =
            variant.color || ''

          return (
            variantSize === selectedSize &&
            variantColor === selectedColor
          )
        },
      ) || null
    )
  }, [
    variants,
    selectedSize,
    selectedColor,
  ])

  /* =========================================================
     CURRENT STOCK
  ========================================================= */

  const currentStock = useMemo(() => {
    if (!product) {
      return 0
    }

    if (variants.length === 0) {
      return Number(product.stock) || 0
    }

    if (!selectedVariant) {
      return 0
    }

    return Number(selectedVariant.stock) || 0
  }, [
    product,
    variants,
    selectedVariant,
  ])

  const currentAvailability =
    currentStock > 0
      ? 'En stock'
      : 'Rupture de stock'

  /* =========================================================
     RESET WHEN PRODUCT CHANGES
  ========================================================= */

  useEffect(() => {
    if (!product) {
      return
    }

    setMainImage(
      galleryImages[0] || product.image || '',
    )

    const firstDatabaseColor =
      variants.find(
        (variant) =>
          variant.color &&
          Number(variant.stock) > 0,
      )?.color ||
      variants.find(
        (variant) => variant.color,
      )?.color

    const firstColor =
      firstDatabaseColor ||
      ''

    setSelectedColor(firstColor)

    let firstSize = ''

    if (variants.length > 0) {
      firstSize =
        variants.find(
          (variant) =>
            variant.color === firstColor &&
            Number(variant.stock) > 0,
        )?.size ||
        variants.find(
          (variant) =>
            variant.color === firstColor,
        )?.size ||
        variants.find(
          (variant) =>
            Number(variant.stock) > 0,
        )?.size ||
        variants[0]?.size ||
        ''
    } else {
      firstSize = ''
    }

    setSelectedSize(firstSize)

    setQuantity(1)
    setActiveTab('description')
    setAddedToCart(false)
    setProductNotice('')
  }, [
    product,
    galleryImages,
    variants,
  ])

  /* =========================================================
     COLOR CHANGE
  ========================================================= */

  const handleColorSelect = (colorName) => {
    setSelectedColor(colorName)
    setQuantity(1)
    setProductNotice('')

    if (variants.length === 0) {
      return
    }

    const sameSizeVariant = variants.find(
      (variant) =>
        variant.color === colorName &&
        variant.size === selectedSize &&
        Number(variant.stock) > 0,
    )

    if (sameSizeVariant) {
      return
    }

    const firstAvailableVariant = variants.find(
      (variant) =>
        variant.color === colorName &&
        Number(variant.stock) > 0,
    )

    if (firstAvailableVariant) {
      setSelectedSize(firstAvailableVariant.size)
      return
    }

    const firstColorVariant = variants.find(
      (variant) =>
        variant.color === colorName,
    )

    if (firstColorVariant) {
      setSelectedSize(firstColorVariant.size)
    }
  }

  /* =========================================================
     SIZE CHANGE
  ========================================================= */

  const handleSizeSelect = (sizeName) => {
    setSelectedSize(sizeName)
    setQuantity(1)
    setProductNotice('')
  }

  /* =========================================================
     LOADING
  ========================================================= */

  if (productLoading) {
    return (
      <main className="product-not-found nova-container">
        <p>Chargement du produit...</p>
      </main>
    )
  }

  /* =========================================================
     PRODUCT NOT FOUND
  ========================================================= */

  if (!product) {
    return (
      <main className="product-not-found nova-container">
        <h1>Produit introuvable</h1>

        <p>
          {productError ||
            "Ce produit n'existe pas ou n'est plus disponible."}
        </p>

        <Link
          to="/"
          className="product-back-link"
        >
          Retour à la boutique
        </Link>
      </main>
    )
  }

  /* =========================================================
     CATEGORY
  ========================================================= */

  const categoryPath =
    product.department === 'Homme'
      ? '/homme'
      : product.department === 'Femme'
        ? '/femme'
        : '/accessoires'

  /* =========================================================
     QUANTITY
  ========================================================= */

  const decreaseQuantity = () => {
    setQuantity((current) =>
      Math.max(1, current - 1),
    )
  }

  const increaseQuantity = () => {
    setQuantity((current) =>
      Math.min(
        current + 1,
        Math.max(currentStock, 1),
      ),
    )
  }

  /* =========================================================
     ADD TO CART
  ========================================================= */

  const handleAddToCart = async () => {
    if (addingToCart) {
      return false
    }

    if (variants.length > 0 && !selectedVariant) {
      setProductNotice(
        'Sélectionnez une combinaison disponible.',
      )

      return false
    }

    if (currentStock <= 0) {
      setProductNotice(
        'Cette variante est actuellement en rupture de stock.',
      )

      return false
    }

    if (!product.databaseId) {
      setProductNotice(
        'Ajout au panier indisponible hors connexion API pour ce produit.',
      )

      return false
    }

    const selectedSizeOption = sizes.find(
      (size) =>
        size.name === selectedSize,
    )

    if (
      sizes.length > 0 &&
      !selectedSizeOption?.available
    ) {
      setProductNotice(
        'Sélectionnez une taille disponible avant d’ajouter ce produit.',
      )

      return false
    }

    try {
      setAddingToCart(true)

      await addToCart(product, {
        quantity,
        color: selectedColor,
        size: selectedSize,
        variantId:
          selectedVariant?.id || null,
      })

      setAddedToCart(true)
      setProductNotice('')

      window.setTimeout(() => {
        setAddedToCart(false)
      }, 1600)

      return true
    } catch (error) {
      setAddedToCart(false)
      setProductNotice(
        error?.message ||
          'Impossible d’ajouter ce produit au panier.',
      )

      return false
    } finally {
      setAddingToCart(false)
    }
  }

  /* =========================================================
     BUY NOW
  ========================================================= */

  const handleBuyNow = async () => {
    if (await handleAddToCart()) {
      navigate('/checkout')
    }
  }

  /* =========================================================
     SHARE
  ========================================================= */

  const handleShare = async () => {
    const shareUrl =
      `${window.location.origin}/produit/${product.id}`

    try {
      if (navigator.share) {
        await navigator.share({
          title: product.name,
          text: product.description,
          url: shareUrl,
        })

        setProductNotice(
          'Lien du produit partagé.',
        )

        return
      }

      if (navigator.clipboard) {
        await navigator.clipboard.writeText(
          shareUrl,
        )

        setProductNotice(
          'Lien du produit copié.',
        )

        return
      }

      setProductNotice(shareUrl)
    } catch {
      setProductNotice(
        'Le partage du produit n’a pas pu être lancé.',
      )
    }
  }

  const showSizeGuideNotice = () => {
    setProductNotice(
      'Le guide des tailles nécessite encore le contenu détaillé des mesures.',
    )
  }

  const handleFavoriteToggle = async () => {
    if (!product.databaseId) {
      setProductNotice(
        'Favoris indisponibles hors connexion API pour ce produit.',
      )
      return
    }

    try {
      await toggleFavorite(product)
    } catch (error) {
      setProductNotice(
        error?.message ||
          'Impossible de modifier vos favoris.',
      )
    }
  }

  const favorite = isFavorite(product)

  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <main className="product-page">
      <div className="nova-container">

        {/* =========================
            BREADCRUMB
        ========================= */}

        <nav
          className="product-breadcrumb"
          aria-label="Fil d'Ariane"
        >
          <Link to="/">
            Accueil
          </Link>

          <span>/</span>

          <Link to={categoryPath}>
            {product.department}
          </Link>

          <span>/</span>

          <span>
            {product.group}
          </span>

          <span>/</span>

          <span>
            {product.name}
          </span>
        </nav>

        {/* =========================
            PRODUCT
        ========================= */}

        <section className="product-main">

          {/* =========================
              GALLERY
          ========================= */}

          <div className="product-gallery">

            <div className="product-thumbnails">

              {galleryImages.map(
                (image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    className={`product-thumbnail ${
                      mainImage === image
                        ? 'active'
                        : ''
                    }`}
                    onClick={() =>
                      setMainImage(image)
                    }
                    aria-label={`Afficher l'image ${
                      index + 1
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${
                        index + 1
                      }`}
                    />
                  </button>
                ),
              )}

            </div>

            <div className="product-main-image">

              {mainImage || product.image ? (
                <img
                  src={
                    mainImage ||
                    product.image
                  }
                  alt={
                    product.imageAlt ||
                    product.name
                  }
                  style={
                    product.imagePosition
                      ? {
                          objectPosition:
                            product.imagePosition,
                        }
                      : undefined
                  }
                />
              ) : (
                <div
                  className="product-image-placeholder product-image-placeholder--large"
                  aria-label={
                    product.imageAlt ||
                    product.name
                  }
                >
                  NOVA
                </div>
              )}

            </div>

          </div>

          {/* =========================
              PRODUCT INFO
          ========================= */}

          <div className="product-info">

            <div className="product-info-top">

              {product.isNew ? (
                <span className="product-new-badge">
                  NOUVEAUTÉ
                </span>
              ) : (
                <span />
              )}

              <div className="product-reference">

                <span>
                  Référence : {product.reference}
                </span>

                <button
                  type="button"
                  className="product-icon-button"
                  onClick={handleShare}
                  aria-label="Partager"
                >
                  <Share2 size={17} />
                </button>

                <button
                  type="button"
                  className={`product-icon-button ${
                    favorite
                      ? 'active'
                      : ''
                  }`}
                  onClick={handleFavoriteToggle}
                  aria-label={
                    favorite
                      ? 'Retirer des favoris'
                      : 'Ajouter aux favoris'
                  }
                >
                  <Heart
                    size={18}
                    fill={
                      favorite
                        ? 'currentColor'
                        : 'none'
                    }
                  />
                </button>

              </div>

            </div>

            <h1>
              {product.name}
            </h1>

            <p className="product-short-description">
              {product.description}
            </p>

            {/* =========================
                RATING
            ========================= */}

            <div className="product-rating">

              <div className="product-stars">

                {[1, 2, 3, 4, 5].map(
                  (star) => (
                    <Star
                      key={star}
                      size={14}
                      fill={
                        star <= product.rating
                          ? 'currentColor'
                          : 'none'
                      }
                    />
                  ),
                )}

              </div>

              <span>
                ({product.reviews} avis)
              </span>

            </div>

            {/* =========================
                PRICE
            ========================= */}

            <div className="product-price-row">

              <span className="product-current-price">
                {product.price}
              </span>

              {product.oldPrice ? (
                <span className="product-old-price">
                  {product.oldPrice}
                </span>
              ) : null}

              {product.discount ? (
                <span className="product-discount">
                  {product.discount}
                </span>
              ) : null}

            </div>

            {/* =========================
                COLORS
            ========================= */}

            {colors.length > 0 ? (
            <div className="product-option-block">

              <div className="product-option-title">
                Couleur :{' '}
                <strong>
                  {selectedColor}
                </strong>
              </div>

              <div className="product-color-list">

                {colors.map((color) => (
                  <button
                    key={color.name}
                    type="button"
                    className={`product-color ${
                      selectedColor === color.name
                        ? 'active'
                        : ''
                    }`}
                    style={{
                      '--swatch-color':
                        color.value,
                    }}
                    onClick={() =>
                      handleColorSelect(
                        color.name,
                      )
                    }
                    aria-label={color.name}
                    title={color.name}
                  />
                ))}

              </div>

            </div>
            ) : null}

            {/* =========================
                SIZES
            ========================= */}

            {sizes.length > 0 ? (
            <div className="product-option-block">

              <div className="product-size-header">

                <div className="product-option-title">
                  Taille :{' '}
                  <strong>
                    {selectedSize}
                  </strong>
                </div>

                {product.department !==
                  'Accessoires' && (
                  <button
                    type="button"
                    className="size-guide-button"
                    onClick={
                      showSizeGuideNotice
                    }
                  >
                    <Ruler size={17} />
                    Guide des tailles
                  </button>
                )}

              </div>

              <div className="product-size-list">

                {sizes.map((size) => (
                  <button
                    key={size.name}
                    type="button"
                    disabled={!size.available}
                    className={`product-size ${
                      selectedSize === size.name
                        ? 'active'
                        : ''
                    }`}
                    onClick={() =>
                      handleSizeSelect(
                        size.name,
                      )
                    }
                  >
                    {size.name}
                  </button>
                ))}

              </div>

            </div>
            ) : null}

            {productNotice ? (
              <p
                className="product-option-message"
                role="status"
              >
                {productNotice}
              </p>
            ) : null}

            {/* =========================
                STOCK
            ========================= */}

            <div className="product-stock">

              <span className="product-stock-dot" />

              {currentAvailability}

              {settings.stockDisplay && currentStock > 0 ? (
                <span>
                  {' '}
                  ({currentStock} disponible
                  {currentStock > 1 ? 's' : ''})
                </span>
              ) : null}

            </div>

            {/* =========================
                QUANTITY + ADD CART
            ========================= */}

            <div className="product-actions-row">

              <div className="product-quantity-block">

                <span>
                  Quantité :
                </span>

                <div className="product-quantity">

                  <button
                    type="button"
                    onClick={decreaseQuantity}
                    disabled={quantity === 1}
                    aria-label="Diminuer la quantité"
                  >
                    <Minus size={15} />
                  </button>

                  <span>
                    {quantity}
                  </span>

                  <button
                    type="button"
                    onClick={increaseQuantity}
                    disabled={
                      quantity >= currentStock ||
                      currentStock <= 0
                    }
                    aria-label="Augmenter la quantité"
                  >
                    <Plus size={15} />
                  </button>

                </div>

              </div>

              <button
                type="button"
                className="product-add-cart"
                onClick={handleAddToCart}
                disabled={
                  currentStock <= 0 ||
                  addingToCart
                }
              >
                <ShoppingBag size={18} />

                {addingToCart
                  ? 'Ajout en cours...'
                  : currentStock <= 0
                  ? 'Rupture de stock'
                  : addedToCart
                    ? 'Ajouté au panier ✓'
                    : 'Ajouter au panier'}
              </button>

            </div>

            {/* =========================
                BUY NOW
            ========================= */}

            <button
              type="button"
              className="product-buy-now"
              onClick={handleBuyNow}
              disabled={
                currentStock <= 0 ||
                addingToCart
              }
            >
              Acheter maintenant
            </button>

            {/* =========================
                BENEFITS
            ========================= */}

            <div className="product-benefits">

              <div className="product-benefit">

                <Truck size={23} />

                <div>
                  <strong>
                    Livraison rapide
                  </strong>

                  <span>
                    Partout au Maroc
                  </span>
                </div>

              </div>

              <div className="product-benefit">

                <LockKeyhole size={22} />

                <div>
                  <strong>
                    Paiement sécurisé
                  </strong>

                  <span>
                    100% fiable et crypté
                  </span>
                </div>

              </div>

              <div className="product-benefit">

                <RefreshCw size={22} />

                <div>
                  <strong>
                    Retours faciles
                  </strong>

                  <span>
                    Sous 14 jours
                  </span>
                </div>

              </div>

              <div className="product-benefit">

                <Headphones size={22} />

                <div>
                  <strong>
                    Service client
                  </strong>

                  <span>
                    À votre écoute
                  </span>
                </div>

              </div>

            </div>

            {/* =========================
                TABS
            ========================= */}

            <div className="product-tabs">

              <div className="product-tab-buttons">

                <button
                  type="button"
                  className={
                    activeTab === 'description'
                      ? 'active'
                      : ''
                  }
                  onClick={() =>
                    setActiveTab(
                      'description',
                    )
                  }
                >
                  Description
                </button>

                <button
                  type="button"
                  className={
                    activeTab === 'details'
                      ? 'active'
                      : ''
                  }
                  onClick={() =>
                    setActiveTab(
                      'details',
                    )
                  }
                >
                  Détails
                </button>

                <button
                  type="button"
                  className={
                    activeTab === 'delivery'
                      ? 'active'
                      : ''
                  }
                  onClick={() =>
                    setActiveTab(
                      'delivery',
                    )
                  }
                >
                  Livraison & Retours
                </button>

              </div>

              <div className="product-tab-content">

                {activeTab === 'description' && (
                  <>
                    <p>
                      {product.fullDescription}.
                    </p>
                  </>
                )}

                {activeTab === 'details' && (
                  <ul>

                    <li>
                      Collection NOVA
                    </li>

                    <li>
                      Catégorie :{' '}
                      {product.department}
                    </li>

                    <li>
                      Type :{' '}
                      {product.group}
                    </li>

                    {product.brand ? (
                      <li>
                        Marque : {product.brand}
                      </li>
                    ) : null}

                    <li>
                      Stock sélectionné :{' '}
                      {currentStock}
                    </li>

                    {selectedVariant?.sku ? (
                      <li>
                        SKU :{' '}
                        {selectedVariant.sku}
                      </li>
                    ) : null}

                    <li>
                      Finitions soignées
                    </li>

                    <li>
                      Confort au quotidien
                    </li>

                  </ul>
                )}

                {activeTab === 'delivery' && (
                  <p>
                    Livraison disponible
                    partout au Maroc. Les
                    retours peuvent être
                    demandés sous 14 jours
                    selon les conditions de
                    la boutique NOVA.
                  </p>
                )}

              </div>

            </div>

          </div>

        </section>

        {/* =========================
            REVIEWS
        ========================= */}

        {product.databaseId ? (
          <ProductReviews productId={product.databaseId} />
        ) : null}

        {/* =========================
            SIMILAR PRODUCTS
        ========================= */}

        <section className="similar-products-section">

          <div className="similar-products-header">

            <h2>
              Produits similaires
            </h2>

            <Link to={categoryPath}>
              Voir tout
              <span>→</span>
            </Link>

          </div>

          <div className="similar-products-grid">

            {similarProducts.map(
              (item) => (
                <ProductCard
                  key={item.id}
                  product={item}
                  variant="catalog"
                />
              ),
            )}

          </div>

        </section>

      </div>
    </main>
  )
}

export default ProductDetails
