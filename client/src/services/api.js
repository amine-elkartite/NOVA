import axios from 'axios'


const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    'http://localhost:5000/api',
})


/* =========================
   AUTH STORAGE HELPERS
========================= */

function clearStoredAuth() {
  localStorage.removeItem(
    'nova_user',
  )

  localStorage.removeItem(
    'nova_token',
  )
}


/* =========================
   PUBLIC AUTH ENDPOINTS
========================= */

function isPublicAuthRequest(config) {
  const url =
    String(
      config?.url || '',
    )

  const publicAuthPaths = [
    '/auth/login',
    '/auth/register',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/auth/2fa/login/verify',
  ]

  return publicAuthPaths.some(
    (path) =>
      url === path ||
      url.startsWith(
        `${path}/`,
      ),
  )
}


/* =========================
   REQUEST INTERCEPTOR
========================= */

api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem(
        'nova_token',
      )

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`
    }

    const isFormData =
      config.data instanceof FormData

    if (isFormData) {
      delete config.headers[
        'Content-Type'
      ]
    } else if (
      !config.headers[
        'Content-Type'
      ]
    ) {
      config.headers[
        'Content-Type'
      ] =
        'application/json'
    }

    return config
  },
)


/* =========================
   RESPONSE INTERCEPTOR
========================= */

api.interceptors.response.use(
  (response) => response,

  (error) => {
    const status =
      error.response?.status

    const data =
      error.response?.data || {}

    const message =
      data.message ||
      error.message ||
      'Une erreur est survenue.'


    /*
     * Si une requête protégée reçoit 401,
     * le token/session n'est plus valide.
     *
     * On ne nettoie PAS l'auth pour les
     * endpoints publics de connexion,
     * sinon un mauvais mot de passe ou
     * un mauvais code 2FA pourrait
     * provoquer un faux logout.
     */
    if (
      status === 401 &&
      !isPublicAuthRequest(
        error.config,
      )
    ) {
      clearStoredAuth()

      window.dispatchEvent(
        new CustomEvent(
          'nova:unauthorized',
          {
            detail: {
              message,
            },
          },
        ),
      )
    }


    return Promise.reject(
      Object.assign(
        new Error(message),
        {
          status,

          code:
            data.code,

          errors:
            data.errors || [],

          data,
        },
      ),
    )
  },
)


export default api