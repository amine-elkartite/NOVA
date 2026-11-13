import api from './api'

export async function getStorefrontSettings() {
  const response = await api.get('/settings/storefront')

  return response.data.storefront
}
