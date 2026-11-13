import api from './api'

export const adminProfileChangedEvent = 'nova:admin-profile-updated'

export const orderStatusLabels = {
  pending: 'En attente',
  confirmed: 'Confirmee',
  processing: 'En preparation',
  preparing: 'En preparation',
  shipped: 'Expediee',
  delivered: 'Livree',
  cancelled: 'Annulee',
}

const API_ORIGIN = (
  api.defaults.baseURL || ''
).replace(/\/api\/?$/, '')

const emptyAdminProfile = {
  firstName: '',
  lastName: '',
  fullName: 'Administrateur',
  initials: 'AD',
  role: 'Administrateur',
  email: '',
  phone: '',
  location: '',
  memberSince: '',
  address: '',
  avatarUrl: '',
}

export function getAdminApiErrorMessages(error) {
  if (Array.isArray(error?.errors) && error.errors.length > 0) {
    return error.errors
  }

  if (Array.isArray(error?.data?.errors) && error.data.errors.length > 0) {
    return error.data.errors
  }

  return [
    error?.message ||
      'Une erreur est survenue pendant la communication avec le serveur.',
  ]
}

export function slugify(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function getInitials(name) {
  return String(name || '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('')
}

function parseAdminNumber(value) {
  if (typeof value === 'number') {
    return value
  }

  const normalizedValue = String(value ?? '')
    .replace(',', '.')
    .replace(/[^\d.-]/g, '')

  const numberValue = Number(normalizedValue)

  return Number.isFinite(numberValue) ? numberValue : 0
}

function formatAdminPrice(value) {
  const amount = parseAdminNumber(value)

  return `${amount.toLocaleString('fr-FR')} DH`
}

function formatAdminDate(value) {
  if (!value) {
    return 'Base de donnees'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Base de donnees'
  }

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function resolveMediaUrl(value) {
  const url = String(value || '').trim()

  if (!url) {
    return ''
  }

  if (url.startsWith('/uploads/')) {
    return `${API_ORIGIN}${url}`
  }

  return url
}

function toPersistentMediaUrl(value) {
  const url = String(value || '').trim()

  if (
    !url ||
    url.startsWith('blob:') ||
    url.startsWith('data:')
  ) {
    return ''
  }

  if (
    API_ORIGIN &&
    url.startsWith(`${API_ORIGIN}/uploads/`)
  ) {
    return url.slice(API_ORIGIN.length)
  }

  return url
}

function getProductFallback(categoryName) {
  const normalizedCategory = slugify(categoryName)

  if (normalizedCategory.includes('sac')) {
    return 'bag'
  }

  if (normalizedCategory.includes('montre')) {
    return 'watch'
  }

  if (normalizedCategory.includes('lunette')) {
    return 'glasses'
  }

  if (normalizedCategory.includes('casquette')) {
    return 'cap'
  }

  if (
    normalizedCategory.includes('vetement') ||
    normalizedCategory.includes('pull')
  ) {
    return 'clothes'
  }

  return 'shoe'
}

function getCategoryFallback(categoryName) {
  const normalizedCategory = slugify(categoryName)

  if (normalizedCategory.includes('chaussure')) {
    return 'shoes'
  }

  if (normalizedCategory.includes('sac')) {
    return 'bag'
  }

  if (normalizedCategory.includes('montre')) {
    return 'watch'
  }

  if (normalizedCategory.includes('lunette')) {
    return 'glasses'
  }

  if (normalizedCategory.includes('casquette')) {
    return 'cap'
  }

  if (normalizedCategory.includes('homme')) {
    return 'menswear'
  }

  if (normalizedCategory.includes('femme')) {
    return 'womenswear'
  }

  return 'jewelry'
}

function getProductStockStatus(quantity, threshold = 5) {
  if (quantity <= 0) {
    return 'out-stock'
  }

  if (quantity <= threshold) {
    return 'low-stock'
  }

  return 'in-stock'
}

function getPublicationStatus(status) {
  if (status === 'active') {
    return 'published'
  }

  if (status === 'draft') {
    return 'draft'
  }

  return 'published'
}

function getVisibility(status) {
  return status === 'inactive' || status === 'archived'
    ? 'hidden'
    : 'visible'
}

function getPrimaryImage(product) {
  if (Array.isArray(product.images) && product.images.length > 0) {
    const image =
      product.images.find((item) => item.is_primary)?.image_url ||
      product.images.find((item) => item.isPrimary)?.image_url ||
      product.images[0].image_url ||
      product.images[0].url ||
      product.images[0].src ||
      ''

    return resolveMediaUrl(image)
  }

  return resolveMediaUrl(product.image_url || product.image || '')
}

function uniqueValues(values) {
  return Array.from(
    new Set(
      values
        .map((value) => String(value || '').trim())
        .filter(Boolean),
    ),
  )
}

function getVariantValues(product, fieldName) {
  if (Array.isArray(product[fieldName])) {
    return uniqueValues(product[fieldName])
  }

  if (!Array.isArray(product.variants)) {
    return []
  }

  return uniqueValues(
    product.variants.map((variant) => variant[fieldName.slice(0, -1)]),
  )
}

export function normalizeProductForList(product) {
  const categoryName =
    product.category_name ||
    product.categoryName ||
    product.category ||
    'Sans categorie'
  const currentPrice =
    parseAdminNumber(product.price ?? product.salePrice ?? 0)
  const oldPriceValue =
    product.old_price !== undefined && product.old_price !== null
      ? parseAdminNumber(product.old_price)
      : parseAdminNumber(product.oldPrice || 0)
  const regularPrice =
    oldPriceValue > currentPrice ? oldPriceValue : currentPrice
  const salePrice =
    oldPriceValue > currentPrice ? currentPrice : 0
  const quantity =
    Number(product.stock ?? product.quantity ?? 0)
  const lowStockThreshold =
    Number(product.lowStockThreshold || 5)
  const statusType =
    product.stockStatus ||
    getProductStockStatus(quantity, lowStockThreshold)
  const dbStatus =
    product.status || 'draft'

  return {
    ...product,
    id: product.id,
    sku: product.sku || '',
    description: product.description || '',
    categoryId: product.category_id ?? product.categoryId ?? '',
    categorySlug: product.category_slug ?? product.categorySlug ?? '',
    category: categoryName,
    regularPrice: String(product.regularPrice || regularPrice || ''),
    salePrice: salePrice ? String(salePrice) : '',
    quantity: String(product.quantity ?? quantity),
    lowStockThreshold: String(lowStockThreshold),
    stockStatus: statusType,
    publicationStatus:
      product.publicationStatus || getPublicationStatus(dbStatus),
    visibility: product.visibility || getVisibility(dbStatus),
    featured: Boolean(product.featured),
    price: formatAdminPrice(currentPrice),
    oldPrice:
      oldPriceValue > currentPrice
        ? formatAdminPrice(oldPriceValue)
        : null,
    stock: quantity,
    status:
      statusType === 'out-stock'
        ? 'Rupture'
        : statusType === 'low-stock'
          ? 'Stock faible'
          : 'En stock',
    statusType,
    sizes: getVariantValues(product, 'sizes'),
    colors: getVariantValues(product, 'colors'),
    sales: Number(product.sales || 0),
    date: formatAdminDate(product.created_at || product.date),
    image: getPrimaryImage(product),
    images: Array.isArray(product.images)
      ? product.images.map((image) => ({
          ...image,
          image_url: resolveMediaUrl(image.image_url || image.url || image.src),
        }))
      : [],
    variants: Array.isArray(product.variants) ? product.variants : [],
    fallback: product.fallback || getProductFallback(categoryName),
  }
}

function getProductApiStatus(product) {
  if (product.visibility === 'hidden') {
    return 'inactive'
  }

  if (product.publicationStatus === 'published') {
    return 'active'
  }

  if (
    product.publicationStatus === 'draft' ||
    product.publicationStatus === 'scheduled'
  ) {
    return 'draft'
  }

  return product.status || 'draft'
}

function getProductImagesPayload(product) {
  const images = Array.isArray(product.images)
    ? product.images
    : []

  const normalizedImages = images
    .map((image, index) => {
      const url =
        toPersistentMediaUrl(
          image.image_url ||
            image.url ||
            image.src,
        )

      if (!url) {
        return null
      }

      return {
        image_url: url,
        alt_text: image.alt_text || image.altText || product.name,
        is_primary:
          index === 0 ||
          image.is_primary === true ||
          image.isPrimary === true,
        sort_order: image.sort_order ?? image.sortOrder ?? index,
      }
    })
    .filter(Boolean)

  if (normalizedImages.length > 0) {
    return normalizedImages
  }

  const image =
    toPersistentMediaUrl(product.image)

  if (!image) {
    return []
  }

  return [
    {
      image_url: image,
      alt_text: product.name,
      is_primary: true,
      sort_order: 0,
    },
  ]
}

function getProductVariantsPayload(product) {
  const sizes = uniqueValues(product.sizes || [])
  const colors = uniqueValues(product.colors || [])
  const stock = Number(product.quantity ?? product.stock ?? 0)

  if (sizes.length === 0 && colors.length === 0) {
    return []
  }

  if (sizes.length === 0) {
    return colors.map((color) => ({
      color,
      stock,
    }))
  }

  if (colors.length === 0) {
    return sizes.map((size) => ({
      size,
      stock,
    }))
  }

  return sizes.flatMap((size) =>
    colors.map((color) => ({
      size,
      color,
      stock,
    })),
  )
}

function getProductPayload(product) {
  const regularPrice = parseAdminNumber(product.regularPrice)
  const salePrice = parseAdminNumber(product.salePrice)
  const price = salePrice || regularPrice
  const oldPrice = salePrice && regularPrice ? regularPrice : null
  const categoryId = Number(product.categoryId ?? product.category_id)

  return {
    name: product.name,
    slug: product.slug || slugify(product.name),
    sku: product.sku || null,
    category_id:
      Number.isInteger(categoryId) && categoryId > 0 ? categoryId : null,
    category: product.category || null,
    short_description: product.shortDescription || null,
    description: product.description || null,
    price,
    old_price: oldPrice,
    stock: Number(product.quantity ?? product.stock ?? 0),
    gender: product.gender || null,
    brand: product.brand || null,
    status: getProductApiStatus(product),
    featured: Boolean(product.featured),
    images: getProductImagesPayload(product),
    variants: getProductVariantsPayload(product),
  }
}

export async function getProducts() {
  const response = await api.get('/products/admin')

  return (response.data.products || []).map(normalizeProductForList)
}

export async function getProduct(productId) {
  const response = await api.get(`/products/admin/${productId}`)

  return normalizeProductForList(response.data.product)
}

export async function upsertProduct(product) {
  const payload = getProductPayload(product)
  const response = product.id
    ? await api.put(`/products/admin/${product.id}`, payload)
    : await api.post('/products/admin', payload)

  return normalizeProductForList(response.data.product)
}

export async function deleteProduct(productId) {
  const response = await api.delete(`/products/admin/${productId}`)

  return {
    ...response.data,
    product: response.data.product
      ? normalizeProductForList(response.data.product)
      : null,
  }
}

export function normalizeCategoryForList(category) {
  const statusType =
    category.statusType ||
    category.status ||
    'active'

  return {
    ...category,
    id: category.id,
    description: category.description || '',
    slug: category.slug || slugify(category.name),
    status: statusType === 'inactive' ? 'Inactive' : 'Active',
    statusType,
    products: Number(category.product_count ?? category.products ?? 0),
    date: formatAdminDate(category.created_at || category.date),
    image: resolveMediaUrl(category.image || ''),
    fallback: category.fallback || getCategoryFallback(category.name),
  }
}

function getCategoryPayload(category) {
  return {
    name: category.name,
    slug: category.slug || slugify(category.name),
    description: category.description || null,
    image: toPersistentMediaUrl(category.image),
    status: category.statusType || category.status || 'active',
  }
}

export async function getCategories() {
  const response = await api.get('/categories/admin')

  return (response.data.categories || []).map(normalizeCategoryForList)
}

export async function getCategory(categoryId) {
  const response = await api.get(`/categories/admin/${categoryId}`)

  return normalizeCategoryForList(response.data.category)
}

export async function upsertCategory(category) {
  const payload = getCategoryPayload(category)
  const response = category.id
    ? await api.put(`/categories/admin/${category.id}`, payload)
    : await api.post('/categories/admin', payload)

  return normalizeCategoryForList(response.data.category)
}

export async function deleteCategory(categoryId) {
  await api.delete(`/categories/admin/${categoryId}`)
}

function normalizeAdminOrderStatus(status) {
  return status === 'processing'
    ? 'preparing'
    : status || 'pending'
}

function normalizeOrderStatusForApi(status) {
  return status === 'preparing'
    ? 'processing'
    : status
}

function getPaymentType(paymentMethod) {
  const method = String(paymentMethod || '').toLowerCase()

  if (method.includes('paypal')) {
    return 'paypal'
  }

  if (
    method.includes('cash') ||
    method.includes('delivery') ||
    method.includes('livraison')
  ) {
    return 'delivery'
  }

  return 'card'
}

function getPaymentLabel(paymentMethod) {
  const paymentType = getPaymentType(paymentMethod)

  if (paymentType === 'paypal') {
    return 'PayPal'
  }

  if (paymentType === 'delivery') {
    return 'A la livraison'
  }

  return 'Carte bancaire'
}

function pluralizeArticles(count) {
  const amount = Number(count || 0)

  return `${amount} ${amount > 1 ? 'articles' : 'article'}`
}

function parseJsonObject(value) {
  if (!value) {
    return null
  }

  if (typeof value === 'object') {
    return value
  }

  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

function formatAddressLine(address) {
  if (!address) {
    return ''
  }

  return [
    address.address_line1,
    address.address_line2,
    address.city,
    address.postal_code,
    address.country,
  ]
    .filter(Boolean)
    .join(', ')
}

export function normalizeOrderForAdmin(order) {
  const statusClass = normalizeAdminOrderStatus(order.status)
  const customerName =
    `${order.first_name || ''} ${order.last_name || ''}`.trim() ||
    order.customer ||
    order.email ||
    `Client #${order.user_id || order.customerId || ''}`.trim()
  const quantity =
    Number(order.item_quantity ?? order.quantity ?? 0)
  const items =
    Array.isArray(order.items)
      ? order.items
      : []
  const shippingAddress =
    parseJsonObject(order.shipping_address) ||
    order.shippingAddress ||
    null

  return {
    ...order,
    id: `#${order.id}`,
    rawId: order.id,
    orderNumber: order.order_number || String(order.id),
    customerId: order.user_id ?? order.customerId,
    customer: customerName,
    customerEmail: order.email || '',
    customerPhone: order.phone || shippingAddress?.phone || '',
    customerCity: order.city || shippingAddress?.city || '',
    initials: getInitials(customerName),
    products:
      quantity > 0
        ? pluralizeArticles(quantity)
        : pluralizeArticles(
            items.reduce(
              (total, item) => total + Number(item.quantity || 0),
              0,
            ),
          ),
    itemLines: Number(order.item_lines || items.length || 0),
    amount: formatAdminPrice(order.total || 0),
    amountValue: parseAdminNumber(order.total || 0),
    subtotal: formatAdminPrice(order.subtotal || 0),
    subtotalValue: parseAdminNumber(order.subtotal || 0),
    shipping: formatAdminPrice(order.shipping_cost || 0),
    shippingValue: parseAdminNumber(order.shipping_cost || 0),
    discount: formatAdminPrice(order.discount || 0),
    discountValue: parseAdminNumber(order.discount || 0),
    payment: getPaymentLabel(order.payment_method),
    paymentType: getPaymentType(order.payment_method),
    paymentMethod: order.payment_method || '',
    paymentStatus: order.payment_status || '',
    statusClass,
    status: orderStatusLabels[statusClass] || statusClass,
    date: formatAdminDate(order.created_at || order.date),
    updatedDate: formatAdminDate(order.updated_at),
    shippingAddress,
    shippingAddressText: formatAddressLine(shippingAddress),
    notes: order.notes || '',
    items,
  }
}

export async function getOrders() {
  const response = await api.get('/orders/admin')

  return (response.data.orders || []).map(normalizeOrderForAdmin)
}

export async function getOrder(orderId) {
  const normalizedId = String(orderId || '').replace(/^#/, '')
  const response = await api.get(`/orders/admin/${normalizedId}`)

  return normalizeOrderForAdmin(response.data.order)
}

export async function updateOrderStatus(orderId, status) {
  const normalizedId = String(orderId || '').replace(/^#/, '')
  const response = await api.patch(
    `/orders/admin/${normalizedId}/status`,
    {
      status: normalizeOrderStatusForApi(status),
    },
  )

  return normalizeOrderForAdmin(response.data.order)
}

export function normalizeCustomerForAdmin(customer) {
  const name =
    `${customer.first_name || ''} ${customer.last_name || ''}`.trim() ||
    customer.name ||
    customer.email ||
    `Client #${customer.id}`
  const statusType =
    Number(customer.is_active) === 1 ||
    customer.statusType === 'active'
      ? 'active'
      : 'inactive'
  const city =
    customer.city ||
    customer.address_city ||
    'Non renseignee'
  const phone =
    customer.phone ||
    customer.address_phone ||
    'Non renseigne'
  const recentOrders =
    Array.isArray(customer.recent_orders)
      ? customer.recent_orders.map((order) =>
          normalizeOrderForAdmin({
            ...order,
            user_id: customer.id,
            first_name: customer.first_name,
            last_name: customer.last_name,
            email: customer.email,
            phone,
            city,
          }),
        )
      : []

  return {
    ...customer,
    id: customer.id,
    name,
    initials: getInitials(name),
    email: customer.email || '',
    phone,
    city,
    country:
      customer.country ||
      customer.address_country ||
      'Maroc',
    orders: Number(customer.orders_count || customer.orders || 0),
    spent: parseAdminNumber(customer.total_spent ?? customer.spent ?? 0),
    status: statusType === 'active' ? 'Actif' : 'Inactif',
    statusType,
    date: formatAdminDate(customer.created_at || customer.date),
    updatedDate: formatAdminDate(customer.updated_at),
    lastOrder: customer.last_order_at
      ? formatAdminDate(customer.last_order_at)
      : 'Aucune',
    addresses: Array.isArray(customer.addresses) ? customer.addresses : [],
    recentOrders,
    tags: Array.isArray(customer.tags) ? customer.tags : [],
    note: customer.note || '',
  }
}

export async function getCustomers() {
  const response = await api.get('/users/admin/customers')

  return (response.data.customers || []).map(normalizeCustomerForAdmin)
}

export async function getCustomer(customerId) {
  const response = await api.get(`/users/admin/customers/${customerId}`)

  return normalizeCustomerForAdmin(response.data.customer)
}

export async function updateCustomerStatus(customerId, status) {
  const response = await api.patch(
    `/users/admin/customers/${customerId}/status`,
    {
      status,
    },
  )

  return normalizeCustomerForAdmin(response.data.customer)
}

function getPromotionTypeInfo(type) {
  if (type === 'free_shipping' || type === 'delivery') {
    return {
      type: 'Livraison',
      typeClass: 'delivery',
    }
  }

  if (type === 'fixed' || type === 'discount') {
    return {
      type: 'Reduction',
      typeClass: 'discount',
    }
  }

  return {
    type: 'Code promo',
    typeClass: 'code',
  }
}

function getPromotionStatusInfo(status) {
  if (status === 'scheduled' || status === 'planned') {
    return {
      status: 'Planifiee',
      statusClass: 'planned',
    }
  }

  if (status === 'expired') {
    return {
      status: 'Expiree',
      statusClass: 'expired',
    }
  }

  if (status === 'inactive' || status === 'draft') {
    return {
      status: 'Brouillon',
      statusClass: 'draft',
    }
  }

  return {
    status: 'Active',
    statusClass: 'active',
  }
}

function getPromotionReduction(promotion) {
  if (promotion.type === 'free_shipping') {
    return 'Livraison gratuite'
  }

  if (promotion.type === 'percentage') {
    return `-${parseAdminNumber(promotion.value)}%`
  }

  return `-${parseAdminNumber(promotion.value).toLocaleString('fr-FR')} DH`
}

function getPromotionPeriod(promotion) {
  const start =
    promotion.start_date || promotion.startDate
  const end =
    promotion.end_date || promotion.endDate

  if (!start && !end) {
    return 'Sans limite'
  }

  return `${start ? formatAdminDate(start) : 'Maintenant'} - ${
    end ? formatAdminDate(end) : 'Sans fin'
  }`
}

export function normalizePromotionForAdmin(promotion) {
  const typeInfo = getPromotionTypeInfo(promotion.type || promotion.typeClass)
  const statusInfo = getPromotionStatusInfo(
    promotion.status || promotion.statusClass,
  )
  const productCount =
    Number(promotion.product_count ?? promotion.productCount ?? 0)

  return {
    ...promotion,
    id: promotion.id,
    title: promotion.name || promotion.title,
    name: promotion.name || promotion.title,
    code: promotion.code || '',
    apiType: promotion.type,
    value: parseAdminNumber(promotion.value),
    minimumAmount: parseAdminNumber(promotion.minimum_amount),
    maxUses: promotion.max_uses,
    usedCount: Number(promotion.used_count || 0),
    startDate: promotion.start_date || '',
    endDate: promotion.end_date || '',
    productIds: promotion.product_ids || [],
    ...typeInfo,
    reduction: getPromotionReduction(promotion),
    period: getPromotionPeriod(promotion),
    products:
      productCount > 0
        ? `${productCount} ${productCount > 1 ? 'produits' : 'produit'}`
        : 'Tous les produits',
    ...statusInfo,
    image: '',
    fallback: typeInfo.typeClass === 'delivery' ? 'delivery' : 'loyalty',
  }
}

function mapPromotionStatusToApi(status) {
  if (status === 'planned' || status === 'scheduled') {
    return 'scheduled'
  }

  if (status === 'expired') {
    return 'expired'
  }

  if (status === 'draft' || status === 'inactive') {
    return 'inactive'
  }

  return 'active'
}

function getPromotionPayload(promotion) {
  const type =
    promotion.apiType ||
    (promotion.type === 'shipping' ||
    promotion.typeClass === 'delivery'
      ? 'free_shipping'
      : promotion.discountMode === 'fixed' ||
          promotion.typeClass === 'discount'
        ? 'fixed'
        : 'percentage')

  return {
    name: promotion.name || promotion.title,
    code: promotion.code,
    type,
    value:
      type === 'free_shipping'
        ? 0
        : parseAdminNumber(
            promotion.value ??
              promotion.discountValue ??
              promotion.reduction,
          ),
    minimumAmount: parseAdminNumber(
      promotion.minimumAmount ??
        promotion.minOrderAmount,
    ),
    maxUses:
      promotion.maxUses === '' ||
      promotion.maxUses === undefined
        ? null
        : Number(promotion.maxUses),
    startDate:
      promotion.startDate || null,
    endDate:
      promotion.endDate || null,
    status: mapPromotionStatusToApi(
      promotion.statusClass ||
        promotion.status ||
        'active',
    ),
    productIds:
      Array.isArray(promotion.productIds)
        ? promotion.productIds
        : undefined,
  }
}

export async function getPromotions() {
  const response = await api.get('/promotions')

  return (response.data.promotions || []).map(normalizePromotionForAdmin)
}

export async function getPromotion(promotionId) {
  const response = await api.get(`/promotions/${promotionId}`)

  return normalizePromotionForAdmin(response.data.promotion)
}

export async function upsertPromotion(promotion) {
  const payload = getPromotionPayload(promotion)
  const response = promotion.id
    ? await api.put(`/promotions/${promotion.id}`, payload)
    : await api.post('/promotions', payload)

  return normalizePromotionForAdmin(response.data.promotion)
}

export async function deletePromotion(promotionId) {
  const response = await api.delete(`/promotions/${promotionId}`)

  return response.data.promotion
    ? normalizePromotionForAdmin(response.data.promotion)
    : null
}

export async function updatePromotionStatus(promotionId, statusClass) {
  const response = await api.patch(`/promotions/${promotionId}`, {
    status: mapPromotionStatusToApi(statusClass),
  })

  return normalizePromotionForAdmin(response.data.promotion)
}

export async function uploadAdminImages(files, scope) {
  const selectedFiles = Array.isArray(files) ? files : [files]
  const formData = new FormData()

  selectedFiles
    .filter(Boolean)
    .forEach((file) => {
      formData.append('images', file)
    })

  const response = await api.post(
    `/admin/uploads/images/${scope}`,
    formData,
  )

  return (response.data.images || []).map((image) => ({
    ...image,
    image_url: resolveMediaUrl(image.image_url || image.url),
  }))
}

export function normalizeAdminProfile(user) {
  if (!user) {
    return emptyAdminProfile
  }

  const firstName =
    user.firstName ?? user.first_name ?? ''
  const lastName =
    user.lastName ?? user.last_name ?? ''
  const fullName =
    `${firstName || ''} ${lastName || ''}`.trim() ||
    user.email ||
    emptyAdminProfile.fullName
  const city =
    user.city || ''
  const country =
    user.country || ''

  return {
    id: user.id,
    firstName,
    lastName,
    fullName,
    initials: getInitials(fullName),
    role: user.role === 'admin' ? 'Administrateur' : user.role || '',
    email: user.email || '',
    phone: user.phone || '',
    location: [city, country].filter(Boolean).join(', '),
    city,
    country,
    memberSince: user.createdAt || user.created_at
      ? formatAdminDate(user.createdAt || user.created_at)
      : '',
    address: [city, country].filter(Boolean).join('\n'),
    avatarUrl: resolveMediaUrl(user.avatarUrl || user.avatar_url || ''),
    raw: user,
  }
}

export function getAdminProfile(user) {
  if (user) {
    return normalizeAdminProfile(user)
  }

  try {
    const storedUser = JSON.parse(
      localStorage.getItem('nova_user') || 'null',
    )

    return normalizeAdminProfile(storedUser)
  } catch {
    return emptyAdminProfile
  }
}

export async function fetchAdminProfile() {
  const response = await api.get('/users/me')

  return normalizeAdminProfile(response.data.user)
}

export async function saveAdminProfile(profile) {
  const response = await api.put('/users/me', {
    first_name: profile.firstName,
    last_name: profile.lastName,
    email: profile.email,
    phone: profile.phone,
    city: profile.city,
    country: profile.country || 'Maroc',
    newsletter_opt_in:
      Boolean(profile.newsletterOptIn),
  })

  const nextProfile =
    normalizeAdminProfile(response.data.user)

  window.dispatchEvent(
    new CustomEvent(adminProfileChangedEvent, {
      detail: nextProfile,
    }),
  )

  return nextProfile
}

export async function uploadAdminAvatar(file) {
  const formData = new FormData()

  formData.append('avatar', file)

  const response = await api.post('/users/me/avatar', formData)

  const nextProfile =
    normalizeAdminProfile(response.data.user)

  window.dispatchEvent(
    new CustomEvent(adminProfileChangedEvent, {
      detail: nextProfile,
    }),
  )

  return nextProfile
}

export async function getAdminSettings() {
  const response = await api.get('/settings/admin')

  return response.data.settings
}

export async function saveAdminSettings(settings) {
  const response = await api.put('/settings/admin', settings)

  return response.data.settings
}

export async function resetAdminSettings() {
  const response = await api.post('/settings/admin/reset')

  return response.data.settings
}

export async function getAdminProfilePreferences() {
  const response = await api.get('/settings/admin/profile-preferences')

  return response.data.preferences
}

export async function saveAdminProfilePreferences(preferences) {
  const response = await api.put('/settings/admin/profile-preferences', {
    preferences,
  })

  return response.data.preferences
}

export async function getAdminAnalytics(range = 'current_month') {
  const response = await api.get('/analytics/admin', {
    params: {
      range,
    },
  })

  return {
    ...response.data,
    latestOrders: (response.data.latestOrders || []).map(normalizeOrderForAdmin),
  }
}

export async function searchAdmin(query) {
  const response = await api.get('/admin/search', {
    params: {
      q: query,
    },
  })

  return response.data.results || []
}

export async function getAdminNotifications() {
  const response = await api.get('/admin/notifications')

  return {
    notifications: response.data.notifications || [],
    unreadCount: Number(response.data.unreadCount || 0),
  }
}

export async function markAdminNotificationsRead(keys, all = false) {
  const response = await api.patch('/admin/notifications/read', {
    keys,
    all,
  })

  return {
    notifications: response.data.notifications || [],
    unreadCount: Number(response.data.unreadCount || 0),
  }
}

function normalizeMessageConversation(conversation) {
  if (!conversation) {
    return conversation
  }

  return {
    ...conversation,
    avatar: resolveMediaUrl(conversation.avatar || ''),
    tags: Array.isArray(conversation.tags) ? conversation.tags : [],
    messages: Array.isArray(conversation.messages)
      ? conversation.messages.map((message) => ({
          ...message,
          attachmentUrl: resolveMediaUrl(message.attachmentUrl || ''),
        }))
      : [],
  }
}

export async function getMessageConversations() {
  const response = await api.get('/messages/admin/conversations')

  return {
    conversations: (response.data.conversations || []).map(
      normalizeMessageConversation,
    ),
    stats: response.data.stats || {},
  }
}

export async function createMessageConversation(payload) {
  const response = await api.post('/messages/admin/conversations', payload)

  return normalizeMessageConversation(response.data.conversation)
}

export async function sendMessage(conversationId, body, attachmentUrl = null) {
  const response = await api.post(
    `/messages/admin/conversations/${conversationId}/messages`,
    {
      body,
      attachmentUrl,
    },
  )

  return normalizeMessageConversation(response.data.conversation)
}

export async function updateMessageConversation(conversationId, payload) {
  const response = await api.patch(
    `/messages/admin/conversations/${conversationId}`,
    payload,
  )

  return normalizeMessageConversation(response.data.conversation)
}

export function printInvoice(order) {
  const invoiceWindow = window.open('', '_blank', 'width=760,height=900')

  if (!invoiceWindow) {
    window.print()
    return
  }

  invoiceWindow.document.write(`
    <html>
      <head>
        <title>Facture ${order.id}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; color: #20231f; }
          h1 { margin: 0 0 8px; }
          .muted { color: #666; }
          table { width: 100%; border-collapse: collapse; margin-top: 24px; }
          th, td { padding: 12px; border-bottom: 1px solid #ddd; text-align: left; }
          .total { font-size: 20px; font-weight: 700; text-align: right; margin-top: 28px; }
        </style>
      </head>
      <body>
        <h1>NOVA - Facture ${order.id}</h1>
        <p class="muted">Client: ${order.customer}</p>
        <p class="muted">Date: ${order.date}</p>
        <table>
          <thead>
            <tr><th>Articles</th><th>Paiement</th><th>Statut</th><th>Montant</th></tr>
          </thead>
          <tbody>
            <tr>
              <td>${order.products}</td>
              <td>${order.payment}</td>
              <td>${order.status}</td>
              <td>${order.amount}</td>
            </tr>
          </tbody>
        </table>
        <p class="total">Total: ${order.amount}</p>
      </body>
    </html>
  `)
  invoiceWindow.document.close()
  invoiceWindow.focus()
  invoiceWindow.print()
}
