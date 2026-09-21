import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function NotFound() {
  const { t } = useTranslation()

  return (
    <section className="container section">
      <h1>404</h1>
      <p className="lead">{t('common.placeholder')}</p>
      <Link to="/" className="btn btn-outline">
        ← {t('nav.home')}
      </Link>
    </section>
  )
}
