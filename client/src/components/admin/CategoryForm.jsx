import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ImagePlus,
  RotateCcw,
  Save,
  UploadCloud,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import {
  getAdminApiErrorMessages,
  slugify,
  uploadAdminImages,
  upsertCategory,
} from '../../services/adminService.js'

const fallbackCategory = {
  name: '',
  slug: '',
  description: '',
  statusType: 'active',
  image: '',
  fallback: 'jewelry',
  products: 0,
}

export default function CategoryForm({
  title,
  subtitle,
  initialValues = fallbackCategory,
  mode,
}) {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    ...fallbackCategory,
    ...initialValues,
  })
  const [preview, setPreview] = useState(initialValues.image || '')
  const [previewIsObjectUrl, setPreviewIsObjectUrl] = useState(false)
  const [imageFile, setImageFile] = useState(null)
  const [errors, setErrors] = useState([])
  const [notice, setNotice] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(
    () => () => {
      if (previewIsObjectUrl && preview) {
        URL.revokeObjectURL(preview)
      }
    },
    [preview, previewIsObjectUrl],
  )

  const updateField = (event) => {
    const { name, value } = event.target

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
      ...(name === 'name' && !currentForm.slug
        ? {
            slug: slugify(value),
          }
        : {}),
    }))
    setNotice('')
  }

  const changeImage = (event) => {
    const [file] = Array.from(event.target.files || [])

    if (!file) {
      return
    }

    if (previewIsObjectUrl && preview) {
      URL.revokeObjectURL(preview)
    }

    setPreview(URL.createObjectURL(file))
    setPreviewIsObjectUrl(true)
    setImageFile(file)
    setNotice('Image prete pour envoi serveur.')
    event.target.value = ''
  }

  const validate = () => {
    const nextErrors = []

    if (!form.name.trim()) {
      nextErrors.push('Le nom de la categorie est requis.')
    }

    if (!form.slug.trim()) {
      nextErrors.push('Le slug est requis.')
    }

    if (!form.description.trim()) {
      nextErrors.push('La description est requise.')
    }

    setErrors(nextErrors)
    return nextErrors.length === 0
  }

  const saveCategory = async () => {
    if (isSaving) {
      return
    }

    if (!validate()) {
      setNotice('')
      return
    }

    setIsSaving(true)
    setErrors([])

    try {
      const [uploadedImage] = imageFile
        ? await uploadAdminImages([imageFile], 'categories')
        : []

      const savedCategory = await upsertCategory({
        ...form,
        image: uploadedImage?.image_url || preview,
      })

      setForm(savedCategory)
      setPreview(savedCategory.image || '')
      setPreviewIsObjectUrl(false)
      setImageFile(null)
      setNotice(
        mode === 'edit'
          ? 'Categorie mise a jour en base.'
          : 'Categorie creee en base.',
      )

      if (mode === 'create') {
        navigate('/admin/categories')
      }
    } catch (error) {
      setNotice('')
      setErrors(getAdminApiErrorMessages(error))
    } finally {
      setIsSaving(false)
    }
  }

  const resetForm = () => {
    setForm({
      ...fallbackCategory,
      ...initialValues,
    })
    setPreview(initialValues.image || '')
    setPreviewIsObjectUrl(false)
    setImageFile(null)
    setErrors([])
    setNotice('Formulaire reinitialise.')
  }

  return (
    <main className="admin-dashboard product-form-page category-form-page">
      <section className="product-form-breadcrumb">
        <Link to="/admin">Accueil</Link>
        <span>›</span>
        <Link to="/admin/categories">Categories</Link>
        <span>›</span>
        <strong>{title}</strong>
      </section>

      <section className="product-form-heading">
        <div className="product-form-heading__title">
          <Link
            className="product-form-back"
            to="/admin/categories"
            aria-label="Retour aux categories"
          >
            <ArrowLeft size={18} strokeWidth={1.8} />
          </Link>

          <div>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
        </div>

        <div className="product-form-actions">
          <button
            className="product-form-secondary-action"
            type="button"
            onClick={resetForm}
            disabled={isSaving}
          >
            <RotateCcw size={16} />
            <span>Reinitialiser</span>
          </button>
          <button
            className="product-form-secondary-action"
            type="button"
            onClick={() => navigate('/admin/categories')}
            disabled={isSaving}
          >
            Annuler
          </button>
          <button
            className="product-form-primary-action"
            type="button"
            onClick={saveCategory}
            disabled={isSaving}
          >
            <Save size={16} />
            <span>
              {isSaving
                ? 'Enregistrement...'
                : mode === 'edit'
                  ? 'Mettre a jour'
                  : 'Creer'}
            </span>
          </button>
        </div>
      </section>

      {errors.length > 0 ? (
        <div className="product-form-alert product-form-alert--error">
          {errors.map((error) => (
            <span key={error}>{error}</span>
          ))}
        </div>
      ) : null}

      {notice ? (
        <div className="product-form-alert product-form-alert--success">
          {notice}
        </div>
      ) : null}

      <section className="product-form-layout">
        <div className="product-form-main-column">
          <div className="dashboard-card product-form-card">
            <div className="product-form-card__header">
              <div className="product-form-card__icon">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <h2>Informations generales</h2>
                <p>Nom, slug, statut et description de la categorie.</p>
              </div>
            </div>

            <div className="product-form-grid">
              <label className="product-form-field">
                <span>
                  Nom de la categorie<strong>*</strong>
                </span>
                <div className="product-form-input-wrap">
                  <input
                    name="name"
                    value={form.name}
                    onChange={updateField}
                    placeholder="Chaussures"
                  />
                </div>
              </label>

              <label className="product-form-field">
                <span>
                  Slug<strong>*</strong>
                </span>
                <div className="product-form-input-wrap">
                  <input
                    name="slug"
                    value={form.slug}
                    onChange={updateField}
                    placeholder="chaussures"
                  />
                </div>
              </label>

              <label className="product-form-field">
                <span>Statut</span>
                <div className="product-form-select">
                  <select
                    name="statusType"
                    value={form.statusType}
                    onChange={updateField}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                  <ChevronDown size={16} />
                </div>
              </label>

              <label className="product-form-field product-form-field--wide">
                <span>
                  Description<strong>*</strong>
                </span>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={updateField}
                  placeholder="Decrivez le contenu de cette categorie."
                />
              </label>
            </div>
          </div>
        </div>

        <aside className="product-form-side-column">
          <div className="dashboard-card product-form-card">
            <div className="product-form-card__header product-form-card__header--compact">
              <h2>Image</h2>
            </div>

            <label className="product-form-upload">
              <UploadCloud size={26} strokeWidth={1.6} />
              <strong>Ajouter une image</strong>
              <span>JPG, PNG ou WebP</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={changeImage}
              />
            </label>

            <div className="product-form-preview-grid">
              <div
                className={
                  preview
                    ? 'product-form-preview'
                    : 'product-form-preview product-form-preview--empty'
                }
              >
                {preview ? (
                  <img src={preview} alt={form.name || 'Categorie'} />
                ) : (
                  <>
                    <ImagePlus size={22} />
                    <span>Apercu</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </aside>
      </section>
    </main>
  )
}
