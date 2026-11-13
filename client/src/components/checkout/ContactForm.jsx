import {
  Mail,
  Phone,
  ChevronDown,
} from 'lucide-react'

function ContactForm({
  contact,
  onContactChange,
}) {
  const handleChange = (event) => {
    const { name, value } = event.target

    onContactChange({
      ...contact,
      [name]: value,
    })
  }

  return (
    <section className="checkout-section">

      <div className="checkout-section-heading">
        <div className="checkout-step-number">
          1
        </div>

        <h2>
          Coordonnées
        </h2>

        <span>
          Nous vous enverrons la confirmation de commande par email
        </span>
      </div>

      <div className="checkout-form-grid two">

        <label className="checkout-field">
          <span>
            Email <b>*</b>
          </span>

          <div className="checkout-input-wrap">
            <Mail size={18} />

            <input
              type="email"
              name="email"
              value={contact.email}
              onChange={handleChange}
              placeholder="exemple@votreemail.com"
              required
            />
          </div>
        </label>

        <label className="checkout-field">
          <span>
            Téléphone <b>*</b>
          </span>

          <div className="checkout-phone-input">
            <div className="checkout-country-code">
              <Phone size={17} />
              <strong>+212</strong>
              <ChevronDown size={14} />
            </div>

            <input
              type="tel"
              name="phone"
              value={contact.phone}
              onChange={handleChange}
              placeholder="6 12 34 56 78"
              required
            />
          </div>
        </label>

      </div>
    </section>
  )
}

export default ContactForm