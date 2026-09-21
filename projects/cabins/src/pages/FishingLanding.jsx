import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { cabinsWithAny } from '../data/cabins.js'
import CabinCard from '../components/CabinCard.jsx'
import Seo from '../components/Seo.jsx'

export default function FishingLanding() {
  const { t } = useTranslation()
  const points = t('landing.fishing.points', { returnObjects: true })
  // Stugor med båt eller direkt sjötillgång passar för fiske.
  const cabins = cabinsWithAny('boat', 'lakeAccess')

  return (
    <>
      <Seo title={t('seo.fishing.title')} description={t('seo.fishing.description')} />
      <section className="hero">
        <div className="container">
          <p className="hero-eyebrow">{t('nav.fishing')}</p>
          <h1>{t('landing.fishing.h1')}</h1>
          <p className="hero-sub">{t('landing.fishing.intro')}</p>
          <Link to="/booking" className="btn btn-primary">
            {t('landing.fishing.cta')}
          </Link>
        </div>
      </section>

      <section className="container section">
        <ul className="feature-grid">
          {(Array.isArray(points) ? points : []).map((p, i) => (
            <li key={i} className="feature-card">
              <p style={{ margin: 0 }}>{p}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="section section-alt">
        <div className="container">
          <h2 className="section-title">{t('landing.fishing.cabinsTitle')}</h2>
          <p className="lead">{t('landing.fishing.cabinsIntro')}</p>
          <ul className="cabin-grid">
            {cabins.map((cabin) => (
              <CabinCard key={cabin.id} cabin={cabin} />
            ))}
          </ul>
        </div>
      </section>
    </>
  )
}
