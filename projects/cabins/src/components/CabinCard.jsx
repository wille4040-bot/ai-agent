import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { formatPrice } from '../lib/format.js'

export default function CabinCard({ cabin }) {
  const { t, i18n } = useTranslation()

  return (
    <li className="cabin-card">
      <Link to={`/cabins/${cabin.id}`} className="cabin-thumb" aria-hidden="true">
        <span>{t('common.comingSoon')}</span>
      </Link>
      <div className="cabin-body">
        <h3 className="cabin-name">
          <Link to={`/cabins/${cabin.id}`}>{cabin.name}</Link>
        </h3>
        <ul className="cabin-meta">
          <li>{t('cabins.beds', { count: cabin.beds })}</li>
          <li>{t('cabins.distanceLabel', { meters: cabin.distanceToWater })}</li>
        </ul>
        <p className="cabin-price">
          <strong>{formatPrice(cabin.pricePerWeek, i18n.language)}</strong>{' '}
          <span className="muted">{t('cabins.perWeek')}</span>
        </p>
        <Link to={`/cabins/${cabin.id}`} className="btn btn-outline">
          {t('common.viewDetails')}
        </Link>
      </div>
    </li>
  )
}
