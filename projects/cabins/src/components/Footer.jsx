import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const exploreLinks = [
  { to: '/cabins', key: 'nav.cabins' },
  { to: '/angeln', key: 'nav.fishing' },
  { to: '/hunde', key: 'nav.dogs' },
  { to: '/equipment', key: 'nav.equipment' },
  { to: '/contact', key: 'nav.contact' },
]

export default function Footer() {
  const { t } = useTranslation()
  const year = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <span className="footer-name">{t('site.name')}</span>
          <span className="footer-muted">{t('site.tagline')}</span>
        </div>

        <nav className="footer-links" aria-label={t('footer.exploreTitle')}>
          <span className="footer-heading">{t('footer.exploreTitle')}</span>
          {exploreLinks.map(({ to, key }) => (
            <Link key={to} to={to} className="footer-link">
              {t(key)}
            </Link>
          ))}
        </nav>
      </div>

      <div className="footer-bottom">
        <span>
          © {year} {t('site.name')}
        </span>
        <span className="footer-muted">{t('footer.rights')}</span>
      </div>
    </footer>
  )
}
