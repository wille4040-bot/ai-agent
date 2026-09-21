import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { cabinsWithAny } from '../data/cabins.js'
import CabinCard from '../components/CabinCard.jsx'
import Seo from '../components/Seo.jsx'

export default function DogsLanding() {
  const { t } = useTranslation()
  const points = t('landing.dogs.points', { returnObjects: true })
  const cabins = cabinsWithAny('pets')

  return (
    <>
      <Seo title={t('seo.dogs.title')} description={t('seo.dogs.description')} />
      <section className="hero">
        <div className="container">
          <p className="hero-eyebrow">{t('nav.dogs')}</p>
          <h1>{t('landing.dogs.h1')}</h1>
          <p className="hero-sub">{t('landing.dogs.intro')}</p>
          <Link to="/booking" className="btn btn-primary">
            {t('landing.dogs.cta')}
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
          <h2 className="section-title">{t('landing.dogs.cabinsTitle')}</h2>
          <p className="lead">{t('landing.dogs.cabinsIntro')}</p>
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
