import {
  ArrowRight,
  Info,
  LockKeyhole,
  Truck,
  RefreshCw,
  Tag,
} from 'lucide-react'

function CheckoutSummary({
  cartItems,
  subtotal,
  itemCount,
  deliveryFee = 0,
  discount = 0,
  total = 0,
  appliedPromotion = null,
  freeShipping = false,
  freeShippingThreshold = 0,
  pendingMessage = '',
  confirmLabel = 'Confirmer la commande',
  isSubmitting = false,
}) {
  const formatPrice = (value) =>
    Number(value || 0).toLocaleString('fr-FR')

  const promotionCode =
    appliedPromotion?.code || ''

  return (
    <aside className="checkout-summary">

      <h2>
        Résumé de la commande
      </h2>

      <div className="checkout-summary-products">

        {cartItems.map((item) => {
          const variant = [
            item.color,
            item.size,
          ]
            .filter(Boolean)
            .join(' · ')

          return (
            <div
              className="checkout-summary-product"
              key={item.cartKey}
            >
              <img
                src={item.image}
                alt={
                  item.imageAlt ||
                  item.name
                }
              />

              <div className="checkout-summary-product-info">
                <strong>
                  {item.name}
                </strong>

                {variant && (
                  <span>
                    {variant}
                  </span>
                )}

                <small>
                  Qté : {item.quantity}
                </small>
              </div>

              <strong className="checkout-summary-product-price">
                {formatPrice(
                  item.priceValue *
                    item.quantity,
                )}{' '}
                DH
              </strong>
            </div>
          )
        })}

      </div>

      <div className="checkout-summary-lines">

        <div>
          <span>
            Sous-total ({itemCount}{' '}
            {itemCount > 1
              ? 'articles'
              : 'article'})
          </span>

          <strong>
            {formatPrice(subtotal)} DH
          </strong>
        </div>

        <div>
          <span className="checkout-info-label">
            Livraison
            <Info size={14} />
          </span>

          <strong
            className={
              deliveryFee === 0
                ? 'checkout-free'
                : ''
            }
          >
            {freeShipping
              ? 'Gratuite'
              : deliveryFee === 0
                ? 'Gratuite'
                : `${formatPrice(
                    deliveryFee,
                  )} DH`}
          </strong>
        </div>

        <div>
          <span>
            Réduction
            {promotionCode
              ? ` (${promotionCode})`
              : ''}
          </span>

          <strong>
            - {formatPrice(discount)} DH
          </strong>
        </div>

      </div>

      <div className="checkout-total">

        <span>
          Total
        </span>

        <div>
          <strong>
            {formatPrice(total)} DH
          </strong>

          <small>
            Taxes incluses
          </small>
        </div>

      </div>

      <div className="checkout-promo">
        <div>
          <Tag size={18} />

          <input
            type="text"
            placeholder="Code promo"
            value={promotionCode}
            readOnly
          />
        </div>

        <button
          type="button"
          disabled
        >
          {promotionCode
            ? 'Appliqué'
            : 'Aucun code'}
        </button>
      </div>

      {promotionCode ? (
        <p
          className="checkout-promo-message"
          role="status"
        >
          Code {promotionCode} appliqué
          {freeShipping
            ? ' : livraison gratuite.'
            : ` : ${formatPrice(
                discount,
              )} DH de réduction.`}
        </p>
      ) : null}

      <div className="checkout-summary-benefits">

        <div>
          <LockKeyhole size={24} />

          <span>
            <strong>
              Paiement 100% sécurisé
            </strong>

            Vos données sont protégées et cryptées
          </span>
        </div>

        <div>
          <Truck size={25} />

          <span>
            <strong>
              Livraison standard offerte dès {formatPrice(freeShippingThreshold)} DH
            </strong>

            Partout au Maroc
          </span>
        </div>

        <div>
          <RefreshCw size={24} />

          <span>
            <strong>
              Retours faciles
            </strong>

            Sous 14 jours
          </span>
        </div>

      </div>

      <button
        type="submit"
        className="checkout-confirm-button"
        disabled={isSubmitting}
      >
        {confirmLabel}
        <ArrowRight size={18} />
      </button>

      {pendingMessage ? (
        <p
          className="checkout-pending-message"
          role="status"
        >
          {pendingMessage}
        </p>
      ) : null}

    </aside>
  )
}

export default CheckoutSummary
