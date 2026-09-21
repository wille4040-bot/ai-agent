import { useTranslation } from 'react-i18next'

export default function Footer() {
  const { t } = useTranslation()
  const year = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="footer-inner">
        <span>
          © {year} {t('site.name')}
        </span>
        <span className="footer-muted">{t('footer.rights')}</span>
      </div>
    </footer>
  )
}
