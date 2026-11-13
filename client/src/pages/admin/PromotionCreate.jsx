import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Percent,
  RotateCcw,
  Save,
  ShoppingBag,
  Tag,
  Target,
  TicketPercent,
  Truck,
  Users,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import AdminHeader from '../../components/layout/AdminHeader.jsx'
import AdminSidebar from '../../components/layout/AdminSidebar.jsx'
import {
  getAdminApiErrorMessages,
  getCategories,
  getProducts,
  upsertPromotion,
} from '../../services/adminService.js'

const promotionTypes = [
  ['code', 'Code promo'],
  ['discount', 'Reduction'],
  ['shipping', 'Livraison gratuite'],
]

const discountModes = [
  ['percent', 'Pourcentage'],
  ['fixed', 'Montant fixe'],
]

const statuses = [
  ['draft', 'Brouillon'],
  ['scheduled', 'Planifiee'],
  ['active', 'Active'],
]

const targetOptions = [
  ['all', 'Tous les produits'],
  ['products', 'Produits specifiques'],
  ['categories', 'Categories specifiques'],
]

const initialPromotion = {
  name: '',
  code: '',
  description: '',
  type: 'code',
  discountMode: 'percent',
  discountValue: '',
  maxDiscount: '',
  minOrderAmount: '',
  startDate: '',
  endDate: '',
  maxUses: '',
  usesPerCustomer: '1',
  targetType: 'all',
  status: 'draft',
}

function SelectField({
  label,
  name,
  value,
  options,
  onChange,
}) {
  return (
    <label className="promotion-create-field">
      <span>{label}</span>

      <div className="promotion-create-select">
        <select
          name={name}
          value={value}
          onChange={onChange}
        >
          {options.map(([optionValue, optionLabel]) => (
            <option value={optionValue} key={optionValue}>
              {optionLabel}
            </option>
          ))}
        </select>
        <ChevronDown size={16} strokeWidth={1.7} />
      </div>
    </label>
  )
}

