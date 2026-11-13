import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Mail } from 'lucide-react'
import { forgotPassword } from '../../services/authService'

function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!email.trim()) {
      setError('Veuillez saisir votre adresse e-mail.')
      return
    }

    try {
      setSubmitting(true)
      await forgotPassword(email)
      setSubmitted(true)
    } catch (requestError) {
      setError(requestError.message || 'Demande impossible pour le moment.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-hero">
        <div className="nova-container">
          <h1>Mot de passe oublié</h1>
          <p>Réinitialisez l’accès à votre compte NOVA.</p>
        </div>
      </section>

      <div className="nova-container">
        <nav className="auth-breadcrumb">
          <Link to="/">Accueil</Link>
          <span>/</span>
          <Link to="/connexion">Connexion</Link>
          <span>/</span>
          <span>Mot de passe oublié</span>
        </nav>

        <section className="auth-layout auth-single-layout">
          <div className="auth-card">
            {!submitted ? (
              <>
                <div className="auth-card-heading">
                  <h2>Réinitialiser votre mot de passe</h2>
                  <p>
                    Saisissez l'adresse e-mail associée à votre compte. Si un compte existe, un lien
                    de réinitialisation sera envoyé.
                  </p>
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
                  <label className="auth-field">
                    <span>Adresse e-mail</span>
                    <div className="auth-input-wrap">
                      <Mail size={18} strokeWidth={1.5} />
                      <input
                        type="email"
                        placeholder="Votre adresse e-mail"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        autoComplete="email"
                        required
                      />
                    </div>
                  </label>

                  {error ? <p className="auth-error" role="alert">{error}</p> : null}

                  <button type="submit" className="auth-submit-button" disabled={submitting}>
                    {submitting ? 'Envoi...' : 'Envoyer le lien de réinitialisation'}
                  </button>
                </form>
              </>
            ) : (
              <div className="forgot-success">
                <div className="forgot-success-icon">
                  <Mail size={25} strokeWidth={1.5} />
                </div>

                <h2>Consultez votre boîte e-mail</h2>
                <p>
                  Si un compte est associé à <strong>{email}</strong>, la demande de
                  réinitialisation a été prise en compte.
                </p>

                <button
                  type="button"
                  className="forgot-resend-button"
                  onClick={() => setSubmitted(false)}
                >
                  Renvoyer le lien
                </button>
              </div>
            )}

            <Link to="/connexion" className="forgot-back-login">
              <ArrowLeft size={15} />
              Retour à la connexion
            </Link>
          </div>

          <aside className="auth-side-card">
            <span className="auth-side-small">Votre compte NOVA</span>
            <h2>
              Retrouvez votre
              <br />
              espace personnel.
            </h2>
            <p>
              Une fois reconnecté, vous pourrez retrouver vos favoris, suivre vos commandes et gérer
              vos informations personnelles.
            </p>
            <Link to="/nouveautes">Découvrir la collection</Link>
          </aside>
        </section>
      </div>
    </main>
  )
}

export default ForgotPassword
