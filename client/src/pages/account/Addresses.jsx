import {
  useCallback,
  useEffect,
  useState,
} from 'react'

import { Link } from 'react-router-dom'

import {
  BriefcaseBusiness,
  Home,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react'

import AccountSidebar from '../../components/layout/AccountSidebar.jsx'

import {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress as removeAddress,
  setDefaultAddress,
} from '../../services/addressService.js'

const emptyForm = {
  label: '',
  fullName: '',
  address: '',
  city: '',
  postalCode: '',
  phone: '',
  country: 'Maroc',
  isDefault: false,
}

function Addresses() {
  const [addresses, setAddresses] = useState([])
  const [formData, setFormData] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')

  const loadAddresses = useCallback(async () => {
    try {
      setLoading(true)

      const data = await getAddresses()

      setAddresses(data.addresses || [])
    } catch (error) {
      setMessage(
        error.message ||
          'Impossible de charger vos adresses.',
      )

      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAddresses()
  }, [loadAddresses])

  const handleChange = (event) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target

    setFormData((current) => ({
      ...current,
      [name]:
        type === 'checkbox'
          ? checked
          : value,
    }))

    setMessage('')
    setMessageType('')
  }

  const resetForm = () => {
    setFormData(emptyForm)
    setEditingId(null)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    try {
      setSaving(true)
      setMessage('')
      setMessageType('')

      const payload = {
        label:
          formData.label.trim() ||
          'Domicile',

        fullName:
          formData.fullName.trim(),

        address:
          formData.address.trim(),

        city:
          formData.city.trim(),

        postalCode:
          formData.postalCode.trim(),

        phone:
          formData.phone.trim(),

        country:
          formData.country,

        isDefault:
          formData.isDefault,
      }

      let data

      if (editingId) {
        data = await updateAddress(
          editingId,
          payload,
        )
      } else {
        data = await createAddress(
          payload,
        )
      }

      await loadAddresses()

      resetForm()

      setMessage(
        data.message ||
          (editingId
            ? 'Adresse modifiée avec succès.'
            : 'Adresse ajoutée avec succès.'),
      )

      setMessageType('success')
    } catch (error) {
      setMessage(
        error.message ||
          "Impossible d'enregistrer l'adresse.",
      )

      setMessageType('error')
    } finally {
      setSaving(false)
    }
  }

  const editAddress = (address) => {
    setEditingId(address.id)

    setFormData({
      label: address.label || '',
      fullName: address.fullName || '',
      address: address.address || '',
      city: address.city || '',
      postalCode:
        address.postalCode || '',
      phone: address.phone || '',
      country:
        address.country || 'Maroc',
      isDefault:
        Boolean(address.isDefault),
    })

    setMessage('')
    setMessageType('')

    setTimeout(() => {
      document
        .querySelector(
          '.address-inline-form',
        )
        ?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
    }, 0)
  }

  const deleteAddress = async (id) => {
    const confirmed = window.confirm(
      'Voulez-vous vraiment supprimer cette adresse ?',
    )

    if (!confirmed) {
      return
    }

    try {
      setMessage('')
      setMessageType('')

      const data =
        await removeAddress(id)

      await loadAddresses()

      if (editingId === id) {
        resetForm()
      }

      setMessage(
        data.message ||
          'Adresse supprimée avec succès.',
      )

      setMessageType('success')
    } catch (error) {
      setMessage(
        error.message ||
          "Impossible de supprimer l'adresse.",
      )

      setMessageType('error')
    }
  }

  const makeDefault = async (id) => {
    try {
      setMessage('')
      setMessageType('')

      const data =
        await setDefaultAddress(id)

      await loadAddresses()

      setMessage(
        data.message ||
          'Adresse définie par défaut.',
      )

      setMessageType('success')
    } catch (error) {
      setMessage(
        error.message ||
          "Impossible de définir cette adresse par défaut.",
      )

      setMessageType('error')
    }
  }

  const scrollToForm = () => {
    resetForm()

    setMessage('')
    setMessageType('')

    setTimeout(() => {
      document
        .querySelector(
          '.address-inline-form',
        )
        ?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
    }, 0)
  }

  return (
    <main className="account-addresses-page">

      <section className="account-hero">
        <div className="nova-container">

          <h1>
            Mes adresses
          </h1>

          <p>
            Gérez vos adresses de livraison
            et de facturation.
          </p>

        </div>
      </section>

      <div className="nova-container">

        <nav className="account-breadcrumb">

          <Link to="/">
            Accueil
          </Link>

          <span>/</span>

          <Link to="/mon-compte">
            Mon compte
          </Link>

          <span>/</span>

          <span>
            Mes adresses
          </span>

        </nav>

        <div className="account-layout">

          <AccountSidebar />

          <div className="addresses-content">

            <div className="addresses-title-row">

              <div>
                <h2>
                  Carnet d’adresses
                </h2>
              </div>

              <button
                type="button"
                className="address-top-add-button"
                onClick={scrollToForm}
              >
                <Plus size={18} />

                Ajouter une adresse
              </button>

            </div>

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

            {loading ? (
              <p className="account-pending-message">
                Chargement des adresses...
              </p>
            ) : null}

            {!loading &&
            addresses.length === 0 ? (
              <p className="account-pending-message">
                Vous n’avez encore enregistré
                aucune adresse.
              </p>
            ) : null}

            {!loading &&
            addresses.length > 0 ? (
              <div className="address-cards-grid">

                {addresses.map(
                  (address) => {
                    const isOffice =
                      address.label
                        ?.toLowerCase()
                        .includes(
                          'bureau',
                        )

                    const Icon =
                      isOffice
                        ? BriefcaseBusiness
                        : Home

                    return (
                      <article
                        className="address-simple-card"
                        key={address.id}
                      >

                        <div className="address-simple-body">

                          <div className="address-simple-icon">

                            <Icon
                              size={23}
                              strokeWidth={1.6}
                            />

                          </div>

                          <div className="address-simple-info">

                            <div className="address-simple-heading">

                              <h3>
                                {address.label}
                              </h3>

                              {address.isDefault && (
                                <span>
                                  Par défaut
                                </span>
                              )}

                            </div>

                            <strong>
                              {address.fullName}
                            </strong>

                            <p>
                              {address.address}
                            </p>

                            {address.address2 && (
                              <p>
                                {address.address2}
                              </p>
                            )}

                            {address.postalCode ? (
                              <p>
                                {address.postalCode}
                              </p>
                            ) : null}

                            <p>
                              {address.city}
                              {' · '}
                              {address.country}
                            </p>

                            {address.phone ? (
                              <p>
                                {address.phone}
                              </p>
                            ) : null}

                            {!address.isDefault && (
                              <button
                                type="button"
                                className="address-set-default"
                                onClick={() =>
                                  makeDefault(
                                    address.id,
                                  )
                                }
                              >
                                Définir par défaut
                              </button>
                            )}

                          </div>

                        </div>

                        <div className="address-simple-footer">

                          <button
                            type="button"
                            onClick={() =>
                              editAddress(
                                address,
                              )
                            }
                          >
                            <Pencil size={16} />

                            Modifier
                          </button>

                          <button
                            type="button"
                            className="address-delete-button"
                            onClick={() =>
                              deleteAddress(
                                address.id,
                              )
                            }
                          >
                            <Trash2 size={16} />

                            Supprimer
                          </button>

                        </div>

                      </article>
                    )
                  },
                )}

              </div>
            ) : null}

            <section className="address-inline-form">

              <h3>
                {editingId
                  ? 'Modifier l’adresse'
                  : 'Ajouter une nouvelle adresse'}
              </h3>

              <form onSubmit={handleSubmit}>

                <div className="address-inline-grid">

                  <label>

                    <span>
                      Nom de l'adresse
                    </span>

                    <input
                      type="text"
                      name="label"
                      placeholder="Ex. : Domicile"
                      value={
                        formData.label
                      }
                      onChange={
                        handleChange
                      }
                    />

                  </label>

                  <label>

                    <span>
                      Nom complet
                    </span>

                    <input
                      type="text"
                      name="fullName"
                      placeholder="Votre nom complet"
                      value={
                        formData.fullName
                      }
                      onChange={
                        handleChange
                      }
                      required
                    />

                  </label>

                  <label className="address-full-field">

                    <span>
                      Adresse
                    </span>

                    <input
                      type="text"
                      name="address"
                      placeholder="Rue, numéro, appartement"
                      value={
                        formData.address
                      }
                      onChange={
                        handleChange
                      }
                      required
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
                      required
                    />

                  </label>

                  <label>

                    <span>
                      Code postal
                    </span>

                    <input
                      type="text"
                      name="postalCode"
                      placeholder="Votre code postal"
                      value={
                        formData.postalCode
                      }
                      onChange={
                        handleChange
                      }
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

                <div className="address-form-bottom">

                  <label className="address-default-checkbox">

                    <input
                      type="checkbox"
                      name="isDefault"
                      checked={
                        formData.isDefault
                      }
                      onChange={
                        handleChange
                      }
                    />

                    <span>
                      Définir comme adresse
                      par défaut
                    </span>

                  </label>

                  <div className="address-form-buttons">

                    <button
                      type="submit"
                      className="address-save-main"
                      disabled={saving}
                    >
                      {saving
                        ? 'Enregistrement...'
                        : editingId
                          ? 'Enregistrer les modifications'
                          : "Enregistrer l'adresse"}
                    </button>

                    <button
                      type="button"
                      className="address-cancel-main"
                      onClick={resetForm}
                      disabled={saving}
                    >
                      Annuler
                    </button>

                  </div>

                </div>

              </form>

            </section>

          </div>

        </div>

      </div>

    </main>
  )
}

export default Addresses