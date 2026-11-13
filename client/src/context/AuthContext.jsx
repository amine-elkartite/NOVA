import {
  createContext,
  useEffect,
  useState,
} from 'react'

import * as authService from '../services/authService.js'


const AuthContext =
  createContext(null)


function persistAuth({
  user,
  token,
}) {
  localStorage.setItem(
    'nova_user',
    JSON.stringify(user),
  )

  localStorage.setItem(
    'nova_token',
    token,
  )
}


function clearPersistedAuth() {
  localStorage.removeItem(
    'nova_user',
  )

  localStorage.removeItem(
    'nova_token',
  )
}


function AuthProvider({
  children,
}) {
  const [
    user,
    setUser,
  ] = useState(null)

  const [
    loading,
    setLoading,
  ] = useState(true)


  /* =========================
     INITIALIZE AUTH
  ========================= */

  useEffect(() => {
    const savedToken =
      localStorage.getItem(
        'nova_token',
      )

    async function initializeAuth() {
      if (!savedToken) {
        setLoading(false)
        return
      }

      try {
        const data =
          await authService.getMe()

        setUser(
          data.user,
        )

        localStorage.setItem(
          'nova_user',
          JSON.stringify(
            data.user,
          ),
        )
      } catch {
        clearPersistedAuth()

        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()
  }, [])


  /* =========================
     HANDLE INVALID SESSION
  ========================= */

  useEffect(() => {
    const handleUnauthorized =
      () => {
        clearPersistedAuth()

        setUser(null)
      }

    window.addEventListener(
      'nova:unauthorized',
      handleUnauthorized,
    )

    return () => {
      window.removeEventListener(
        'nova:unauthorized',
        handleUnauthorized,
      )
    }
  }, [])


  /* =========================
     LOGIN
  ========================= */

  const login =
    async (
      credentials,
    ) => {
      const data =
        await authService.login(
          credentials,
        )

      if (
        data?.requiresTwoFactor
      ) {
        return {
          requiresTwoFactor:
            true,

          challengeToken:
            data.challengeToken,

          message:
            data.message ||
            'Un code de vérification est requis.',
        }
      }

      persistAuth(data)

      setUser(
        data.user,
      )

      return {
        requiresTwoFactor:
          false,

        user:
          data.user,
      }
    }


  /* =========================
     COMPLETE 2FA LOGIN
  ========================= */

  const completeTwoFactorLogin =
    async (
      challengeToken,
      code,
    ) => {
      const data =
        await authService
          .verifyLoginTwoFactor(
            challengeToken,
            code,
          )

      persistAuth(data)

      setUser(
        data.user,
      )

      return data.user
    }


  /* =========================
     REGISTER
  ========================= */

  const register =
    async (
      payload,
    ) => {
      const data =
        await authService.register(
          payload,
        )

      persistAuth(data)

      setUser(
        data.user,
      )

      return data.user
    }


  /* =========================
     UPDATE USER
  ========================= */

  const updateUser = (
    updatedUser,
  ) => {
    setUser(
      updatedUser,
    )

    localStorage.setItem(
      'nova_user',
      JSON.stringify(
        updatedUser,
      ),
    )
  }


  /* =========================
     LOGOUT
  ========================= */

  const logout =
    async () => {
      const hasToken =
        Boolean(
          localStorage.getItem(
            'nova_token',
          ),
        )

      try {
        if (hasToken) {
          await authService.logout()
        }
      } catch (error) {
        /*
         * Même si le backend est
         * indisponible, expiré ou
         * si la session a déjà été
         * révoquée, le logout local
         * doit toujours fonctionner.
         */
        console.warn(
          'Impossible de révoquer la session côté serveur :',
          error?.message ||
            error,
        )
      } finally {
        clearPersistedAuth()

        setUser(null)
      }
    }


  /* =========================
     CONTEXT VALUE
  ========================= */

  const value = {
    user,

    loading,

    isAuthenticated:
      Boolean(user),

    login,

    completeTwoFactorLogin,

    register,

    updateUser,

    logout,
  }


  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  )
}


export {
  AuthContext,
  AuthProvider,
}