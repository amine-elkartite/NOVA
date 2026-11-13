import { ChevronLeft, ChevronRight } from 'lucide-react'

function getVisiblePages(totalPages) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  return [1, 2, 3, 4, 'ellipsis', totalPages]
}

function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) {
    return null
  }

  const visiblePages = getVisiblePages(totalPages)

  return (
    <nav className="pagination" aria-label="Pagination produits">
      <button
        className="pagination-button pagination-arrow"
        type="button"
        aria-label="Page précédente"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        <ChevronLeft size={17} strokeWidth={1.5} />
      </button>

      {visiblePages.map((page) =>
        page === 'ellipsis' ? (
          <span className="pagination-ellipsis" key="ellipsis">
            ...
          </span>
        ) : (
          <button
            className={`pagination-button ${currentPage === page ? 'is-active' : ''}`}
            type="button"
            key={page}
            aria-current={currentPage === page ? 'page' : undefined}
            onClick={() => onPageChange(page)}
          >
            {page}
          </button>
        ),
      )}

      <button
        className="pagination-button pagination-arrow"
        type="button"
        aria-label="Page suivante"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        <ChevronRight size={17} strokeWidth={1.5} />
      </button>
    </nav>
  )
}

export default Pagination
