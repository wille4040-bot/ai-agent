import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { cabins } from '../data/cabins.js'

export default function Cabins() {
  const { t } = useTranslation()

  return (
    <section className="container section">
      <h1>{t('cabins.title')}</h1>
      <p className="lead">{t('cabins.intro')}</p>

      <ul className="cabin-grid">
        {cabins.map((cabin) => (
          <li key={cabin.id} className="cabin-card">
            <div className="cabin-thumb" aria-hidden="true">
              <span>{t('common.comingSoon')}</span>
            </div>
            <div className="cabin-body">
              <h2 className="cabin-name">{cabin.name}</h2>
              <p className="cabin-price">
                {cabin.price
                  ? `${cabin.price} € / ${t('cabins.perNight')}`
                  : t('cabins.priceTbd')}
              </p>
              <Link to={`/cabins/${cabin.id}`} className="btn btn-outline">
                {t('common.viewDetails')}
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
