import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ImagePlus,
  Package,
  RotateCcw,
  Save,
  Tag,
  UploadCloud,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import {
  getAdminApiErrorMessages,
  getCategories,
  slugify,
  uploadAdminImages,
  upsertProduct,
} from '../../services/adminService.js'

const fallbackCategories = [
  'Chaussures',
  'Accessoires',
  'Vetements',
  'Vêtements',
]

const subcategoriesByCategory = {
  Chaussures: ['Baskets', 'Sneakers premium', 'Ville'],
  Accessoires: ['Sacs', 'Montres', 'Lunettes', 'Casquettes'],
  Vetements: ['Pulls', 'Vestes', 'Chemises'],
  Vêtements: ['Pulls', 'Vestes', 'Chemises'],
}

const stockStatuses = [
  ['in-stock', 'En stock'],
  ['low-stock', 'Stock faible'],
  ['out-stock', 'Rupture'],
]

const publicationStatuses = [
  ['draft', 'Brouillon'],
  ['published', 'Publié'],
  ['scheduled', 'Programmé'],
]

const visibilityOptions = [
  ['visible', 'Visible en boutique'],
  ['hidden', 'Masqué'],
]

const sizeOptions = ['XS', 'S', 'M', 'L', 'XL', '42']
const colorOptions = ['Noir', 'Ivoire', 'Olive', 'Beige', 'Blanc cassé']

function Field({
  label,
  name,
  value,
  onChange,
  type = 'text',
  placeholder,
  suffix,
  required = false,
}) {
  return (
    <label className="product-form-field">
      <span>
        {label}
        {required ? <strong>*</strong> : null}
      </span>

      <div className="product-form-input-wrap">
        <input
          name={name}
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={onChange}
        />

        {suffix ? <small>{suffix}</small> : null}
      </div>
    </label>
  )
}

function SelectField({
  label,
  name,
  value,
  onChange,
  options,
}) {
  return (
    <label className="product-form-field">
      <span>{label}</span>

      <div className="product-form-select">
        <select
          name={name}
          value={value}
          onChange={onChange}
        >
          {options.map((option) => {
            const optionValue = Array.isArray(option) ? option[0] : option
            const optionLabel = Array.isArray(option) ? option[1] : option

            return (
              <option value={optionValue} key={optionValue}>
                {optionLabel}
              </option>
            )
          })}
        </select>

        <ChevronDown size={16} strokeWidth={1.7} />
      </div>
    </label>
  )
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}) {
  return (
    <button
      className={
        checked
          ? 'product-form-toggle is-on'
          : 'product-form-toggle'
      }
      type="button"
      onClick={onChange}
    >
      <span />

      <div>
        <strong>{label}</strong>
        <small>{description}</small>
      </div>
    </button>
  )
}

