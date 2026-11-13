import { TrendingUp } from 'lucide-react'

export default function StatCard({
  icon: Icon,
  value,
  label,
  growth,
}) {
  return (
    <div className="stat-card">
      <div className="stat-card__icon">
        <Icon size={28} strokeWidth={1.6} />
      </div>

      <div className="stat-card__content">
        <div className="stat-card__top">
          <strong>{value}</strong>

          <span className="stat-card__growth">
            <TrendingUp size={16} />
            {growth}
          </span>
        </div>

        <div className="stat-card__bottom">
          <span>{label}</span>
          <small>vs mois dernier</small>
        </div>
      </div>
    </div>
  )
}