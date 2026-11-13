import { Truck } from 'lucide-react'

function DeliveryMethod({
  delivery,
  onDeliveryChange,
  shipping,
  standardIsFree = false,
}) {
  return (
    <section className="checkout-section">

      <div className="checkout-section-heading">
        <div className="checkout-step-number">
          3
        </div>

        <h2>
          Mode de livraison
        </h2>
      </div>

      <div className="delivery-options">

        <button
          type="button"
          className={`delivery-option ${
            delivery === 'standard'
              ? 'active'
              : ''
          }`}
          onClick={() =>
            onDeliveryChange('standard')
          }
        >
          <span className="checkout-radio">
            <span />
          </span>

          <Truck size={24} />

          <span className="delivery-option-text">
            <strong>
              Livraison standard
            </strong>

            <small>
              Entre 2 et 4 jours ouvrés
            </small>
          </span>

          <strong className={standardIsFree ? 'delivery-price free' : 'delivery-price'}>
            {standardIsFree ? 'Gratuite' : `${shipping.standard} DH`}
          </strong>
        </button>

        <button
          type="button"
          className={`delivery-option ${
            delivery === 'express'
              ? 'active'
              : ''
          }`}
          onClick={() =>
            onDeliveryChange('express')
          }
        >
          <span className="checkout-radio">
            <span />
          </span>

          <Truck size={24} />

          <span className="delivery-option-text">
            <strong>
              Livraison express
            </strong>

            <small>
              Entre 24 et 48 heures
            </small>
          </span>

          <strong className="delivery-price">
            {shipping.express} DH
          </strong>
        </button>

      </div>
    </section>
  )
}

export default DeliveryMethod