function ProductForm({
  title,
  subtitle,
  breadcrumbCurrent,
  initialValues,
  initialImages,
  mode,
  productId,
}) {
  const navigate = useNavigate()
  const [formState, setFormState] = useState(initialValues)
  const [imagePreviews, setImagePreviews] = useState(initialImages)
  const [categoryOptions, setCategoryOptions] = useState([])
  const [errors, setErrors] = useState([])
  const [confirmation, setConfirmation] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    let isActive = true

    async function loadCategories() {
      try {
        const nextCategories = await getCategories()

        if (!isActive) {
          return
        }

        setCategoryOptions(nextCategories)
        setFormState((currentForm) => {
          if (currentForm.categoryId || nextCategories.length === 0) {
            return currentForm
          }

          const matchedCategory = nextCategories.find(
            (category) =>
              category.name === currentForm.category ||
              category.slug === currentForm.categorySlug,
          )

          if (!matchedCategory) {
            return currentForm
          }

          return {
            ...currentForm,
            categoryId: matchedCategory.id,
            category: matchedCategory.name,
            categorySlug: matchedCategory.slug,
          }
        })
      } catch (error) {
        if (isActive) {
          setErrors(getAdminApiErrorMessages(error))
        }
      }
    }

    loadCategories()

    return () => {
      isActive = false
    }
  }, [])

  useEffect(
    () => () => {
      imagePreviews.forEach((image) => {
        if (image.isObjectUrl) {
          URL.revokeObjectURL(image.src)
        }
      })
    },
    [imagePreviews],
  )

  const categoryChoices =
    categoryOptions.length > 0
      ? categoryOptions
      : fallbackCategories.map((category) => ({
          id: category,
          name: category,
          slug: slugify(category),
        }))
  const selectedCategory =
    categoryChoices.find(
      (category) =>
        String(category.id) === String(formState.categoryId) ||
        category.name === formState.category,
    ) || null
  const selectedCategoryName =
    selectedCategory?.name || formState.category
  const selectedCategoryValue =
    selectedCategory?.id ?? formState.categoryId ?? formState.category
  const subcategories =
    subcategoriesByCategory[selectedCategoryName] || []

  const updateField = (event) => {
    const { name, value } = event.target

    setFormState((currentForm) => ({
      ...currentForm,
      ...(name === 'categoryId'
        ? (() => {
            const nextCategory = categoryChoices.find(
              (category) => String(category.id) === String(value),
            )

            return {
              categoryId: value,
              category: nextCategory?.name || value,
              categorySlug: nextCategory?.slug || slugify(value),
              subcategory:
                subcategoriesByCategory[nextCategory?.name]?.[0] ||
                currentForm.subcategory ||
                '',
            }
          })()
        : {
            [name]: value,
          }),
    }))
    setConfirmation('')
  }

  const toggleValue = (fieldName, value) => {
    setFormState((currentForm) => {
      const currentValues = currentForm[fieldName]
      const nextValues = currentValues.includes(value)
        ? currentValues.filter((item) => item !== value)
        : [...currentValues, value]

      return {
        ...currentForm,
        [fieldName]: nextValues,
      }
    })
    setConfirmation('')
  }

  const toggleBoolean = (fieldName) => {
    setFormState((currentForm) => ({
      ...currentForm,
      [fieldName]: !currentForm[fieldName],
    }))
    setConfirmation('')
  }

  const handleImagesChange = (event) => {
    const files = Array.from(event.target.files || [])

    if (files.length === 0) {
      return
    }

    const nextImages = files.slice(0, 4).map((file) => ({
      id: `${file.name}-${file.lastModified}`,
      src: URL.createObjectURL(file),
      name: file.name,
      isObjectUrl: true,
      file,
    }))

    setImagePreviews(nextImages)
    setConfirmation('')
    event.target.value = ''
  }

  const validateForm = (candidateForm) => {
    const nextErrors = []
    const regularPrice = Number(candidateForm.regularPrice)
    const salePrice = Number(candidateForm.salePrice)

    if (!candidateForm.name.trim()) {
      nextErrors.push('Le nom du produit est requis.')
    }

    if (!candidateForm.sku.trim()) {
      nextErrors.push('Le SKU est requis.')
    }

    if (!candidateForm.description.trim()) {
      nextErrors.push('La description est requise.')
    }

    if (!regularPrice || regularPrice <= 0) {
      nextErrors.push('Le prix normal doit être supérieur à 0.')
    }

    if (
      candidateForm.salePrice &&
      (!salePrice || salePrice >= regularPrice)
    ) {
      nextErrors.push('Le prix promotionnel doit être inférieur au prix normal.')
    }

    if (Number(candidateForm.quantity) < 0) {
      nextErrors.push('La quantité ne peut pas être négative.')
    }

    setErrors(nextErrors)
    return nextErrors.length === 0
  }

  const submitForm = async (action) => {
    if (isSaving) {
      return
    }

    const nextForm =
      action === 'publish'
        ? {
            ...formState,
            publicationStatus: 'published',
          }
        : formState

    if (!validateForm(nextForm)) {
      setConfirmation('')
      return
    }

    setIsSaving(true)
    setErrors([])

    try {
      const existingImages = imagePreviews
        .filter((image) => !image.isObjectUrl)
        .map((image, index) => ({
          image_url: image.image_url || image.src,
          alt_text: image.alt_text || image.name || nextForm.name,
          is_primary: index === 0,
          sort_order: index,
        }))

      const filesToUpload = imagePreviews
        .filter((image) => image.isObjectUrl && image.file)
        .map((image) => image.file)

      const uploadedImages =
        filesToUpload.length > 0
          ? await uploadAdminImages(filesToUpload, 'products')
          : []

      const images = [
        ...existingImages,
        ...uploadedImages.map((image, index) => ({
          image_url: image.image_url,
          alt_text: image.alt_text || nextForm.name,
          is_primary: existingImages.length === 0 && index === 0,
          sort_order: existingImages.length + index,
        })),
      ].slice(0, 4)

      const savedProduct = await upsertProduct({
        ...nextForm,
        id: productId || nextForm.id,
        image: images[0]?.image_url || nextForm.image || '',
        images,
        fallback: nextForm.fallback || 'shoe',
      })

      setFormState(savedProduct)
      setImagePreviews(
        savedProduct.images.length > 0
          ? savedProduct.images.map((image, index) => ({
              id: `${savedProduct.id}-image-${index}`,
              src: image.image_url,
              image_url: image.image_url,
              name: image.alt_text || savedProduct.name,
              isObjectUrl: false,
            }))
          : savedProduct.image
            ? [
                {
                  id: `${savedProduct.id}-image`,
                  src: savedProduct.image,
                  image_url: savedProduct.image,
                  name: savedProduct.name,
                  isObjectUrl: false,
                },
              ]
            : [],
      )
      setConfirmation(
        action === 'publish'
          ? 'Produit enregistre en base et marque comme publie.'
          : 'Produit enregistre en base en brouillon.',
      )

      if (mode === 'create') {
        navigate('/admin/produits')
      }
    } catch (error) {
      setConfirmation('')
      setErrors(getAdminApiErrorMessages(error))
    } finally {
      setIsSaving(false)
    }
  }

  const resetForm = () => {
    setFormState(initialValues)
    setImagePreviews(initialImages)
    setErrors([])
    setConfirmation('Formulaire reinitialise.')
  }

  return (
    <main className="admin-dashboard product-form-page">
      <section className="product-form-breadcrumb">
        <Link to="/admin">Accueil</Link>
        <span>›</span>
        <Link to="/admin/produits">Produits</Link>
        <span>›</span>
        <strong>{breadcrumbCurrent}</strong>
      </section>

      <section className="product-form-heading">
        <div className="product-form-heading__title">
          <Link
            className="product-form-back"
            to="/admin/produits"
            aria-label="Retour aux produits"
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
            <RotateCcw size={16} strokeWidth={1.8} />
            <span>Réinitialiser</span>
          </button>

          <button
            className="product-form-secondary-action"
            type="button"
            onClick={() => submitForm('draft')}
            disabled={isSaving}
          >
            <Save size={16} strokeWidth={1.8} />
            <span>{isSaving ? 'Enregistrement...' : 'Enregistrer'}</span>
          </button>

          <button
            className="product-form-primary-action"
            type="button"
            onClick={() => submitForm('publish')}
            disabled={isSaving}
          >
            <CheckCircle2 size={16} strokeWidth={1.8} />
            <span>{isSaving ? 'Publication...' : 'Publier'}</span>
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

      {confirmation ? (
        <div className="product-form-alert product-form-alert--success">
          {confirmation}
        </div>
      ) : null}

      <section className="product-form-layout">
        <div className="product-form-main-column">
          <div className="dashboard-card product-form-card">
            <div className="product-form-card__header">
              <div className="product-form-card__icon">
                <Package size={20} strokeWidth={1.7} />
              </div>

              <div>
                <h2>Informations générales</h2>
                <p>Identité, référencement et description du produit.</p>
              </div>
            </div>

            <div className="product-form-grid">
              <Field
                label="Nom du produit"
                name="name"
                value={formState.name}
                placeholder="Baskets Nova Premium"
                onChange={updateField}
                required
              />

              <Field
                label="SKU"
                name="sku"
                value={formState.sku}
                placeholder="NV001"
                onChange={updateField}
                required
              />

              <SelectField
                label="Catégorie"
                name="categoryId"
                value={String(selectedCategoryValue || '')}
                options={categoryChoices.map((category) => [
                  String(category.id),
                  category.name,
                ])}
                onChange={updateField}
              />

              <SelectField
                label="Sous-catégorie"
                name="subcategory"
                value={formState.subcategory}
                options={subcategories}
                onChange={updateField}
              />

              <label className="product-form-field product-form-field--wide">
                <span>
                  Description
                  <strong>*</strong>
                </span>

                <textarea
                  name="description"
                  value={formState.description}
                  placeholder="Décrivez le style, les matériaux et les bénéfices."
                  onChange={updateField}
                />
              </label>
            </div>
          </div>

          <div className="dashboard-card product-form-card">
            <div className="product-form-card__header">
              <div className="product-form-card__icon">
                <Tag size={20} strokeWidth={1.7} />
              </div>

              <div>
                <h2>Prix</h2>
                <p>Tarification boutique et offre promotionnelle.</p>
              </div>
            </div>

            <div className="product-form-grid product-form-grid--three">
              <Field
                label="Prix normal"
                name="regularPrice"
                type="number"
                value={formState.regularPrice}
                suffix="DH"
                onChange={updateField}
                required
              />

              <Field
                label="Prix promotionnel"
                name="salePrice"
                type="number"
                value={formState.salePrice}
                suffix="DH"
                onChange={updateField}
              />

              <Field
                label="TVA"
                name="taxRate"
                type="number"
                value={formState.taxRate}
                suffix="%"
                onChange={updateField}
              />
            </div>
          </div>

          <div className="dashboard-card product-form-card">
            <div className="product-form-card__header">
              <div className="product-form-card__icon">
                <ImagePlus size={20} strokeWidth={1.7} />
              </div>

              <div>
                <h2>Images</h2>
                <p>Les fichiers sont envoyes au serveur avant l'enregistrement.</p>
              </div>
            </div>

            <div className="product-form-images">
              <label className="product-form-upload">
                <UploadCloud size={26} strokeWidth={1.6} />
                <strong>Ajouter des images</strong>
                <span>JPG, PNG ou WebP, jusqu'a 4 fichiers</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handleImagesChange}
                />
              </label>

              <div className="product-form-preview-grid">
                {imagePreviews.map((image) => (
                  <div
                    className="product-form-preview"
                    key={image.id}
                  >
                    <img src={image.src} alt={image.name} />
                    <span>{image.name}</span>
                  </div>
                ))}

                {imagePreviews.length === 0
                  ? [1, 2, 3].map((item) => (
                      <div
                        className="product-form-preview product-form-preview--empty"
                        key={item}
                      >
                        <ImagePlus size={22} strokeWidth={1.6} />
                        <span>Aperçu</span>
                      </div>
                    ))
                  : null}
              </div>
            </div>
          </div>
        </div>

        <aside className="product-form-side-column">
          <div className="dashboard-card product-form-card">
            <div className="product-form-card__header product-form-card__header--compact">
              <h2>Stock</h2>
            </div>

            <div className="product-form-stack">
              <Field
                label="Quantité"
                name="quantity"
                type="number"
                value={formState.quantity}
                onChange={updateField}
              />

              <SelectField
                label="Statut du stock"
                name="stockStatus"
                value={formState.stockStatus}
                options={stockStatuses}
                onChange={updateField}
              />

              <Field
                label="Seuil stock faible"
                name="lowStockThreshold"
                type="number"
                value={formState.lowStockThreshold}
                onChange={updateField}
              />
            </div>
          </div>

          <div className="dashboard-card product-form-card">
            <div className="product-form-card__header product-form-card__header--compact">
              <h2>Variantes</h2>
            </div>

            <div className="product-form-option-group">
              <strong>Tailles</strong>

              <div className="product-form-chips">
                {sizeOptions.map((size) => (
                  <button
                    className={
                      formState.sizes.includes(size)
                        ? 'is-selected'
                        : ''
                    }
                    type="button"
                    key={size}
                    onClick={() => toggleValue('sizes', size)}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div className="product-form-option-group">
              <strong>Couleurs</strong>

              <div className="product-form-chips">
                {colorOptions.map((color) => (
                  <button
                    className={
                      formState.colors.includes(color)
                        ? 'is-selected'
                        : ''
                    }
                    type="button"
                    key={color}
                    onClick={() => toggleValue('colors', color)}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="dashboard-card product-form-card">
            <div className="product-form-card__header product-form-card__header--compact">
              <h2>Publication</h2>
            </div>

            <div className="product-form-stack">
              <SelectField
                label="Statut"
                name="publicationStatus"
                value={formState.publicationStatus}
                options={publicationStatuses}
                onChange={updateField}
              />

              <SelectField
                label="Visibilité"
                name="visibility"
                value={formState.visibility}
                options={visibilityOptions}
                onChange={updateField}
              />

              <Toggle
                label="Produit en avant"
                description="Affiché dans les sélections admin."
                checked={formState.featured}
                onChange={() => toggleBoolean('featured')}
              />

              <Toggle
                label="Nouveauté"
                description="Signalé dans les nouveautés boutique."
                checked={formState.isNew}
                onChange={() => toggleBoolean('isNew')}
              />
            </div>
          </div>

          <div className="product-form-footer-actions">
            <button
              type="button"
              onClick={() => navigate('/admin/produits')}
              disabled={isSaving}
            >
              Annuler
            </button>

            <button
              type="button"
              onClick={() => submitForm('publish')}
              disabled={isSaving}
            >
              {isSaving
                ? 'Enregistrement...'
                : mode === 'edit'
                  ? 'Mettre à jour'
                  : 'Créer le produit'}
            </button>
          </div>
        </aside>
      </section>
    </main>
  )
}

export default ProductForm
