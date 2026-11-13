import api from './api'
import { resolveMediaUrl } from './media'

function normalizeProduct(product) {
  if (!product) {
    return product
  }

  return {
    ...product,
    image_url:
      resolveMediaUrl(product.image_url),
    images: Array.isArray(product.images)
      ? product.images.map((image) => ({
          ...image,
          image_url: resolveMediaUrl(
            image.image_url || image.url || image.src,
          ),
        }))
      : product.images,
  }
}

function normalizeProductsResponse(data) {
  return {
    ...data,
    products: Array.isArray(data?.products)
      ? data.products.map(normalizeProduct)
      : [],
  }
}

const productService = {
  async getProducts(params = {}) {
    const response = await api.get('/products', {
      params,
    })

    return normalizeProductsResponse(response.data)
  },

  async getProductBySlug(slug) {
    const response = await api.get(`/products/${slug}`)

    return {
      ...response.data,
      product: normalizeProduct(response.data?.product),
    }
  },
}

export default productService
