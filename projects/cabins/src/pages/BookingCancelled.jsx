import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function BookingCancelled() {
  const { t } = useTranslation()
  return (
    <section className="container section booking-result">
      <div className="result-icon result-cancel">×</div>
      <h1>{t('booking.cancelled.title')}</h1>
      <p className="lead">{t('booking.cancelled.body')}</p>
      <Link to="/booking" className="btn btn-primary">
        {t('booking.cancelled.retry')}
      </Link>
    </section>
  )
}
