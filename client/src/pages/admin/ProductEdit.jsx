import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import ProductForm from '../../components/admin/ProductForm.jsx'
import AdminHeader from '../../components/layout/AdminHeader.jsx'
import AdminSidebar from '../../components/layout/AdminSidebar.jsx'
import {
  getAdminApiErrorMessages,
  getProduct,
} from '../../services/adminService.js'

export default function ProductEdit() {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const initialImages = useMemo(
    () => {
      if (!product) {
        return []
      }

      if (Array.isArray(product.images) && product.images.length > 0) {
        return product.images.map((image, index) => ({
          id: `${product.sku || product.id}-image-${index}`,
          src: image.image_url,
          image_url: image.image_url,
          name: image.alt_text || product.name,
          isObjectUrl: false,
        }))
      }

      return product.image
        ? [
            {
              id: `${product.sku || product.id}-image`,
              src: product.image,
              image_url: product.image,
              name: product.name,
              isObjectUrl: false,
            },
          ]
        : []
    },
    [product],
  )

  useEffect(() => {
    let isActive = true

    async function loadProduct() {
      setLoading(true)
      setError('')

      try {
        const nextProduct = await getProduct(id)

        if (isActive) {
          setProduct(nextProduct)
        }
      } catch (requestError) {
        if (isActive) {
          setProduct(null)
          setError(getAdminApiErrorMessages(requestError).join(' '))
        }
      } finally {
        if (isActive) {
          setLoading(false)
        }
      }
    }

    loadProduct()

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
                <h1>Chargement du produit</h1>
                <p>Lecture des donnees depuis la base.</p>
              </div>
            </section>
          </main>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="admin-layout">
        <AdminSidebar />

        <div className="admin-main">
          <AdminHeader />

          <main className="admin-dashboard product-form-page">
            <section className="product-form-heading">
              <div>
                <h1>Produit introuvable</h1>
                <p>
                  {error ||
                    'Aucun produit en base ne correspond a cet identifiant.'}
                </p>
              </div>

              <Link
                className="product-form-primary-action"
                to="/admin/produits"
              >
                Retour aux produits
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

        <ProductForm
          key={id || product.sku}
          title={`Modifier ${product.name}`}
          subtitle="Mettez a jour les informations produit en base."
          breadcrumbCurrent={product.name}
          initialValues={product}
          initialImages={initialImages}
          mode="edit"
          productId={product.id}
        />
      </div>
    </div>
  )
}
