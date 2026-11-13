import api from './api'

const reviewService = {
  async getProductReviews(productId) {
    const response = await api.get(`/reviews/product/${productId}`)
    return response.data
  },

  async getMyProductReview(productId) {
    const response = await api.get(`/reviews/product/${productId}/me`)
    return response.data
  },

  async createReview(data) {
    const response = await api.post('/reviews', data)
    return response.data
  },
}

export default reviewService