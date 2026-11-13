import CategoryForm from '../../components/admin/CategoryForm.jsx'
import AdminHeader from '../../components/layout/AdminHeader.jsx'
import AdminSidebar from '../../components/layout/AdminSidebar.jsx'

export default function CategoryCreate() {
  return (
    <div className="admin-layout">
      <AdminSidebar />

      <div className="admin-main">
        <AdminHeader />

        <CategoryForm
          title="Ajouter une categorie"
          subtitle="Creez une categorie en base pour organiser le catalogue."
          mode="create"
        />
      </div>
    </div>
  )
}
