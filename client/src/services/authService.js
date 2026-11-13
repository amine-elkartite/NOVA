import api from './api'


/* =========================
   REGISTER
========================= */

export async function register(data) {
  const response = await api.post(
    '/auth/register',
    data,
  )

  return response.data
}


/* =========================
   LOGIN
========================= */

export async function login(data) {
  const response = await api.post(
    '/auth/login',
    data,
  )

  return response.data
}


/* =========================
   CURRENT USER
========================= */

export async function getMe() {
  const response = await api.get(
    '/auth/me',
    {
      timeout: 8000,
    },
  )

  return response.data
}


/* =========================
   FORGOT PASSWORD
========================= */

export async function forgotPassword(
  email,
) {
  const response = await api.post(
    '/auth/forgot-password',
    {
      email,
    },
  )

  return response.data
}


/* =========================
   RESET PASSWORD
========================= */

export async function resetPassword(
  token,
  password,
) {
  const response = await api.post(
    '/auth/reset-password',
    {
      token,
      password,
    },
  )

  return response.data
}


/* =========================
   CHANGE PASSWORD
========================= */

export async function changePassword(
  currentPassword,
  newPassword,
) {
  const response = await api.put(
    '/auth/change-password',
    {
      currentPassword,
      newPassword,
    },
  )

  return response.data
}


/* =========================
   2FA SETUP
========================= */

export async function setupTwoFactor() {
  const response = await api.post(
    '/auth/2fa/setup',
  )

  return response.data
}


/* =========================
   2FA ENABLE
========================= */

export async function enableTwoFactor(
  code,
) {
  const response = await api.post(
    '/auth/2fa/enable',
    {
      code,
    },
  )

  return response.data
}


/* =========================
   2FA DISABLE
========================= */

export async function disableTwoFactor(
  currentPassword,
  code,
) {
  const response = await api.post(
    '/auth/2fa/disable',
    {
      currentPassword,
      code,
    },
  )

  return response.data
}


/* =========================
   VERIFY LOGIN 2FA
========================= */

export async function verifyLoginTwoFactor(
  challengeToken,
  code,
) {
  const response = await api.post(
    '/auth/2fa/login/verify',
    {
      challengeToken,
      code,
    },
  )

  return response.data
}


/* =========================
   GET CONNECTED DEVICES
========================= */

export async function getSessions() {
  const response = await api.get(
    '/auth/sessions',
  )

  return response.data
}


/* =========================
   DISCONNECT OTHER DEVICES
========================= */

export async function revokeOtherSessions() {
  const response = await api.delete(
    '/auth/sessions/others',
  )

  return response.data
}


/* =========================
   DISCONNECT ONE DEVICE
========================= */

export async function revokeSession(
  sessionId,
) {
  if (!sessionId) {
    throw new Error(
      'Session ID is required.',
    )
  }

  const response = await api.delete(
    `/auth/sessions/${encodeURIComponent(
      sessionId,
    )}`,
  )

  return response.data
}


/* =========================
   LOGOUT CURRENT SESSION
========================= */

export async function logout() {
  const response = await api.post(
    '/auth/logout',
  )

  return response.data
}
