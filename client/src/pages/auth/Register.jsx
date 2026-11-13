import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, LockKeyhole, Mail, Phone, UserRound } from 'lucide-react'
import useAuth from '../../hooks/useAuth.js'

const emptyForm = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  terms: false,
  newsletter: false,
}

function Register() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState(emptyForm)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { register, isAuthenticated, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate('/mon-compte', { replace: true })
    }
  }, [isAuthenticated, loading, navigate])

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target

    setFormData((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const validateForm = () => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      return 'Veuillez saisir votre prénom et votre nom.'
    }

    if (!formData.email.trim()) {
      return 'Veuillez saisir votre adresse e-mail.'
    }

    if (formData.password.length < 8) {
      return 'Le mot de passe doit contenir au moins 8 caractères.'
    }

    if (formData.password !== formData.confirmPassword) {
      return 'Les mots de passe ne correspondent pas.'
    }

    if (!formData.terms) {
      return 'Veuillez accepter les conditions générales.'
    }

    return ''
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const validationError = validateForm()
    setError(validationError)

    if (validationError) {
      return
    }

    try {
      setSubmitting(true)
      await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
      })
      navigate('/mon-compte', { replace: true })
    } catch (requestError) {
      setError(requestError.message || 'Création de compte impossible pour le moment.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-hero">
        <div className="nova-container">
          <h1>Créer un compte</h1>
          <p>Rejoignez NOVA et profitez d'une expérience personnalisée.</p>
        </div>
      </section>

      <div className="nova-container">
        <nav className="auth-breadcrumb">
          <Link to="/">Accueil</Link>
          <span>/</span>
          <span>Inscription</span>
        </nav>

        <section className="auth-layout">
          <div className="auth-card">
            <div className="auth-card-heading">
              <h2>Créez votre compte</h2>
              <p>Enregistrez vos favoris, suivez vos commandes et gérez facilement vos informations.</p>
            </div>

            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="auth-register-grid">
                <label className="auth-field">
                  <span>Prénom</span>
                  <div className="auth-input-wrap">
                    <UserRound size={18} strokeWidth={1.5} />
                    <input
                      type="text"
                      name="firstName"
                      placeholder="Votre prénom"
                      value={formData.firstName}
                      onChange={handleChange}
                      autoComplete="given-name"
                      required
                    />
                  </div>
                </label>

                <label className="auth-field">
                  <span>Nom</span>
                  <div className="auth-input-wrap">
                    <UserRound size={18} strokeWidth={1.5} />
                    <input
                      type="text"
                      name="lastName"
                      placeholder="Votre nom"
                      value={formData.lastName}
                      onChange={handleChange}
                      autoComplete="family-name"
                      required
                    />
                  </div>
                </label>
              </div>

              <label className="auth-field">
                <span>Adresse e-mail</span>
                <div className="auth-input-wrap">
                  <Mail size={18} strokeWidth={1.5} />
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
                <span>Téléphone</span>
                <div className="auth-input-wrap">
                  <Phone size={18} strokeWidth={1.5} />
                  <input
                    type="tel"
                    name="phone"
                    placeholder="+212 6 00 00 00 00"
                    value={formData.phone}
                    onChange={handleChange}
                    autoComplete="tel"
                  />
                </div>
              </label>

              <label className="auth-field">
                <span>Mot de passe</span>
                <div className="auth-input-wrap">
                  <LockKeyhole size={18} strokeWidth={1.5} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="Créez un mot de passe"
                    value={formData.password}
                    onChange={handleChange}
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
                    name="confirmPassword"
                    placeholder="Confirmez votre mot de passe"
                    value={formData.confirmPassword}
                    onChange={handleChange}
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

              <label className="auth-terms">
                <input
                  type="checkbox"
                  name="terms"
                  checked={formData.terms}
                  onChange={handleChange}
                  required
                />
                <span>J'accepte les conditions générales et la politique de confidentialité.</span>
              </label>

              <label className="auth-terms auth-newsletter">
                <input
                  type="checkbox"
                  name="newsletter"
                  checked={formData.newsletter}
                  onChange={handleChange}
                />
                <span>Je souhaite recevoir les nouveautés et offres NOVA.</span>
              </label>

              {error ? <p className="auth-error" role="alert">{error}</p> : null}

              <button type="submit" className="auth-submit-button" disabled={submitting}>
                {submitting ? 'Création...' : 'Créer mon compte'}
              </button>
            </form>

            <div className="auth-separator">
              <span>ou</span>
            </div>

            <div className="auth-register-message">
              <span>Vous avez déjà un compte ?</span>
              <Link to="/connexion">Se connecter</Link>
            </div>
          </div>

          <aside className="auth-side-card">
            <span className="auth-side-small">Bienvenue chez NOVA</span>
            <h2>
              Une expérience
              <br />
              pensée pour vous.
            </h2>
            <p>
              Gardez vos articles préférés, gérez vos adresses et retrouvez toutes vos commandes depuis
              un seul espace.
            </p>
            <Link to="/nouveautes">Découvrir la collection</Link>
          </aside>
        </section>
      </div>
    </main>
  )
}

export default Register
