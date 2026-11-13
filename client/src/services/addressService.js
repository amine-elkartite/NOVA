import api from './api'

export async function getAddresses() {
  const response = await api.get('/addresses')
  return response.data
}

export async function createAddress(payload) {
  const response = await api.post('/addresses', payload)
  return response.data
}

export async function updateAddress(id, payload) {
  const response = await api.put(`/addresses/${id}`, payload)
  return response.data
}

export async function deleteAddress(id) {
  const response = await api.delete(`/addresses/${id}`)
  return response.data
}

export async function setDefaultAddress(id) {
  const response = await api.put(`/addresses/${id}/default`)
  return response.data
}