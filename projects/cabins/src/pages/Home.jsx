import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { cabins } from '../data/cabins.js'
import CabinCard from '../components/CabinCard.jsx'

export default function Home() {
  const { t } = useTranslation()
  const steps = t('home.concept.steps', { returnObjects: true })
  const points = t('home.why.points', { returnObjects: true })
  const examples = cabins.slice(0, 3)

  return (
    <>
      {/* Hero */}
      <section className="hero">
        <div className="container">
          <p className="hero-eyebrow">{t('home.hero.eyebrow')}</p>
          <h1>{t('home.hero.title')}</h1>
          <p className="hero-sub">{t('home.hero.subtitle')}</p>
          <div className="hero-actions">
            <Link to="/cabins" className="btn btn-primary">
              {t('home.hero.cta')}
            </Link>
            <a href="#concept" className="btn btn-ghost">
              {t('home.hero.ctaSecondary')}
            </a>
          </div>
        </div>
      </section>

      {/* Konzept: Hütte + Ausrüstung in einer Buchung */}
      <section id="concept" className="container section">
        <h2 className="section-title">{t('home.concept.title')}</h2>
        <p className="lead">{t('home.concept.intro')}</p>
        <ol className="steps">
          {(Array.isArray(steps) ? steps : []).map((step, i) => (
            <li key={i} className="step">
              <span className="step-num">{i + 1}</span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Beispiel-Hütten */}
      <section className="section section-alt">
        <div className="container">
          <div className="section-head">
            <div>
              <h2 className="section-title">{t('home.examples.title')}</h2>
              <p className="lead">{t('home.examples.intro')}</p>
            </div>
            <Link to="/cabins" className="btn btn-outline">
              {t('home.examples.all')}
            </Link>
          </div>
          <ul className="cabin-grid">
            {examples.map((cabin) => (
              <CabinCard key={cabin.id} cabin={cabin} />
            ))}
          </ul>
        </div>
      </section>

      {/* Warum Sommen */}
      <section className="container section">
        <h2 className="section-title">{t('home.why.title')}</h2>
        <p className="lead">{t('home.why.intro')}</p>
        <ul className="feature-grid">
          {(Array.isArray(points) ? points : []).map((point, i) => (
            <li key={i} className="feature-card">
              <h3>{point.title}</h3>
              <p>{point.text}</p>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}
