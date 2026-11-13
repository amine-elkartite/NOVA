import { Link } from 'react-router-dom'

import {
  Clock3,
  ShoppingBag,
  XCircle,
} from 'lucide-react'

const pageConfig = {
  success: {
    icon: Clock3,
    title:
      'Votre paiement est en cours de vérification.',
    message:
      'La commande sera confirmée après validation sécurisée par le fournisseur de paiement.',
    primaryLabel:
      'Voir mes commandes',
    primaryTo:
      '/mon-compte/commandes',
  },
  cancelled: {
    icon: XCircle,
    title:
      'Paiement annulé',
    message:
      'Aucun paiement n’a été confirmé. Votre commande ne sera pas marquée comme payée depuis cette page.',
    primaryLabel:
      'Retour au checkout',
    primaryTo:
      '/checkout',
  },
}

function PaymentReturn({
  status = 'success',
}) {
  const config =
    pageConfig[status] ||
    pageConfig.success

  const Icon = config.icon

  return (
    <main className="payment-return-page">
      <div className="nova-container">
        <section className="payment-return-panel">
          <div className="payment-return-icon">
            <Icon
              size={28}
              strokeWidth={1.6}
            />
          </div>

          <h1>
            {config.title}
          </h1>

          <p>
            {config.message}
          </p>

          <div className="payment-return-actions">
            <Link
              className="payment-return-primary"
              to={config.primaryTo}
            >
              {config.primaryLabel}
            </Link>

            <Link
              className="payment-return-secondary"
              to="/panier"
            >
              <ShoppingBag size={16} />
              Mon panier
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}

export default PaymentReturn
