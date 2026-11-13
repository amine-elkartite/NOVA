import {
  Minus,
  Plus,
  Trash2,
} from 'lucide-react'

function CartItem({
  item,
  onIncrease,
  onDecrease,
  onRemove,
}) {
  const variant = [
    item.color,
    item.size,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <article className="cart-item">
      <img
        className="cart-item-image"
        src={item.image}
        alt={item.imageAlt || item.name}
      />

      <div className="cart-item-details">
        <h3>{item.name}</h3>

        {variant ? (
          <p className="cart-item-variant">
            {variant}
          </p>
        ) : null}

        <p className="cart-item-stock">
          <span />
          En stock
        </p>
      </div>

      <div className="cart-item-quantity">
        <button
          type="button"
          onClick={() =>
            onDecrease(item.cartKey)
          }
          disabled={item.quantity <= 1}
          aria-label="Diminuer la quantité"
        >
          <Minus size={15} />
        </button>

        <span>
          {item.quantity}
        </span>

        <button
          type="button"
          onClick={() =>
            onIncrease(item.cartKey)
          }
          aria-label="Augmenter la quantité"
        >
          <Plus size={15} />
        </button>
      </div>

      <strong className="cart-item-price">
        {(
          item.priceValue * item.quantity
        ).toLocaleString('fr-FR')}{' '}
        DH
      </strong>

      <button
        type="button"
        className="cart-item-remove"
        onClick={() =>
          onRemove(item.cartKey)
        }
        aria-label={`Supprimer ${item.name}`}
      >
        <Trash2
          size={19}
          strokeWidth={1.5}
        />
      </button>
    </article>
  )
}

export default CartItem