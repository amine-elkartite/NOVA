import { Link } from 'react-router-dom'
import {
  useEffect,
  useRef,
  useState,
} from 'react'
import {
  LockKeyhole,
  Mail,
  Trash2,
} from 'lucide-react'

import AccountSidebar from '../../components/layout/AccountSidebar.jsx'
import useAuth from '../../hooks/useAuth.js'
import api from '../../services/api.js'


const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  'http://localhost:5000/api'

const SERVER_BASE_URL =
  API_BASE_URL.replace(
    /\/api\/?$/,
    '',
  )


function normalizeUser(user) {
  if (!user) {
    return null
  }

  return {
    id: user.id,

    firstName:
      user.firstName ??
      user.first_name ??
      '',

    lastName:
      user.lastName ??
      user.last_name ??
      '',

    email:
      user.email ?? '',

    phone:
      user.phone ?? '',

    city:
      user.city ?? '',

    country:
      user.country ??
      'Maroc',

    avatarUrl:
      user.avatarUrl ??
      user.avatar_url ??
      null,

    newsletterOptIn:
      Boolean(
        user.newsletterOptIn ??
        user.newsletter_opt_in ??
        false,
      ),

    role:
      user.role,

    isActive:
      user.isActive ??
      Boolean(user.is_active),

    createdAt:
      user.createdAt ??
      user.created_at,

    updatedAt:
      user.updatedAt ??
      user.updated_at,
  }
}


function getAvatarSource(avatarUrl) {
  if (!avatarUrl) {
    return ''
  }

  if (
    avatarUrl.startsWith(
      'http://',
    ) ||
    avatarUrl.startsWith(
      'https://',
    )
  ) {
    return avatarUrl
  }

  const normalizedPath =
    avatarUrl.startsWith('/')
      ? avatarUrl
      : `/${avatarUrl}`

  return `${SERVER_BASE_URL}${normalizedPath}`
}


