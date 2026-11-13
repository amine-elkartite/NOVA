import {
  useEffect,
  useState,
} from 'react'

import {
  Link,
  useLocation,
  useNavigate,
} from 'react-router-dom'

import {
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  Mail,
} from 'lucide-react'

import useAuth from '../../hooks/useAuth.js'

function Login() {
  const [
    showPassword,
    setShowPassword,
  ] = useState(false)

  const [
    formData,
    setFormData,
  ] = useState({
    email: '',
    password: '',
    remember: false,
  })

  const [
    twoFactorRequired,
    setTwoFactorRequired,
  ] = useState(false)

  const [
    challengeToken,
    setChallengeToken,
  ] = useState('')

  const [
    twoFactorCode,
    setTwoFactorCode,
  ] = useState('')

  const [
    error,
    setError,
  ] = useState('')

  const [
    submitting,
    setSubmitting,
  ] = useState(false)

  const {
    login,
    completeTwoFactorLogin,
    isAuthenticated,
    loading,
  } = useAuth()

  const navigate = useNavigate()
  const location = useLocation()

  const redirectTo =
    location.state?.from?.pathname ||
    '/mon-compte'

  useEffect(() => {
    if (
      !loading &&
      isAuthenticated
    ) {
      navigate(
        '/mon-compte',
        {
          replace: true,
        },
      )
    }
  }, [
    isAuthenticated,
    loading,
    navigate,
  ])

  const handleChange = (event) => {
    const {
      name,
      value,
      checked,
      type,
    } = event.target

    setFormData(
      (current) => ({
        ...current,
        [name]:
          type === 'checkbox'
            ? checked
            : value,
      }),
    )

    setError('')
  }

  const handleSubmit =
    async (event) => {
      event.preventDefault()

      setError('')

      if (
        !formData.email.trim() ||
        !formData.password
      ) {
        setError(
          'Veuillez saisir votre adresse e-mail et votre mot de passe.',
        )

        return
      }

      try {
        setSubmitting(true)

        const result =
          await login({
            email:
              formData.email.trim(),
            password:
              formData.password,
          })

        if (
          result?.requiresTwoFactor
        ) {
          if (
            !result.challengeToken
          ) {
            setError(
              'La vérification en deux étapes n’a pas pu être démarrée.',
            )

            return
          }

          setChallengeToken(
            result.challengeToken,
          )

          setTwoFactorRequired(true)
          setTwoFactorCode('')

          return
        }

        navigate(
          redirectTo,
          {
            replace: true,
          },
        )
      } catch (requestError) {
        setError(
          requestError?.message ||
            'Connexion impossible pour le moment.',
        )
      } finally {
        setSubmitting(false)
      }
    }

  const handleTwoFactorSubmit =
    async (event) => {
      event.preventDefault()

      setError('')

      const cleanCode =
        twoFactorCode.trim()

      if (
        !/^\d{6}$/.test(
          cleanCode,
        )
      ) {
        setError(
          'Saisissez le code à 6 chiffres affiché dans votre application Authenticator.',
        )

        return
      }

      if (!challengeToken) {
        setError(
          'La session de vérification a expiré. Reconnectez-vous.',
        )

        setTwoFactorRequired(false)
        setTwoFactorCode('')

        return
      }

      try {
        setSubmitting(true)

        await completeTwoFactorLogin(
          challengeToken,
          cleanCode,
        )

        navigate(
          redirectTo,
          {
            replace: true,
          },
        )
      } catch (requestError) {
        setError(
          requestError?.message ||
            'Le code de vérification est incorrect.',
        )
      } finally {
        setSubmitting(false)
      }
    }

  const handleBackToLogin = () => {
    if (submitting) {
      return
    }

    setTwoFactorRequired(false)
    setChallengeToken('')
    setTwoFactorCode('')
    setError('')
  }

  return (
    <main className="auth-page">

      <section className="auth-hero">

        <div className="nova-container">

          <h1>
            Connexion
          </h1>

          <p>
            Accédez à votre compte NOVA.
          </p>

        </div>

      </section>


      <div className="nova-container">

        <nav className="auth-breadcrumb">

          <Link to="/">
            Accueil
          </Link>

          <span>/</span>

          <span>
            Connexion
          </span>

        </nav>


        <section className="auth-layout">

          <div className="auth-card">

            {!twoFactorRequired ? (
              <>
                <div className="auth-card-heading">

                  <h2>
                    Ravi de vous revoir
                  </h2>

                  <p>
                    Connectez-vous pour retrouver vos commandes,
                    favoris et adresses.
                  </p>

                </div>


                <form
                  className="auth-form"
                  onSubmit={handleSubmit}
                >

                  <label className="auth-field">

                    <span>
                      Adresse e-mail
                    </span>

                    <div className="auth-input-wrap">

                      <Mail
                        size={18}
                        strokeWidth={1.5}
                      />

                      <input
                        type="email"
                        name="email"
                        placeholder="Votre adresse e-mail"
                        value={formData.email}
                        onChange={handleChange}
                        autoComplete="email"
                        required
                      />

                    </div>

                  </label>


                  <label className="auth-field">

                    <span>
                      Mot de passe
                    </span>

                    <div className="auth-input-wrap">

                      <LockKeyhole
                        size={18}
                        strokeWidth={1.5}
                      />

                      <input
                        type={
                          showPassword
                            ? 'text'
                            : 'password'
                        }
                        name="password"
                        placeholder="Votre mot de passe"
                        value={formData.password}
                        onChange={handleChange}
                        autoComplete="current-password"
                        required
                      />

                      <button
                        type="button"
                        className="auth-password-toggle"
                        onClick={() =>
                          setShowPassword(
                            (current) =>
                              !current,
                          )
                        }
                        aria-label="Afficher ou masquer le mot de passe"
                      >
                        {showPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>

                    </div>

                  </label>


                  <div className="auth-options">

                    <label className="auth-remember">

                      <input
                        type="checkbox"
                        name="remember"
                        checked={
                          formData.remember
                        }
                        onChange={
                          handleChange
                        }
                      />

                      <span>
                        Se souvenir de moi
                      </span>

                    </label>


                    <Link to="/mot-de-passe-oublie">
                      Mot de passe oublié ?
                    </Link>

                  </div>


                  {error ? (
                    <p
                      className="auth-error"
                      role="alert"
                    >
                      {error}
                    </p>
                  ) : null}


                  <button
                    type="submit"
                    className="auth-submit-button"
                    disabled={submitting}
                  >
                    {submitting
                      ? 'Connexion...'
                      : 'Se connecter'}
                  </button>

                </form>


                <div className="auth-separator">
                  <span>
                    ou
                  </span>
                </div>


                <div className="auth-register-message">

                  <span>
                    Vous n&apos;avez pas encore de compte ?
                  </span>

                  <Link to="/inscription">
                    Créer un compte
                  </Link>

                </div>
              </>
            ) : (
              <>
                <div className="auth-card-heading">

                  <h2>
                    Vérification en deux étapes
                  </h2>

                  <p>
                    Ouvrez votre application Authenticator
                    et saisissez le code actuel à 6 chiffres.
                  </p>

                </div>


                <form
                  className="auth-form"
                  onSubmit={
                    handleTwoFactorSubmit
                  }
                >

                  <label className="auth-field">

                    <span>
                      Code de vérification
                    </span>

                    <div className="auth-input-wrap">

                      <KeyRound
                        size={18}
                        strokeWidth={1.5}
                      />

                      <input
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        placeholder="000000"
                        maxLength={6}
                        value={
                          twoFactorCode
                        }
                        onChange={(
                          event,
                        ) => {
                          setTwoFactorCode(
                            event.target.value
                              .replace(
                                /\D/g,
                                '',
                              )
                              .slice(
                                0,
                                6,
                              ),
                          )

                          setError('')
                        }}
                        autoFocus
                        required
                      />

                    </div>

                  </label>


                  {error ? (
                    <p
                      className="auth-error"
                      role="alert"
                    >
                      {error}
                    </p>
                  ) : null}


                  <button
                    type="submit"
                    className="auth-submit-button"
                    disabled={
                      submitting
                    }
                  >
                    {submitting
                      ? 'Vérification...'
                      : 'Vérifier et se connecter'}
                  </button>


                  <button
                    type="button"
                    className="security-outline-button"
                    onClick={
                      handleBackToLogin
                    }
                    disabled={
                      submitting
                    }
                  >
                    Retour à la connexion
                  </button>

                </form>
              </>
            )}

          </div>


          <aside className="auth-side-card">

            <span className="auth-side-small">
              L’univers NOVA
            </span>

            <h2>
              Votre style,
              <br />
              votre espace.
            </h2>

            <p>
              Créez votre compte pour enregistrer vos favoris,
              suivre vos commandes et profiter d&apos;une
              expérience personnalisée.
            </p>

            <Link to="/nouveautes">
              Découvrir la collection
            </Link>

          </aside>

        </section>

      </div>

    </main>
  )
}

export default Login