import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

import { AuthContext } from './AuthContext'
import favoriteService from '../services/favoriteService'
import { resolveMediaUrl } from '../services/media'

const WishlistContext = createContext(null)

function formatPrice(value) {
  return `${Number(value || 0).toLocaleString('fr-FR')} DH`
}

function normalizeFavorite(favorite) {
  const priceValue = Number(favorite.price || 0)

  const oldPriceValue =
    favorite.old_price !== null &&
    favorite.old_price !== undefined
      ? Number(favorite.old_price)
      : null

  return {
    id: favorite.slug,

    slug: favorite.slug,

    databaseId: Number(favorite.id),

    favoriteId: favorite.favorite_id,

    name: favorite.name,

    description:
      favorite.short_description ||
      favorite.description ||
      '',

    priceValue,

    price: formatPrice(priceValue),

    oldPrice:
      oldPriceValue !== null
        ? formatPrice(oldPriceValue)
        : undefined,

    stock: Number(favorite.stock || 0),

    gender: favorite.gender,

    brand: favorite.brand,

    status: favorite.status,

    featured: Boolean(favorite.featured),

    image:
      resolveMediaUrl(favorite.image_url),

    imageAlt:
      favorite.image_alt ||
      favorite.name ||
      'Produit NOVA',

    group:
      favorite.category_name || '',

    department:
      favorite.category_name || '',

    categoryName: favorite.category_name || '',

    categorySlug: favorite.category_slug || '',

    createdAt: favorite.created_at,

    favoriteCreatedAt:
      favorite.favorite_created_at,
  }
}

export function WishlistProvider({ children }) {
  const auth = useContext(AuthContext)

  const user = auth?.user
  const authLoading = auth?.loading ?? true

  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (authLoading) {
      return
    }

    if (!user) {
      setFavorites([])
      setLoading(false)
      setError('')
      return
    }

    let cancelled = false

    async function loadFavorites() {
      setLoading(true)
      setError('')

      try {
        const data =
          await favoriteService.getFavorites()

        if (cancelled) {
          return
        }

        const normalizedFavorites =
          Array.isArray(data?.favorites)
            ? data.favorites
                .map(normalizeFavorite)
                .filter(
                  (product) =>
                    product.id &&
                    Number.isInteger(
                      product.databaseId,
                    ) &&
                    product.databaseId > 0,
                )
            : []

        setFavorites(normalizedFavorites)
      } catch (requestError) {
        if (cancelled) {
          return
        }

        setFavorites([])

        setError(
          requestError.message ||
            'Impossible de charger les favoris.',
        )
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadFavorites()

    return () => {
      cancelled = true
    }
  }, [user, authLoading])

  const resolveProduct = (productOrSlug, databaseId) => {
    if (
      productOrSlug &&
      typeof productOrSlug === 'object'
    ) {
      const slug =
        productOrSlug.slug ||
        productOrSlug.id

      const numericDatabaseId = Number(
        productOrSlug.databaseId ??
          productOrSlug.productId ??
          productOrSlug.product_id,
      )

      return {
        product: productOrSlug,
        slug,
        databaseId: numericDatabaseId,
      }
    }

    return {
      product: null,
      slug: productOrSlug,
      databaseId: Number(databaseId),
    }
  }

  const addFavorite = async (
    productOrSlug,
    databaseId,
  ) => {
    if (!user) {
      throw new Error(
        'Vous devez être connecté pour ajouter un favori.',
      )
    }

    const resolved = resolveProduct(
      productOrSlug,
      databaseId,
    )

    if (
      !resolved.slug ||
      !Number.isInteger(resolved.databaseId) ||
      resolved.databaseId <= 0
    ) {
      throw new Error(
        'Identifiant produit introuvable.',
      )
    }

    setError('')

    const data =
      await favoriteService.addFavorite(
        resolved.databaseId,
      )

    setFavorites((currentFavorites) => {
      const alreadyExists =
        currentFavorites.some(
          (favorite) =>
            favorite.id === resolved.slug,
        )

      if (alreadyExists) {
        return currentFavorites
      }

      if (resolved.product) {
        return [
          {
            ...resolved.product,
            id: resolved.slug,
            slug: resolved.slug,
            databaseId:
              resolved.databaseId,
          },
          ...currentFavorites,
        ]
      }

      const returnedProduct =
        data?.product

      if (returnedProduct?.slug) {
        return [
          normalizeFavorite({
            ...returnedProduct,
            id: resolved.databaseId,
          }),
          ...currentFavorites,
        ]
      }

      return currentFavorites
    })

    return data
  }

  const removeFavorite = async (
    productOrSlug,
    databaseId,
  ) => {
    if (!user) {
      throw new Error(
        'Vous devez être connecté pour modifier vos favoris.',
      )
    }

    const resolved = resolveProduct(
      productOrSlug,
      databaseId,
    )

    let numericDatabaseId =
      resolved.databaseId

    if (
      !Number.isInteger(numericDatabaseId) ||
      numericDatabaseId <= 0
    ) {
      const existingFavorite =
        favorites.find(
          (favorite) =>
            favorite.id === resolved.slug,
        )

      numericDatabaseId =
        Number(
          existingFavorite?.databaseId,
        )
    }

    if (
      !Number.isInteger(numericDatabaseId) ||
      numericDatabaseId <= 0
    ) {
      throw new Error(
        'Identifiant produit introuvable.',
      )
    }

    setError('')

    const data =
      await favoriteService.removeFavorite(
        numericDatabaseId,
      )

    setFavorites((currentFavorites) =>
      currentFavorites.filter(
        (favorite) =>
          favorite.id !== resolved.slug &&
          favorite.databaseId !==
            numericDatabaseId,
      ),
    )

    return data
  }

  const toggleFavorite = async (
    productOrSlug,
    databaseId,
  ) => {
    const resolved = resolveProduct(
      productOrSlug,
      databaseId,
    )

    const favorite = favorites.find(
      (item) =>
        item.id === resolved.slug,
    )

    if (favorite) {
      await removeFavorite(
        favorite,
      )

      return
    }

    await addFavorite(
      productOrSlug,
      databaseId,
    )
  }

  const favoriteIds = useMemo(
    () =>
      favorites.map(
        (favorite) =>
          favorite.id,
      ),
    [favorites],
  )

  const favoriteProducts = useMemo(
    () => favorites,
    [favorites],
  )

  const isFavorite = (productOrSlug) => {
    const slug =
      productOrSlug &&
      typeof productOrSlug === 'object'
        ? productOrSlug.slug ||
          productOrSlug.id
        : productOrSlug

    return favoriteIds.includes(slug)
  }

  const value = {
    favoriteIds,
    favoriteProducts,
    loading,
    error,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
  }

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  const context =
    useContext(WishlistContext)

  if (!context) {
    throw new Error(
      'useWishlist doit être utilisé dans WishlistProvider',
    )
  }

  return context
}

export default WishlistContext