function Profile() {
  const {
    user,
    updateUser,
  } = useAuth()

  const [formData, setFormData] =
    useState({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      city: '',
      country: 'Maroc',
      newsletter_opt_in: false,
    })

  const [
    avatarUrl,
    setAvatarUrl,
  ] = useState(null)

  const [
    message,
    setMessage,
  ] = useState('')

  const [
    messageType,
    setMessageType,
  ] = useState('')

  const [
    saving,
    setSaving,
  ] = useState(false)

  const [
    uploadingAvatar,
    setUploadingAvatar,
  ] = useState(false)

  const [
    deletingAvatar,
    setDeletingAvatar,
  ] = useState(false)

  const formRef =
    useRef(null)

  const fileInputRef =
    useRef(null)


  useEffect(() => {
    if (!user) {
      return
    }

    const normalizedUser =
      normalizeUser(user)

    setFormData({
      first_name:
        normalizedUser.firstName,

      last_name:
        normalizedUser.lastName,

      email:
        normalizedUser.email,

      phone:
        normalizedUser.phone,

      city:
        normalizedUser.city,

      country:
        normalizedUser.country ||
        'Maroc',

      newsletter_opt_in:
        normalizedUser.newsletterOptIn,
    })

    setAvatarUrl(
      normalizedUser.avatarUrl,
    )
  }, [user])


  const initials = [
    formData.first_name?.[0],
    formData.last_name?.[0],
  ]
    .filter(Boolean)
    .join('')
    .toUpperCase() || 'NV'


  const avatarSource =
    getAvatarSource(
      avatarUrl,
    )


  const clearMessage = () => {
    setMessage('')
    setMessageType('')
  }


  const showSuccess = (
    text,
  ) => {
    setMessage(text)
    setMessageType('success')
  }


  const showError = (
    error,
    fallback,
  ) => {
    const apiMessage =
      error?.response?.data?.message

    setMessage(
      apiMessage ||
      error?.message ||
      fallback,
    )

    setMessageType('error')
  }


  const syncUser = (
    apiUser,
  ) => {
    const normalizedUser =
      normalizeUser(apiUser)

    if (!normalizedUser) {
      return
    }

    updateUser(
      normalizedUser,
    )

    setFormData({
      first_name:
        normalizedUser.firstName,

      last_name:
        normalizedUser.lastName,

      email:
        normalizedUser.email,

      phone:
        normalizedUser.phone,

      city:
        normalizedUser.city,

      country:
        normalizedUser.country ||
        'Maroc',

      newsletter_opt_in:
        normalizedUser.newsletterOptIn,
    })

    setAvatarUrl(
      normalizedUser.avatarUrl,
    )
  }


  const handleChange = (
    event,
  ) => {
    const {
      name,
      value,
      type,
      checked,
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

    clearMessage()
  }


  const handleSubmit = async (
    event,
  ) => {
    event.preventDefault()

    setSaving(true)
    clearMessage()

    try {
      const response =
        await api.put(
          '/users/me',
          {
            first_name:
              formData.first_name,

            last_name:
              formData.last_name,

            phone:
              formData.phone,

            city:
              formData.city,

            country:
              formData.country,

            newsletter_opt_in:
              formData.newsletter_opt_in,
          },
        )

      syncUser(
        response.data.user,
      )

      showSuccess(
        response.data.message ||
        'Profil mis à jour avec succès.',
      )
    } catch (error) {
      showError(
        error,
        'Impossible de mettre à jour le profil.',
      )
    } finally {
      setSaving(false)
    }
  }


  const handleCancel = () => {
    if (!user) {
      return
    }

    const normalizedUser =
      normalizeUser(user)

    setFormData({
      first_name:
        normalizedUser.firstName,

      last_name:
        normalizedUser.lastName,

      email:
        normalizedUser.email,

      phone:
        normalizedUser.phone,

      city:
        normalizedUser.city,

      country:
        normalizedUser.country ||
        'Maroc',

      newsletter_opt_in:
        normalizedUser.newsletterOptIn,
    })

    setAvatarUrl(
      normalizedUser.avatarUrl,
    )

    clearMessage()
  }


  const handlePhotoButtonClick =
    () => {
      if (
        uploadingAvatar ||
        deletingAvatar
      ) {
        return
      }

      clearMessage()

      fileInputRef.current?.click()
    }


  const handleAvatarChange =
    async (event) => {
      const file =
        event.target.files?.[0]

      event.target.value = ''

      if (!file) {
        return
      }

      const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/webp',
      ]

      if (
        !allowedTypes.includes(
          file.type,
        )
      ) {
        setMessage(
          'Format non autorisé. Utilisez une image JPG, PNG ou WebP.',
        )

        setMessageType(
          'error',
        )

        return
      }

      const maxFileSize =
        5 * 1024 * 1024

      if (
        file.size >
        maxFileSize
      ) {
        setMessage(
          'La photo ne doit pas dépasser 5 Mo.',
        )

        setMessageType(
          'error',
        )

        return
      }

      setUploadingAvatar(true)
      clearMessage()

      try {
        const uploadData =
          new FormData()

        uploadData.append(
          'avatar',
          file,
        )

        const response =
          await api.post(
            '/users/me/avatar',
            uploadData,
          )

        syncUser(
          response.data.user,
        )

        showSuccess(
          response.data.message ||
          'Photo de profil mise à jour avec succès.',
        )
      } catch (error) {
        showError(
          error,
          'Impossible de modifier la photo de profil.',
        )
      } finally {
        setUploadingAvatar(
          false,
        )
      }
    }


  const handleDeleteAvatar =
    async () => {
      if (
        !avatarUrl ||
        uploadingAvatar ||
        deletingAvatar
      ) {
        return
      }

      setDeletingAvatar(true)
      clearMessage()

      try {
        const response =
          await api.delete(
            '/users/me/avatar',
          )

        syncUser(
          response.data.user,
        )

        showSuccess(
          response.data.message ||
          'Photo de profil supprimée avec succès.',
        )
      } catch (error) {
        showError(
          error,
          'Impossible de supprimer la photo de profil.',
        )
      } finally {
        setDeletingAvatar(
          false,
        )
      }
    }


  return (
    <main className="profile-page">

      <section className="account-hero">
        <div className="nova-container">
          <h1>
            Mon profil
          </h1>

          <p>
            Gérez vos informations
            et retrouvez vos commandes.
          </p>
        </div>
      </section>


      <div className="nova-container">

        <nav className="account-breadcrumb">
          <Link to="/">
            Accueil
          </Link>

          <span>/</span>

          <span>
            Mon compte
          </span>
        </nav>


        <div className="account-layout">

          <AccountSidebar />


          <div className="profile-content">

            <section className="profile-main-card">

              <h2>
                Informations personnelles
              </h2>


              <div className="profile-top-row">

                <div className="profile-avatar-large">

                  {avatarSource ? (
                    <img
                      src={avatarSource}
                      alt={`Photo de ${formData.first_name || 'profil'}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: '50%',
                        display: 'block',
                      }}
                    />
                  ) : (
                    initials
                  )}

                </div>


                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={
                      handleAvatarChange
                    }
                    style={{
                      display: 'none',
                    }}
                  />


                  <button
                    type="button"
                    className="profile-photo-link"
                    onClick={
                      handlePhotoButtonClick
                    }
                    disabled={
                      uploadingAvatar ||
                      deletingAvatar
                    }
                  >
                    {uploadingAvatar
                      ? 'Envoi de la photo...'
                      : avatarUrl
                        ? 'Modifier la photo'
                        : 'Ajouter une photo'}
                  </button>


                  {avatarUrl ? (
                    <button
                      type="button"
                      className="profile-photo-link"
                      onClick={
                        handleDeleteAvatar
                      }
                      disabled={
                        uploadingAvatar ||
                        deletingAvatar
                      }
                      style={{
                        marginLeft: '12px',
                      }}
                    >
                      <Trash2
                        size={16}
                      />

                      {deletingAvatar
                        ? ' Suppression...'
                        : ' Supprimer'}
                    </button>
                  ) : null}
                </div>

              </div>


              <form
                ref={formRef}
                className="profile-simple-form"
                onSubmit={
                  handleSubmit
                }
              >

                <div className="profile-simple-grid">

                  <label>
                    <span>
                      Prénom
                    </span>

                    <input
                      type="text"
                      name="first_name"
                      value={
                        formData.first_name
                      }
                      onChange={
                        handleChange
                      }
                      required
                    />
                  </label>


                  <label>
                    <span>
                      Nom
                    </span>

                    <input
                      type="text"
                      name="last_name"
                      value={
                        formData.last_name
                      }
                      onChange={
                        handleChange
                      }
                      required
                    />
                  </label>


                  <label>
                    <span>
                      Adresse e-mail
                    </span>

                    <input
                      type="email"
                      name="email"
                      value={
                        formData.email
                      }
                      readOnly
                    />
                  </label>


                  <label>
                    <span>
                      Téléphone
                    </span>

                    <input
                      type="tel"
                      name="phone"
                      placeholder="Votre numéro"
                      value={
                        formData.phone
                      }
                      onChange={
                        handleChange
                      }
                    />
                  </label>


                  <label>
                    <span>
                      Ville
                    </span>

                    <input
                      type="text"
                      name="city"
                      placeholder="Votre ville"
                      value={
                        formData.city
                      }
                      onChange={
                        handleChange
                      }
                    />
                  </label>


                  <label>
                    <span>
                      Pays
                    </span>

                    <select
                      name="country"
                      value={
                        formData.country
                      }
                      onChange={
                        handleChange
                      }
                    >
                      <option value="Maroc">
                        Maroc
                      </option>
                    </select>
                  </label>

                </div>


                <div className="profile-main-actions">

                  <button
                    type="submit"
                    className="profile-save-main"
                    disabled={
                      saving ||
                      uploadingAvatar ||
                      deletingAvatar
                    }
                  >
                    {saving
                      ? 'Enregistrement...'
                      : 'Enregistrer les modifications'}
                  </button>


                  <button
                    type="button"
                    className="profile-cancel-main"
                    onClick={
                      handleCancel
                    }
                    disabled={
                      saving ||
                      uploadingAvatar ||
                      deletingAvatar
                    }
                  >
                    Annuler
                  </button>

                </div>

              </form>


              {message ? (
                <p
                  className={`account-pending-message ${
                    messageType
                      ? `account-message-${messageType}`
                      : ''
                  }`}
                  role="status"
                >
                  {message}
                </p>
              ) : null}

            </section>


            <section className="profile-security-card">

              <div className="profile-security-left">

                <div className="profile-row-icon">
                  <LockKeyhole
                    size={21}
                  />
                </div>


                <div>
                  <h3>
                    Sécurité du compte
                  </h3>

                  <strong>
                    Mot de passe
                  </strong>

                  <p>
                    Modifiez régulièrement
                    votre mot de passe pour
                    plus de sécurité.
                  </p>
                </div>

              </div>


              <Link
                to="/mon-compte/securite"
                className="profile-modify-button"
              >
                Modifier
              </Link>

            </section>


            <section className="profile-preferences-card">

              <div className="profile-preferences-title">

                <Mail
                  size={20}
                />

                <h3>
                  Préférences de communication
                </h3>

              </div>


              <label className="profile-newsletter-check">

                <input
                  type="checkbox"
                  name="newsletter_opt_in"
                  checked={
                    formData.newsletter_opt_in
                  }
                  onChange={
                    handleChange
                  }
                />

                <span>
                  Recevoir les nouveautés
                  et offres NOVA
                </span>

              </label>


              <p
                style={{
                  marginTop: '10px',
                  fontSize: '13px',
                  opacity: 0.7,
                }}
              >
                Cette préférence sera
                enregistrée lorsque vous
                cliquez sur « Enregistrer
                les modifications ».
              </p>

            </section>

          </div>
        </div>
      </div>
    </main>
  )
}

export default Profile