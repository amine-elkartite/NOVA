import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

import cartService from '../services/cartService'
import productService from '../services/productService'
import promotionService from '../services/promotionService'
import { resolveMediaUrl } from '../services/media'
import { AuthContext } from './AuthContext'

const CartContext = createContext(null)

function normalizeCartItems(items = []) {
  return items.map((item) => {
    const image = resolveMediaUrl(
      item.image_url ||
        item.image ||
        item.product_image ||
        item.primary_image ||
        '',
    )

    const imageAlt =
      item.image_alt ||
      item.alt_text ||
      item.imageAlt ||
      item.name ||
      'Produit NOVA'

    return {
      id: item.product_id,

      databaseId: item.product_id,

      cartItemId: item.id,

      cartKey: String(item.id),

      name: item.name,

      slug: item.slug,

      priceValue: Number(
        item.price || 0,
      ),

      price: `${Number(
        item.price || 0,
      ).toLocaleString('fr-FR')} DH`,

      quantity: Number(
        item.quantity || 0,
      ),

      color: item.color || '',

      size: item.size || '',

      variantId: item.variant_id,

      stock:
        item.variant_id !== null
          ? Number(
              item.variant_stock || 0,
            )
          : Number(
              item.product_stock || 0,
            ),

      image,

      imageAlt,
    }
  })
}

function calculateSubtotal(items = []) {
  return items.reduce(
    (total, item) =>
      total +
      Number(item.priceValue || 0) *
        Number(item.quantity || 0),
    0,
  )
}

