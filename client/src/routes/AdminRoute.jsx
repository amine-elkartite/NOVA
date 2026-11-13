import { Navigate, Outlet, useLocation } from 'react-router-dom'

import useAuth from '../hooks/useAuth.js'

function AdminRouteLoading() {
  return (
    <main
      className="admin-route-state"
      role="status"
      aria-live="polite"
    >
      <div className="admin-route-state__panel">
        <span className="admin-route-state__eyebrow">
          NOVA ADMIN
        </span>

        <h1>Chargement de l'administration</h1>

        <p>
          Vérification de votre session...
        </p>
      </div>
    </main>
  )
}

export default function AdminRoute({ children }) {
  const { isAuthenticated, loading, user } = useAuth()
  const location = useLocation()

  if (loading) {
    return <AdminRouteLoading />
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/connexion"
        replace
        state={{ from: location }}
      />
    )
  }

  if (user?.role !== 'admin') {
    return (
      <Navigate
        to="/"
        replace
      />
    )
  }

  return children || <Outlet />
}
