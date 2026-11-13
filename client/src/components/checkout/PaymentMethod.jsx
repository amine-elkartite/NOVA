import {
  CreditCard,
  Banknote,
  LockKeyhole,
  Mail,
} from 'lucide-react'

function PaymentMethod({
  paymentMethod,
  onPaymentMethodChange,

  paymentDetails,
  onPaymentDetailsChange,

  paymentErrors = {},
  availability,
}) {
  const updateField = (
    field,
    value,
  ) => {
    onPaymentDetailsChange({
      ...paymentDetails,
      [field]: value,
    })
  }

  const formatCardNumber = (
    value,
  ) => {
    const digits =
      value
        .replace(/\D/g, '')
        .slice(0, 16)

    return digits
      .replace(/(.{4})/g, '$1 ')
      .trim()
  }

  const formatExpiry = (
    value,
  ) => {
    const digits =
      value
        .replace(/\D/g, '')
        .slice(0, 4)

    if (digits.length <= 2) {
      return digits
    }

    return `${digits.slice(
      0,
      2,
    )}/${digits.slice(2)}`
  }

  const formatCvc = (
    value,
  ) => {
    return value
      .replace(/\D/g, '')
      .slice(0, 4)
  }

  return (
    <section className="checkout-section">
      <div className="checkout-section-heading">
        <div className="checkout-step-number">
          4
        </div>

        <h2>
          Paiement
        </h2>

        <span className="checkout-secure-label">
          <LockKeyhole size={14} />

          Paiement sécurisé
        </span>
      </div>

      <div className="payment-methods">
        <button
          type="button"
          className={`payment-method ${
            paymentMethod === 'card'
              ? 'active'
              : ''
          }`}
          onClick={() =>
            onPaymentMethodChange(
              'card',
            )
          }
          disabled={!availability.card.available}
        >
          <CreditCard size={20} />

          Carte bancaire
          {!availability.card.available ? ' - Indisponible' : ''}
        </button>

        <button
          type="button"
          className={`payment-method ${
            paymentMethod === 'paypal'
              ? 'active'
              : ''
          }`}
          onClick={() =>
            onPaymentMethodChange(
              'paypal',
            )
          }
          disabled={!availability.paypal.available}
        >
          <strong className="paypal-symbol">
            P
          </strong>

          PayPal
          {!availability.paypal.available ? ' - Indisponible' : ''}
        </button>

        <button
          type="button"
          className={`payment-method ${
            paymentMethod === 'cash'
              ? 'active'
              : ''
          }`}
          onClick={() =>
            onPaymentMethodChange(
              'cash',
            )
          }
          disabled={!availability.cash.available}
        >
          <Banknote size={21} />

          Paiement à la livraison
        </button>
      </div>

      {paymentMethod ===
        'card' && availability.card.available && (
        <div className="payment-card-form">
          <div className="payment-card-header">
            <div>
              <strong>
                Informations de la
                carte
              </strong>

              <p>
                Mode démonstration :
                ces informations ne
                sont ni enregistrées
                ni envoyées au serveur.
              </p>
            </div>

            <LockKeyhole
              size={18}
            />
          </div>

          <div className="payment-field">
            <label
              htmlFor="cardHolder"
            >
              Nom du titulaire *
            </label>

            <input
              id="cardHolder"
              type="text"
              value={
                paymentDetails.cardHolder
              }
              onChange={(event) =>
                updateField(
                  'cardHolder',
                  event.target.value,
                )
              }
              placeholder="Ex. Oumaima Achouaf"
              autoComplete="cc-name"
              className={
                paymentErrors.cardHolder
                  ? 'input-error'
                  : ''
              }
            />

            {paymentErrors.cardHolder ? (
              <span className="payment-field-error">
                {
                  paymentErrors.cardHolder
                }
              </span>
            ) : null}
          </div>

          <div className="payment-field">
            <label
              htmlFor="cardNumber"
            >
              Numéro de carte *
            </label>

            <div className="payment-input-icon">
              <CreditCard
                size={18}
              />

              <input
                id="cardNumber"
                type="text"
                inputMode="numeric"
                value={
                  paymentDetails.cardNumber
                }
                onChange={(event) =>
                  updateField(
                    'cardNumber',
                    formatCardNumber(
                      event.target
                        .value,
                    ),
                  )
                }
                placeholder="1234 5678 9012 3456"
                autoComplete="cc-number"
                className={
                  paymentErrors.cardNumber
                    ? 'input-error'
                    : ''
                }
              />
            </div>

            {paymentErrors.cardNumber ? (
              <span className="payment-field-error">
                {
                  paymentErrors.cardNumber
                }
              </span>
            ) : null}
          </div>

          <div className="payment-field-row">
            <div className="payment-field">
              <label
                htmlFor="cardExpiry"
              >
                Date d’expiration *
              </label>

              <input
                id="cardExpiry"
                type="text"
                inputMode="numeric"
                value={
                  paymentDetails.cardExpiry
                }
                onChange={(event) =>
                  updateField(
                    'cardExpiry',
                    formatExpiry(
                      event.target
                        .value,
                    ),
                  )
                }
                placeholder="MM/AA"
                autoComplete="cc-exp"
                className={
                  paymentErrors.cardExpiry
                    ? 'input-error'
                    : ''
                }
              />

              {paymentErrors.cardExpiry ? (
                <span className="payment-field-error">
                  {
                    paymentErrors.cardExpiry
                  }
                </span>
              ) : null}
            </div>

            <div className="payment-field">
              <label
                htmlFor="cardCvc"
              >
                CVC *
              </label>

              <input
                id="cardCvc"
                type="password"
                inputMode="numeric"
                value={
                  paymentDetails.cardCvc
                }
                onChange={(event) =>
                  updateField(
                    'cardCvc',
                    formatCvc(
                      event.target
                        .value,
                    ),
                  )
                }
                placeholder="123"
                autoComplete="cc-csc"
                className={
                  paymentErrors.cardCvc
                    ? 'input-error'
                    : ''
                }
              />

              {paymentErrors.cardCvc ? (
                <span className="payment-field-error">
                  {
                    paymentErrors.cardCvc
                  }
                </span>
              ) : null}
            </div>
          </div>

          <div className="payment-security-note">
            <LockKeyhole
              size={14}
            />

            <span>
              Validation de démonstration
              uniquement. NOVA ne doit
              jamais enregistrer numéro
              de carte ou CVC en base de
              données.
            </span>
          </div>
        </div>
      )}

      {paymentMethod ===
        'paypal' && availability.paypal.available && (
        <div className="payment-card-form">
          <div className="payment-card-header">
            <div>
              <strong>
                PayPal
              </strong>

              <p>
                Validation de
                démonstration avant
                l’intégration officielle.
              </p>
            </div>

            <strong className="paypal-symbol">
              P
            </strong>
          </div>

          <div className="payment-field">
            <label
              htmlFor="paypalEmail"
            >
              Adresse e-mail PayPal *
            </label>

            <div className="payment-input-icon">
              <Mail size={18} />

              <input
                id="paypalEmail"
                type="email"
                value={
                  paymentDetails.paypalEmail
                }
                onChange={(event) =>
                  updateField(
                    'paypalEmail',
                    event.target.value,
                  )
                }
                placeholder="nom@exemple.com"
                autoComplete="email"
                className={
                  paymentErrors.paypalEmail
                    ? 'input-error'
                    : ''
                }
              />
            </div>

            {paymentErrors.paypalEmail ? (
              <span className="payment-field-error">
                {
                  paymentErrors.paypalEmail
                }
              </span>
            ) : null}
          </div>

          <div className="payment-security-note">
            <LockKeyhole
              size={14}
            />

            <span>
              Le mot de passe PayPal ne
              doit jamais être saisi dans
              NOVA. Avec l’intégration
              réelle, la connexion se fera
              directement chez PayPal.
            </span>
          </div>
        </div>
      )}

      {paymentMethod ===
        'cash' && (
        <div className="payment-info-box">
          <div className="payment-info-icon">
            <Banknote
              size={20}
              strokeWidth={1.5}
            />
          </div>

          <div className="payment-info-content">
            <strong>
              Paiement à la livraison
            </strong>

            <p>
              Vous paierez votre
              commande au moment de la
              livraison.
            </p>
          </div>
        </div>
      )}
    </section>
  )
}

export default PaymentMethod
