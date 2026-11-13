import api from './api'

const paymentService = {
  async createCardSession(checkoutData) {
    const response = await api.post(
      '/payments/card/session',
      checkoutData,
    )

    return response.data
  },
}

export default paymentService
