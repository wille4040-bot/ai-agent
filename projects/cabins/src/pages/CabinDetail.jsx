import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { getCabin } from '../data/cabins.js'
import Placeholder from '../components/Placeholder.jsx'

export default function CabinDetail() {
  const { id } = useParams()
  const { t } = useTranslation()
  const cabin = getCabin(id)

  if (!cabin) {
    return (
      <section className="container section">
        <h1>{t('cabinDetail.notFoundTitle')}</h1>
        <p className="lead">{t('cabinDetail.notFound')}</p>
        <Link to="/cabins" className="btn btn-outline">
          ← {t('nav.cabins')}
        </Link>
      </section>
    )
  }

  return (
    <section className="container section">
      <Link to="/cabins" className="back-link">
        ← {t('common.back')}
      </Link>

      <h1>{cabin.name}</h1>
      <div className="detail-hero" aria-hidden="true">
        <span>{t('common.comingSoon')}</span>
      </div>

      <h2>{t('cabinDetail.descriptionTitle')}</h2>
      <Placeholder />

      <h2>{t('cabinDetail.equipmentTitle')}</h2>
      <Placeholder />

      <button type="button" className="btn btn-primary" disabled>
        {t('cabinDetail.bookCta')}
      </button>
    </section>
  )
}
