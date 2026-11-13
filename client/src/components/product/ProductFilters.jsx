function ProductFilters({ options, value, onChange }) {
  return (
    <div className="catalog-pills" aria-label="Filtrer les produits">
      {options.map((option) => (
        <button
          className={`catalog-pill ${value === option.value ? 'is-active' : ''}`}
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

export default ProductFilters
