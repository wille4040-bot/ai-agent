import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const STORAGE_KEY = 'cabins.cookieConsent'

// GDPR/cookie-notis. Vi använder bara nödvändig lokal lagring, så detta är en
// informationsnotis (ingen spårning att ge samtycke till).
export default function CookieNotice() {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) !== 'ok') setVisible(true)
    } catch {
      setVisible(true)
    }
  }, [])

  const accept = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'ok')
    } catch {
      // Ignorera om lagring inte är tillgänglig.
    }
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="cookie-notice" role="region" aria-label={t('legal.privacy')}>
      <p className="cookie-text">
        {t('legal.cookieText')}{' '}
        <Link to="/datenschutz">{t('legal.cookieMore')}</Link>
      </p>
      <button type="button" className="btn btn-primary cookie-btn" onClick={accept}>
        {t('legal.cookieAccept')}
      </button>
    </div>
  )
}
