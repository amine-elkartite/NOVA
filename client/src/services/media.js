import api from './api'

const API_ORIGIN = (
  api.defaults.baseURL || ''
).replace(/\/api\/?$/, '')

export function resolveMediaUrl(value) {
  const url = String(value || '').trim()

  if (!url) {
    return ''
  }

  if (url.startsWith('/uploads/')) {
    return `${API_ORIGIN}${url}`
  }

  return url
}
