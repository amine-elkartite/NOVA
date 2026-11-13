import { Tag } from 'lucide-react'
import { useState } from 'react'

function PromoCode({
  onApply,
  loading = false,
}) {
  const [code, setCode] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()

    const cleanCode = code
      .trim()
      .toUpperCase()

    if (!cleanCode || loading) {
      return
    }

    await onApply(cleanCode)
  }

  return (
    <div className="promo-wrapper">
      <form
        className="promo-form"
        onSubmit={handleSubmit}
      >
        <div className="promo-input-wrap">
          <Tag
            size={18}
            strokeWidth={1.5}
          />

          <input
            type="text"
            value={code}
            onChange={(event) =>
              setCode(
                event.target.value
              )
            }
            placeholder="Code promo"
            aria-label="Code promo"
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          disabled={
            loading ||
            !code.trim()
          }
        >
          {loading
            ? 'Validation...'
            : 'Appliquer'}
        </button>
      </form>
    </div>
  )
}

export default PromoCode