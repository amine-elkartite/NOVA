import {
  ArrowRight,
  Info,
  LockKeyhole,
  Truck,
} from 'lucide-react'

import { Link } from 'react-router-dom'
import PromoCode from './PromoCode.jsx'

function CartSummary({
  subtotal,
  discount,
  total,
  itemCount,
  onApplyPromo,
  appliedPromotion,
  promoMessage,
  promoError,
  promoLoading,
  freeShipping,
}) {
  return (
    <aside className="cart-summary">
      <h2>Résumé de la commande</h2>

      <div className="cart-summary-lines">
        <div className="cart-summary-line">
          <span>
            Sous-total ({itemCount}{' '}
            {itemCount > 1
              ? 'articles'
              : 'article'})
          </span>

          <strong>
            {subtotal.toLocaleString(
              'fr-FR'
            )}{' '}
            DH
          </strong>
        </div>

        <div className="cart-summary-line">
          <span className="cart-delivery-label">
            Livraison
            <Info size={15} />
          </span>

          <strong
            className={
              freeShipping
                ? 'cart-free'
                : ''
            }
          >
            {freeShipping
              ? 'Gratuite'
              : subtotal >= 600
                ? 'Gratuite'
                : 'Calculée au paiement'}
          </strong>
        </div>

        <div className="cart-summary-line">
          <span>
            Réduction
            {appliedPromotion?.code
              ? ` (${appliedPromotion.code})`
              : ''}
          </span>

          <span>
            -{' '}
            {discount.toLocaleString(
              'fr-FR'
            )}{' '}
            DH
          </span>
        </div>
      </div>

      <div className="cart-total">
        <span>Total</span>

        <div>
          <strong>
            {total.toLocaleString(
              'fr-FR'
            )}{' '}
            DH
          </strong>

          <small>
            Taxes incluses
          </small>
        </div>
      </div>

      <PromoCode
        onApply={onApplyPromo}
        loading={promoLoading}
      />

      {promoMessage ? (
        <p className="cart-promo-success">
          {promoMessage}
        </p>
      ) : null}

      {promoError ? (
        <p className="cart-promo-error">
          {promoError}
        </p>
      ) : null}

      <Link
        to="/checkout"
        className="cart-checkout-button"
      >
        Passer au paiement
        <ArrowRight size={18} />
      </Link>

      <Link
        to="/nouveautes"
        className="cart-continue-button"
      >
        Continuer mes achats
      </Link>

      <div className="cart-summary-benefits">
        <div>
          <LockKeyhole size={21} />

          <span>
            Paiement 100% sécurisé
          </span>
        </div>

        <div>
          <Truck size={23} />

          <span>
            Livraison offerte
            <br />
            dès 600 DH
          </span>
        </div>
      </div>
    </aside>
  )
}

export default CartSummary