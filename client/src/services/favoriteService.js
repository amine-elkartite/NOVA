import api from './api'

const favoriteService = {
  async getFavorites() {
    const response = await api.get('/favorites')
    return response.data
  },

  async addFavorite(productId) {
    const response = await api.post(`/favorites/${productId}`)
    return response.data
  },

  async removeFavorite(productId) {
    const response = await api.delete(`/favorites/${productId}`)
    return response.data
  },
}

export default favoriteService