function TextField({
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
    <label className="promotion-create-field">
      <span>
        {label}
        {required ? <strong>*</strong> : null}
      </span>

      <div className="promotion-create-input">
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

function PromotionCard({
  icon: Icon,
  title,
  subtitle,
  children,
}) {
  return (
    <section className="dashboard-card promotion-create-card">
      <div className="promotion-create-card__header">
        <div className="promotion-create-card__icon">
          <Icon size={20} strokeWidth={1.7} />
        </div>

        <div>
          <h2>{title}</h2>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
      </div>

      {children}
    </section>
  )
}

function getApiType(form) {
  if (form.type === 'shipping') {
    return 'free_shipping'
  }

  return form.discountMode === 'fixed'
    ? 'fixed'
    : 'percentage'
}

export default function PromotionCreate() {
  const navigate = useNavigate()
  const [form, setForm] = useState(initialPromotion)
  const [selectedProducts, setSelectedProducts] = useState([])
  const [selectedCategories, setSelectedCategories] = useState([])
  const [productOptions, setProductOptions] = useState([])
  const [categoryOptions, setCategoryOptions] = useState([])
  const [errors, setErrors] = useState([])
  const [notice, setNotice] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    let isActive = true

    async function loadTargets() {
      try {
        const [
          products,
          categories,
        ] = await Promise.all([
          getProducts(),
          getCategories(),
        ])

        if (isActive) {
          setProductOptions(products)
          setCategoryOptions(categories)
        }
      } catch (error) {
        if (isActive) {
          setErrors(getAdminApiErrorMessages(error))
        }
      }
    }

    loadTargets()

    return () => {
      isActive = false
    }
  }, [])

  const selectedTypeLabel = useMemo(
    () =>
      promotionTypes.find(([value]) => value === form.type)?.[1] ||
      'Code promo',
    [form.type],
  )

  const updateField = (event) => {
    const { name, value } = event.target

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
      ...(name === 'type' && value === 'shipping'
        ? {
            discountValue: '',
            maxDiscount: '',
          }
        : {}),
    }))
    setNotice('')
  }

  const toggleItem = (item, setter) => {
    setter((currentItems) =>
      currentItems.includes(item)
        ? currentItems.filter((currentItem) => currentItem !== item)
        : [...currentItems, item],
    )
    setNotice('')
  }

  const validatePromotion = (candidate) => {
    const nextErrors = []
    const start = new Date(candidate.startDate)
    const end = new Date(candidate.endDate)

    if (!candidate.name.trim()) {
      nextErrors.push('Le nom de la promotion est requis.')
    }

    if (!candidate.code.trim()) {
      nextErrors.push('Le code promo est requis.')
    }

    if (
      candidate.type !== 'shipping' &&
      (!Number(candidate.discountValue) ||
        Number(candidate.discountValue) <= 0)
    ) {
      nextErrors.push('La valeur de reduction doit etre superieure a 0.')
    }

    if (
      candidate.startDate &&
      candidate.endDate &&
      end < start
    ) {
      nextErrors.push('La date de fin ne peut pas etre avant la date de debut.')
    }

    if (
      candidate.targetType === 'products' &&
      selectedProducts.length === 0
    ) {
      nextErrors.push('Selectionnez au moins un produit concerne.')
    }

    if (candidate.targetType === 'categories') {
      nextErrors.push(
        'Les promotions par categorie ne sont pas supportees par le schema actuel.',
      )
    }

    setErrors(nextErrors)
    return nextErrors.length === 0
  }

  const submitPromotion = async (nextStatus) => {
    if (isSaving) {
      return
    }

    const nextForm = {
      ...form,
      status: nextStatus,
    }

    if (!validatePromotion(nextForm)) {
      setNotice('')
      return
    }

    setIsSaving(true)
    setErrors([])

    try {
      await upsertPromotion({
        name: nextForm.name.trim(),
        code: nextForm.code.trim().toUpperCase(),
        apiType: getApiType(nextForm),
        value: nextForm.discountValue,
        minimumAmount: nextForm.minOrderAmount,
        maxUses: nextForm.maxUses,
        startDate: nextForm.startDate,
        endDate: nextForm.endDate,
        statusClass: nextStatus,
        productIds:
          nextForm.targetType === 'products'
            ? selectedProducts
            : [],
      })

      setNotice('Promotion creee en base.')
      navigate('/admin/promotions')
    } catch (error) {
      setNotice('')
      setErrors(getAdminApiErrorMessages(error))
    } finally {
      setIsSaving(false)
    }
  }

  const resetForm = () => {
    setForm(initialPromotion)
    setSelectedProducts([])
    setSelectedCategories([])
    setErrors([])
    setNotice('Formulaire reinitialise.')
  }

  return (
    <div className="admin-layout">
      <AdminSidebar />

      <div className="admin-main">
        <AdminHeader searchPlaceholder="Rechercher une promotion, un code, un produit..." />

        <main className="admin-dashboard promotion-create-page">
          <section className="promotion-create-breadcrumb">
            <Link to="/admin">Accueil</Link>
            <ChevronRight size={14} strokeWidth={1.7} />
            <Link to="/admin/promotions">Promotions</Link>
            <ChevronRight size={14} strokeWidth={1.7} />
            <strong>Creer une promotion</strong>
          </section>

          <section className="promotion-create-heading">
            <div className="promotion-create-heading__title">
              <Link
                className="promotion-create-back"
                to="/admin/promotions"
                aria-label="Retour aux promotions"
              >
                <ArrowLeft size={18} strokeWidth={1.8} />
              </Link>

              <div>
                <h1>Creer une promotion</h1>
                <p>
                  Configurez votre offre promotionnelle, sa duree et ses
                  conditions.
                </p>
              </div>
            </div>

            <div className="promotion-create-actions">
              <button
                className="promotion-create-secondary"
                type="button"
                onClick={() => navigate('/admin/promotions')}
                disabled={isSaving}
              >
                Annuler
              </button>

              <button
                className="promotion-create-secondary"
                type="button"
                onClick={() => submitPromotion('draft')}
                disabled={isSaving}
              >
                <Save size={16} strokeWidth={1.8} />
                <span>{isSaving ? 'Enregistrement...' : 'Enregistrer comme brouillon'}</span>
              </button>

              <button
                className="promotion-create-primary"
                type="button"
                onClick={() =>
                  submitPromotion(
                    form.status === 'scheduled' ? 'scheduled' : 'active',
                  )
                }
                disabled={isSaving}
              >
                <CheckCircle2 size={16} strokeWidth={1.8} />
                <span>{isSaving ? 'Creation...' : 'Creer la promotion'}</span>
              </button>
            </div>
          </section>

          {errors.length > 0 ? (
            <div className="promotion-create-alert promotion-create-alert--error">
              {errors.map((error) => (
                <span key={error}>{error}</span>
              ))}
            </div>
          ) : null}

          {notice ? (
            <div className="promotion-create-alert promotion-create-alert--success">
              {notice}
            </div>
          ) : null}

          <section className="promotion-create-grid">
            <div className="promotion-create-main-column">
              <PromotionCard
                icon={TicketPercent}
                title="Informations generales"
                subtitle="Nommez l'offre et choisissez son fonctionnement."
              >
                <div className="promotion-create-form-grid">
                  <TextField
                    label="Nom de la promotion"
                    name="name"
                    value={form.name}
                    placeholder="Offre speciale sneakers"
                    onChange={updateField}
                    required
                  />

                  <TextField
                    label="Code promo"
                    name="code"
                    value={form.code}
                    placeholder="SNEAKERS20"
                    onChange={updateField}
                    required
                  />

                  <SelectField
                    label="Type de promotion"
                    name="type"
                    value={form.type}
                    options={promotionTypes}
                    onChange={updateField}
                  />

                  <SelectField
                    label="Statut"
                    name="status"
                    value={form.status}
                    options={statuses}
                    onChange={updateField}
                  />

                  <label className="promotion-create-field promotion-create-field--wide">
                    <span>Description</span>
                    <textarea
                      name="description"
                      value={form.description}
                      placeholder="Ajoutez une note interne claire pour cette offre."
                      onChange={updateField}
                    />
                  </label>
                </div>
              </PromotionCard>

              <PromotionCard
                icon={Percent}
                title="Reduction"
                subtitle={`Configuration pour : ${selectedTypeLabel}.`}
              >
                {form.type === 'shipping' ? (
                  <div className="promotion-create-shipping-note">
                    <Truck size={22} strokeWidth={1.7} />
                    <div>
                      <strong>Livraison gratuite</strong>
                      <span>
                        Aucun montant de reduction n'est necessaire pour ce
                        type d'offre.
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="promotion-create-form-grid promotion-create-form-grid--three">
                    <SelectField
                      label="Mode de reduction"
                      name="discountMode"
                      value={form.discountMode}
                      options={discountModes}
                      onChange={updateField}
                    />

                    <TextField
                      label="Valeur de reduction"
                      name="discountValue"
                      type="number"
                      value={form.discountValue}
                      suffix={form.discountMode === 'percent' ? '%' : 'DH'}
                      onChange={updateField}
                      required
                    />

                    <TextField
                      label="Reduction maximale"
                      name="maxDiscount"
                      type="number"
                      value={form.maxDiscount}
                      suffix="DH"
                      onChange={updateField}
                    />
                  </div>
                )}
              </PromotionCard>

              <PromotionCard
                icon={CalendarDays}
                title="Periode de validite"
                subtitle="Definissez quand l'offre commence et se termine."
              >
                <div className="promotion-create-form-grid">
                  <TextField
                    label="Date de debut"
                    name="startDate"
                    type="date"
                    value={form.startDate}
                    onChange={updateField}
                  />

                  <TextField
                    label="Date de fin"
                    name="endDate"
                    type="date"
                    value={form.endDate}
                    onChange={updateField}
                  />
                </div>
              </PromotionCard>
            </div>

            <aside className="promotion-create-side-column">
              <PromotionCard
                icon={Users}
                title="Conditions"
                subtitle="Limitez l'usage et le panier minimum."
              >
                <div className="promotion-create-stack">
                  <TextField
                    label="Nombre maximum d'utilisations"
                    name="maxUses"
                    type="number"
                    value={form.maxUses}
                    onChange={updateField}
                  />

                  <TextField
                    label="Utilisation par client"
                    name="usesPerCustomer"
                    type="number"
                    value={form.usesPerCustomer}
                    onChange={updateField}
                  />

                  <TextField
                    label="Montant minimum de commande"
                    name="minOrderAmount"
                    type="number"
                    value={form.minOrderAmount}
                    suffix="DH"
                    onChange={updateField}
                  />
                </div>
              </PromotionCard>

              <PromotionCard
                icon={Target}
                title="Produits concernes"
                subtitle="Ciblez l'offre selon le schema disponible."
              >
                <div className="promotion-create-target-tabs">
                  {targetOptions.map(([value, label]) => (
                    <button
                      className={form.targetType === value ? 'is-active' : ''}
                      type="button"
                      key={value}
                      onClick={() =>
                        updateField({
                          target: {
                            name: 'targetType',
                            value,
                          },
                        })
                      }
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {form.targetType === 'products' ? (
                  <div className="promotion-create-chip-list">
                    {productOptions.map((product) => (
                      <button
                        className={
                          selectedProducts.includes(product.id)
                            ? 'is-selected'
                            : ''
                        }
                        type="button"
                        key={product.id}
                        onClick={() =>
                          toggleItem(product.id, setSelectedProducts)
                        }
                      >
                        <ShoppingBag size={13} strokeWidth={1.7} />
                        <span>{product.name}</span>
                      </button>
                    ))}
                  </div>
                ) : null}

                {form.targetType === 'categories' ? (
                  <div className="promotion-create-chip-list">
                    {categoryOptions.map((category) => (
                      <button
                        className={
                          selectedCategories.includes(category.id)
                            ? 'is-selected'
                            : ''
                        }
                        type="button"
                        key={category.id}
                        onClick={() =>
                          toggleItem(category.id, setSelectedCategories)
                        }
                      >
                        <Tag size={13} strokeWidth={1.7} />
                        <span>{category.name}</span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </PromotionCard>

              <div className="promotion-create-footer-actions">
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={isSaving}
                >
                  <RotateCcw size={16} strokeWidth={1.8} />
                  <span>Reinitialiser</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    submitPromotion(
                      form.status === 'scheduled' ? 'scheduled' : 'active',
                    )
                  }
                  disabled={isSaving}
                >
                  {isSaving ? 'Creation...' : 'Creer la promotion'}
                </button>
              </div>
            </aside>
          </section>
        </main>
      </div>
    </div>
  )
}
