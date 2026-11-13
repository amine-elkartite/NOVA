import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import CategoryForm from '../../components/admin/CategoryForm.jsx'
import AdminHeader from '../../components/layout/AdminHeader.jsx'
import AdminSidebar from '../../components/layout/AdminSidebar.jsx'
import {
  getAdminApiErrorMessages,
  getCategory,
} from '../../services/adminService.js'

export default function CategoryEdit() {
  const { id } = useParams()
  const [category, setCategory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isActive = true

    async function loadCategory() {
      setLoading(true)
      setError('')

      try {
        const nextCategory = await getCategory(id)

        if (isActive) {
          setCategory(nextCategory)
        }
      } catch (requestError) {
        if (isActive) {
          setCategory(null)
          setError(getAdminApiErrorMessages(requestError).join(' '))
        }
      } finally {
        if (isActive) {
          setLoading(false)
        }
      }
    }

    loadCategory()

    return () => {
      isActive = false
    }
  }, [id])

  if (loading) {
    return (
      <div className="admin-layout">
        <AdminSidebar />

        <div className="admin-main">
          <AdminHeader />

          <main className="admin-dashboard product-form-page">
            <section className="product-form-heading">
              <div>
                <h1>Chargement de la categorie</h1>
                <p>Lecture des donnees depuis la base.</p>
              </div>
            </section>
          </main>
        </div>
      </div>
    )
  }

  if (!category) {
    return (
      <div className="admin-layout">
        <AdminSidebar />

        <div className="admin-main">
          <AdminHeader />

          <main className="admin-dashboard product-form-page">
            <section className="product-form-heading">
              <div>
                <h1>Categorie introuvable</h1>
                <p>
                  {error ||
                    'Aucune categorie en base ne correspond a cet identifiant.'}
                </p>
              </div>

              <Link
                className="product-form-primary-action"
                to="/admin/categories"
              >
                Retour aux categories
              </Link>
            </section>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-layout">
      <AdminSidebar />

      <div className="admin-main">
        <AdminHeader />

        <CategoryForm
          key={category.id}
          title={`Modifier ${category.name}`}
          subtitle="Mettez a jour cette categorie en base."
          initialValues={category}
          mode="edit"
        />
      </div>
    </div>
  )
}
