import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  RotateCcw,
  Save,
  TicketPercent,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import AdminHeader from '../../components/layout/AdminHeader.jsx'
import AdminSidebar from '../../components/layout/AdminSidebar.jsx'
import {
  getAdminApiErrorMessages,
  getPromotion,
  upsertPromotion,
} from '../../services/adminService.js'

const typeOptions = [
  ['percentage', 'Pourcentage'],
  ['fixed', 'Montant fixe'],
  ['free_shipping', 'Livraison'],
]

const statusOptions = [
  ['inactive', 'Brouillon'],
  ['scheduled', 'Planifiee'],
  ['active', 'Active'],
  ['expired', 'Expiree'],
]

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
        <select name={name} value={value} onChange={onChange}>
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
          onChange={onChange}
        />
      </div>
    </label>
  )
}

function dateInputValue(value) {
  if (!value) {
    return ''
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return String(value).slice(0, 10)
  }

  return date.toISOString().slice(0, 10)
}

function createFormFromPromotion(promotion) {
  return {
    name: promotion.name || promotion.title || '',
    code: promotion.code || '',
    apiType: promotion.apiType || 'percentage',
    value: promotion.value ? String(promotion.value) : '',
    minimumAmount: promotion.minimumAmount
      ? String(promotion.minimumAmount)
      : '',
    maxUses:
      promotion.maxUses === null || promotion.maxUses === undefined
        ? ''
        : String(promotion.maxUses),
    startDate: dateInputValue(promotion.startDate),
    endDate: dateInputValue(promotion.endDate),
    statusClass:
      promotion.status === 'scheduled'
        ? 'scheduled'
        : promotion.status || 'inactive',
  }
}

export default function PromotionEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [promotion, setPromotion] = useState(null)
  const [form, setForm] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState([])
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let isActive = true

    async function loadPromotion() {
      setLoading(true)
      setErrors([])

      try {
        const nextPromotion = await getPromotion(id)

        if (isActive) {
          setPromotion(nextPromotion)
          setForm(createFormFromPromotion(nextPromotion))
        }
      } catch (error) {
        if (isActive) {
          setPromotion(null)
          setErrors(getAdminApiErrorMessages(error))
        }
      } finally {
        if (isActive) {
          setLoading(false)
        }
      }
    }

    loadPromotion()

    return () => {
      isActive = false
    }
  }, [id])

  const updateField = (event) => {
    const { name, value } = event.target

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
      ...(name === 'apiType' && value === 'free_shipping'
        ? {
            value: '',
          }
        : {}),
    }))
    setNotice('')
  }

  const resetForm = () => {
    setForm(createFormFromPromotion(promotion))
    setErrors([])
    setNotice('Modifications annulees.')
  }

  const savePromotion = async () => {
    const nextErrors = []

    if (!form.name.trim()) {
      nextErrors.push('Le nom de la promotion est requis.')
    }

    if (!form.code.trim()) {
      nextErrors.push('Le code promo est requis.')
    }

    if (
      form.apiType !== 'free_shipping' &&
      Number(form.value) <= 0
    ) {
      nextErrors.push('La reduction doit etre superieure a 0.')
    }

    setErrors(nextErrors)

    if (nextErrors.length > 0 || isSaving) {
      return
    }

    setIsSaving(true)

    try {
      const savedPromotion = await upsertPromotion({
        id: promotion.id,
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        apiType: form.apiType,
        value: form.value,
        minimumAmount: form.minimumAmount,
        maxUses: form.maxUses,
        startDate: form.startDate,
        endDate: form.endDate,
        statusClass: form.statusClass,
        productIds: promotion.productIds,
      })

      setPromotion(savedPromotion)
      setForm(createFormFromPromotion(savedPromotion))
      setNotice('Promotion mise a jour en base.')
    } catch (error) {
      setNotice('')
      setErrors(getAdminApiErrorMessages(error))
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="admin-layout">
        <AdminSidebar />

        <div className="admin-main">
          <AdminHeader searchPlaceholder="Rechercher une promotion..." />

          <main className="admin-dashboard promotion-create-page">
            <section className="promotion-create-heading">
              <div>
                <h1>Chargement de la promotion</h1>
                <p>Lecture des donnees depuis la base.</p>
              </div>
            </section>
          </main>
        </div>
      </div>
    )
  }

  if (!promotion || !form) {
    return (
      <div className="admin-layout">
        <AdminSidebar />

        <div className="admin-main">
          <AdminHeader searchPlaceholder="Rechercher une promotion..." />

          <main className="admin-dashboard promotion-create-page">
            <section className="promotion-create-heading">
              <div>
                <h1>Promotion introuvable</h1>
                <p>
                  {errors.join(' ') ||
                    'Aucune promotion en base ne correspond a cet identifiant.'}
                </p>
              </div>
              <Link className="promotion-create-primary" to="/admin/promotions">
                Retour aux promotions
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
        <AdminHeader searchPlaceholder="Rechercher une promotion..." />

        <main className="admin-dashboard promotion-create-page">
          <section className="promotion-create-breadcrumb">
            <Link to="/admin">Accueil</Link>
            <ChevronRight size={14} strokeWidth={1.7} />
            <Link to="/admin/promotions">Promotions</Link>
            <ChevronRight size={14} strokeWidth={1.7} />
            <strong>Modifier</strong>
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
                <h1>Modifier une promotion</h1>
                <p>{promotion.title}</p>
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
                onClick={resetForm}
                disabled={isSaving}
              >
                <RotateCcw size={16} strokeWidth={1.8} />
                <span>Reinitialiser</span>
              </button>
              <button
                className="promotion-create-primary"
                type="button"
                onClick={savePromotion}
                disabled={isSaving}
              >
                <Save size={16} strokeWidth={1.8} />
                <span>{isSaving ? 'Enregistrement...' : 'Enregistrer'}</span>
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
              <section className="dashboard-card promotion-create-card">
                <div className="promotion-create-card__header">
                  <div className="promotion-create-card__icon">
                    <TicketPercent size={20} strokeWidth={1.7} />
                  </div>
                  <div>
                    <h2>Informations promotion</h2>
                    <p>Les changements sont conserves en base.</p>
                  </div>
                </div>

                <div className="promotion-create-form-grid">
                  <TextField
                    label="Nom"
                    name="name"
                    value={form.name}
                    onChange={updateField}
                    required
                  />
                  <TextField
                    label="Code"
                    name="code"
                    value={form.code}
                    onChange={updateField}
                    required
                  />
                  <SelectField
                    label="Type"
                    name="apiType"
                    value={form.apiType}
                    options={typeOptions}
                    onChange={updateField}
                  />
                  <SelectField
                    label="Statut"
                    name="statusClass"
                    value={form.statusClass}
                    options={statusOptions}
                    onChange={updateField}
                  />
                  <TextField
                    label="Reduction"
                    name="value"
                    type="number"
                    value={form.value}
                    onChange={updateField}
                    required={form.apiType !== 'free_shipping'}
                  />
                  <TextField
                    label="Montant minimum"
                    name="minimumAmount"
                    type="number"
                    value={form.minimumAmount}
                    onChange={updateField}
                  />
                  <TextField
                    label="Limite d'utilisation"
                    name="maxUses"
                    type="number"
                    value={form.maxUses}
                    onChange={updateField}
                  />
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
              </section>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