export function CartProvider({
  children,
}) {
  const {
    user,
    loading: authLoading,
  } = useContext(AuthContext)

  const [cartItems, setCartItems] =
    useState([])

  const [loading, setLoading] =
    useState(true)

  /*
    =========================
    PROMOTION
    =========================
  */

  const [
    appliedPromotion,
    setAppliedPromotion,
  ] = useState(null)

  const [discount, setDiscount] =
    useState(0)

  const [
    freeShipping,
    setFreeShipping,
  ] = useState(false)

  const [
    promoMessage,
    setPromoMessage,
  ] = useState('')

  const [
    promoError,
    setPromoError,
  ] = useState('')

  const [
    promoLoading,
    setPromoLoading,
  ] = useState(false)

  const clearPromotion = () => {
    setAppliedPromotion(null)
    setDiscount(0)
    setFreeShipping(false)
    setPromoMessage('')
    setPromoError('')
  }

  const validatePromotionForItems =
    async (
      code,
      items,
      {
        showMessage = true,
      } = {},
    ) => {
      const normalizedCode = String(
        code || '',
      )
        .trim()
        .toUpperCase()

      if (!normalizedCode) {
        clearPromotion()

        if (showMessage) {
          setPromoError(
            'Veuillez saisir un code promotionnel.',
          )
        }

        return null
      }

      if (!items.length) {
        clearPromotion()

        if (showMessage) {
          setPromoError(
            'Votre panier est vide.',
          )
        }

        return null
      }

      const currentSubtotal =
        calculateSubtotal(items)

      const productIds = items
        .map((item) =>
          Number(
            item.databaseId ??
              item.productId ??
              item.product_id,
          ),
        )
        .filter(
          (id) =>
            Number.isInteger(id) &&
            id > 0,
        )

      const result =
        await promotionService.validatePromotion(
          {
            code: normalizedCode,
            subtotal: currentSubtotal,
            productIds,
          },
        )

      setAppliedPromotion(
        result.promotion || {
          code: normalizedCode,
        },
      )

      setDiscount(
        Number(
          result.discountAmount || 0,
        ),
      )

      setFreeShipping(
        Boolean(result.freeShipping),
      )

      setPromoError('')

      if (showMessage) {
        if (result.freeShipping) {
          setPromoMessage(
            'Code appliqué : livraison gratuite.',
          )
        } else {
          setPromoMessage(
            `Code appliqué : ${Number(
              result.discountAmount || 0,
            ).toLocaleString(
              'fr-FR',
            )} DH de réduction.`,
          )
        }
      }

      return result
    }

  const applyPromotion = async (
    code,
  ) => {
    try {
      setPromoLoading(true)
      setPromoError('')
      setPromoMessage('')

      return await validatePromotionForItems(
        code,
        cartItems,
        {
          showMessage: true,
        },
      )
    } catch (error) {
      clearPromotion()

      setPromoError(
        error.message ||
          'Code promotionnel invalide.',
      )

      throw error
    } finally {
      setPromoLoading(false)
    }
  }

  /*
    =========================
    CART RESPONSE
    =========================
  */

  const applyCartResponse = async (
    data,
  ) => {
    const items =
      normalizeCartItems(
        data?.cart?.items || [],
      )

    setCartItems(items)

    /*
      Si une promotion est déjà appliquée,
      on la recalcule après modification
      du panier.
    */
    if (
      appliedPromotion?.code &&
      items.length > 0
    ) {
      try {
        await validatePromotionForItems(
          appliedPromotion.code,
          items,
          {
            showMessage: false,
          },
        )
      } catch {
        clearPromotion()

        setPromoError(
          'La promotion n’est plus valable pour ce panier.',
        )
      }
    }

    if (items.length === 0) {
      clearPromotion()
    }
  }

  /*
    =========================
    LOAD CART
    =========================
  */

  useEffect(() => {
    async function loadCart() {
      if (authLoading) {
        return
      }

      if (!user) {
        setCartItems([])
        clearPromotion()
        setLoading(false)
        return
      }

      try {
        setLoading(true)

        const data =
          await cartService.getCart()

        await applyCartResponse(data)
      } catch (error) {
        console.error(
          'Erreur chargement panier:',
          error,
        )
      } finally {
        setLoading(false)
      }
    }

    loadCart()
  }, [
    user,
    authLoading,
  ])

  /*
    =========================
    VARIANT
    =========================
  */

  const findVariantId = async (
    product,
    size,
    color,
  ) => {
    const slug =
      product.slug || product.id

    if (!slug) {
      throw new Error(
        'Impossible d’identifier le produit.',
      )
    }

    const data =
      await productService.getProductBySlug(
        slug,
      )

    const variants =
      data?.product?.variants || []

    const variant =
      variants.find((item) => {
        const sameSize =
          String(
            item.size || '',
          ) ===
          String(size || '')

        const sameColor =
          String(
            item.color || '',
          ) ===
          String(color || '')

        return (
          sameSize &&
          sameColor
        )
      })

    if (!variant) {
      throw new Error(
        'Cette variante est indisponible.',
      )
    }

    if (
      Number(
        variant.stock || 0,
      ) <= 0
    ) {
      throw new Error(
        'Cette variante est en rupture de stock.',
      )
    }

    return variant.id
  }

  /*
    =========================
    ADD TO CART
    =========================
  */

  const addToCart = async (
    product,
    {
      quantity = 1,
      color = '',
      size = '',
      variantId = null,
    } = {},
  ) => {
    if (!user) {
      throw new Error(
        'Vous devez vous connecter pour ajouter un produit au panier.',
      )
    }

    const productId =
      product.databaseId ??
      (Number.isInteger(
        product.id,
      )
        ? product.id
        : null)

    if (!productId) {
      throw new Error(
        'Identifiant produit introuvable.',
      )
    }

    const normalizedVariantId =
      variantId === null ||
      variantId === undefined ||
      variantId === ''
        ? null
        : Number(variantId)

    if (
      normalizedVariantId !== null &&
      (
        !Number.isInteger(
          normalizedVariantId,
        ) ||
        normalizedVariantId <= 0
      )
    ) {
      throw new Error(
        'Variante invalide.',
      )
    }

    const hasVariantOptions =
      Array.isArray(product.variants) &&
      product.variants.length > 0

    const resolvedVariantId =
      normalizedVariantId !== null
        ? normalizedVariantId
        : hasVariantOptions
          ? await findVariantId(
              product,
              size,
              color,
            )
          : null

    const data =
      await cartService.addItem({
        productId,
        variantId:
          resolvedVariantId,
        quantity,
      })

    await applyCartResponse(data)

    return data
  }

  /*
    =========================
    INCREASE
    =========================
  */

  const increaseQuantity =
    async (cartKey) => {
      const item =
        cartItems.find(
          (cartItem) =>
            cartItem.cartKey ===
            cartKey,
        )

      if (!item) {
        return
      }

      const data =
        await cartService.updateItem(
          item.cartItemId,
          item.quantity + 1,
        )

      await applyCartResponse(data)
    }

  /*
    =========================
    DECREASE
    =========================
  */

  const decreaseQuantity =
    async (cartKey) => {
      const item =
        cartItems.find(
          (cartItem) =>
            cartItem.cartKey ===
            cartKey,
        )

      if (!item) {
        return
      }

      if (item.quantity <= 1) {
        return
      }

      const data =
        await cartService.updateItem(
          item.cartItemId,
          item.quantity - 1,
        )

      await applyCartResponse(data)
    }

  /*
    =========================
    REMOVE
    =========================
  */

  const removeFromCart =
    async (cartKey) => {
      const item =
        cartItems.find(
          (cartItem) =>
            cartItem.cartKey ===
            cartKey,
        )

      if (!item) {
        return
      }

      const data =
        await cartService.removeItem(
          item.cartItemId,
        )

      await applyCartResponse(data)
    }

  /*
    =========================
    CLEAR CART
    =========================
  */

  const clearCart = async () => {
    const data =
      await cartService.clearCart()

    await applyCartResponse(data)
  }

  /*
    =========================
    TOTALS
    =========================
  */

  const itemCount =
    useMemo(
      () =>
        cartItems.reduce(
          (
            total,
            item,
          ) =>
            total +
            Number(
              item.quantity || 0,
            ),
          0,
        ),
      [cartItems],
    )

  const subtotal =
    useMemo(
      () =>
        calculateSubtotal(
          cartItems,
        ),
      [cartItems],
    )

  const totalAfterDiscount =
    useMemo(
      () =>
        Math.max(
          0,
          subtotal -
            Number(
              discount || 0,
            ),
        ),
      [
        subtotal,
        discount,
      ],
    )

  /*
    =========================
    CONTEXT VALUE
    =========================
  */

  const value = {
    cartItems,

    addToCart,

    increaseQuantity,

    decreaseQuantity,

    removeFromCart,

    clearCart,

    itemCount,

    subtotal,

    loading,

    appliedPromotion,

    discount,

    freeShipping,

    promoMessage,

    promoError,

    promoLoading,

    applyPromotion,

    clearPromotion,

    totalAfterDiscount,
  }

  return (
    <CartContext.Provider
      value={value}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context =
    useContext(
      CartContext,
    )

  if (!context) {
    throw new Error(
      'useCart doit être utilisé dans CartProvider',
    )
  }

  return context
}

export default CartContext
