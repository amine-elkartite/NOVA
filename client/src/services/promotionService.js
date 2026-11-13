import api from './api'

const promotionService = {
  async getPromotions() {
    const response = await api.get('/promotions')
    return response.data
  },

  async validatePromotion(data) {
    const response = await api.post(
      '/promotions/validate',
      data,
    )

    return response.data
  },
}

export default promotionService