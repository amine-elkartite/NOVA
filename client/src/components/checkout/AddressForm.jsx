import {
  UserRound,
  MapPin,
  Building2,
  Globe2,
  ChevronDown,
} from 'lucide-react'

function AddressForm({
  address,
  onAddressChange,
}) {
  const handleChange = (event) => {
    const { name, value } = event.target

    onAddressChange({
      ...address,
      [name]: value,
    })
  }

  return (
    <section className="checkout-section">

      <div className="checkout-section-heading">
        <div className="checkout-step-number">
          2
        </div>

        <h2>
          Adresse de livraison
        </h2>

        <span>
          Votre commande sera livrée à cette adresse
        </span>
      </div>

      <div className="checkout-form-grid two">

        <label className="checkout-field">
          <span>
            Prénom <b>*</b>
          </span>

          <div className="checkout-input-wrap">
            <UserRound size={18} />

            <input
              type="text"
              name="firstName"
              value={address.firstName}
              onChange={handleChange}
              placeholder="Votre prénom"
              required
            />
          </div>
        </label>

        <label className="checkout-field">
          <span>
            Nom <b>*</b>
          </span>

          <div className="checkout-input-wrap">
            <UserRound size={18} />

            <input
              type="text"
              name="lastName"
              value={address.lastName}
              onChange={handleChange}
              placeholder="Votre nom"
              required
            />
          </div>
        </label>

      </div>

      <label className="checkout-field checkout-full-field">
        <span>
          Adresse <b>*</b>
        </span>

        <div className="checkout-input-wrap">
          <MapPin size={18} />

          <input
            type="text"
            name="addressLine1"
            value={address.addressLine1}
            onChange={handleChange}
            placeholder="Numéro et nom de la rue"
            required
          />
        </div>
      </label>

      <div className="checkout-form-grid three">

        <label className="checkout-field">
          <span>
            Ville <b>*</b>
          </span>

          <div className="checkout-input-wrap">
            <Building2 size={18} />

            <input
              type="text"
              name="city"
              value={address.city}
              onChange={handleChange}
              placeholder="Votre ville"
              required
            />
          </div>
        </label>

        <label className="checkout-field">
          <span>
            Code postal <b>*</b>
          </span>

          <div className="checkout-input-wrap">
            <MapPin size={18} />

            <input
              type="text"
              name="postalCode"
              value={address.postalCode}
              onChange={handleChange}
              placeholder="Code postal"
              required
            />
          </div>
        </label>

        <label className="checkout-field">
          <span>
            Pays / Région <b>*</b>
          </span>

          <div className="checkout-input-wrap checkout-select-wrap">
            <Globe2 size={18} />

            <select
              name="country"
              value={address.country}
              onChange={handleChange}
              required
            >
              <option value="Maroc">
                Maroc
              </option>
            </select>

            <ChevronDown size={16} />
          </div>
        </label>

      </div>
    </section>
  )
}

export default AddressForm
