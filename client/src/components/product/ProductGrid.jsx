import ProductCard from './ProductCard.jsx'

function ProductGrid({ products, variant = 'default' }) {
  if (!products.length) {
    return (
      <div className="catalog-empty" role="status">
        Aucun produit ne correspond à cette sélection.
      </div>
    )
  }

  return (
    <div className={`products-grid ${variant === 'catalog' ? 'catalog-products-grid' : ''}`}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} variant={variant} />
      ))}
    </div>
  )
}

export default ProductGrid
