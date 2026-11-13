import api from './api'

const orderService = {
  async getOrders() {
    const response = await api.get('/orders')
    return response.data
  },

  async getOrderById(orderId) {
    const response = await api.get(`/orders/${orderId}`)
    return response.data
  },

  async createOrder(orderData) {
    const response = await api.post('/orders', orderData)
    return response.data
  },

  async getInvoice(orderId) {
    const response = await api.get(
      `/orders/${orderId}/invoice`,
      {
        responseType: 'blob',
      },
    )

    return response.data
  },
}

export default orderService