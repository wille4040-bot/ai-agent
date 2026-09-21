import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function BookingSuccess() {
  const { t } = useTranslation()
  return (
    <section className="container section booking-result">
      <div className="result-icon result-ok">✓</div>
      <h1>{t('booking.success.title')}</h1>
      <p className="lead">{t('booking.success.body')}</p>
      <Link to="/" className="btn btn-primary">
        {t('booking.success.home')}
      </Link>
    </section>
  )
}
