import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function Home() {
  const { t } = useTranslation()

  return (
    <>
      <section className="hero">
        <div className="container">
          <p className="hero-eyebrow">{t('site.tagline')}</p>
          <h1>{t('home.title')}</h1>
          <p className="hero-sub">{t('home.subtitle')}</p>
          <Link to="/cabins" className="btn btn-primary">
            {t('home.ctaCabins')}
          </Link>
        </div>
      </section>

      <section className="container section">
        <p className="lead">{t('home.intro')}</p>
      </section>
    </>
  )
}
