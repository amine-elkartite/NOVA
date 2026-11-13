import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CheckCircle2, Eye, EyeOff, LockKeyhole } from 'lucide-react'
import { resetPassword } from '../../services/authService'

function ResetPassword() {
  const { token = '' } = useParams()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!token) {
      setError('Le lien de réinitialisation est manquant.')
      return
    }

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }

    try {
      setSubmitting(true)
      await resetPassword(token, password)
      setSuccess(true)
    } catch (requestError) {
      setError(requestError.message || 'Réinitialisation impossible pour le moment.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-hero">
        <div className="nova-container">
          <h1>Nouveau mot de passe</h1>
          <p>Choisissez un nouveau mot de passe pour votre compte.</p>
        </div>
      </section>

      <div className="nova-container">
        <nav className="auth-breadcrumb">
          <Link to="/">Accueil</Link>
          <span>/</span>
          <Link to="/connexion">Connexion</Link>
          <span>/</span>
          <span>Nouveau mot de passe</span>
        </nav>

        <section className="auth-layout">
          <div className="auth-card">
            {!success ? (
              <>
                <div className="auth-card-heading">
                  <h2>Créer un nouveau mot de passe</h2>
                  <p>Votre nouveau mot de passe doit contenir au moins 8 caractères.</p>
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
                  <label className="auth-field">
                    <span>Nouveau mot de passe</span>
                    <div className="auth-input-wrap">
                      <LockKeyhole size={18} strokeWidth={1.5} />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Votre nouveau mot de passe"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        autoComplete="new-password"
                        required
                      />
                      <button
                        type="button"
                        className="auth-password-toggle"
                        onClick={() => setShowPassword((current) => !current)}
                        aria-label="Afficher ou masquer le mot de passe"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </label>

                  <label className="auth-field">
                    <span>Confirmer le mot de passe</span>
                    <div className="auth-input-wrap">
                      <LockKeyhole size={18} strokeWidth={1.5} />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirmez votre mot de passe"
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        autoComplete="new-password"
                        required
                      />
                      <button
                        type="button"
                        className="auth-password-toggle"
                        onClick={() => setShowConfirmPassword((current) => !current)}
                        aria-label="Afficher ou masquer la confirmation"
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </label>

                  {error ? <div className="reset-password-error">{error}</div> : null}

                  <div className="reset-password-rules">
                    <span>Votre mot de passe doit contenir :</span>
                    <ul>
                      <li>Au moins 8 caractères</li>
                      <li>Une combinaison sécurisée</li>
                      <li>Un mot de passe différent de l'ancien</li>
                    </ul>
                  </div>

                  <button type="submit" className="auth-submit-button" disabled={submitting}>
                    {submitting ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
                  </button>
                </form>
              </>
            ) : (
              <div className="reset-password-success">
                <div className="reset-password-success-icon">
                  <CheckCircle2 size={28} strokeWidth={1.5} />
                </div>

                <h2>Mot de passe modifié</h2>
                <p>
                  Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous
                  connecter à votre compte NOVA.
                </p>

                <Link to="/connexion" className="reset-password-login">
                  Se connecter
                </Link>
              </div>
            )}
          </div>

          <aside className="auth-side-card">
            <span className="auth-side-small">Sécurité NOVA</span>
            <h2>
              Votre compte,
              <br />
              en toute sécurité.
            </h2>
            <p>Choisissez un mot de passe unique que vous n'utilisez pas sur d'autres sites.</p>
            <Link to="/">Retour à l'accueil</Link>
          </aside>
        </section>
      </div>
    </main>
  )
}

export default ResetPassword
