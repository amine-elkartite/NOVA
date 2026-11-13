import ProductForm from '../../components/admin/ProductForm.jsx'
import AdminHeader from '../../components/layout/AdminHeader.jsx'
import AdminSidebar from '../../components/layout/AdminSidebar.jsx'

const initialProduct = {
  name: '',
  sku: '',
  description: '',
  category: 'Chaussures',
  subcategory: 'Baskets',
  regularPrice: '',
  salePrice: '',
  taxRate: '20',
  quantity: '0',
  stockStatus: 'in-stock',
  lowStockThreshold: '5',
  sizes: [],
  colors: [],
  publicationStatus: 'draft',
  visibility: 'visible',
  featured: false,
  isNew: true,
}

export default function ProductCreate() {
  return (
    <div className="admin-layout">
      <AdminSidebar />

      <div className="admin-main">
        <AdminHeader />

        <ProductForm
          title="Ajouter un produit"
          subtitle="Créez une fiche produit NOVA prête à publier."
          breadcrumbCurrent="Ajouter un produit"
          initialValues={initialProduct}
          initialImages={[]}
          mode="create"
        />
      </div>
    </div>
  )
}
