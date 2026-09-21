import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import LanguageSwitcher from './LanguageSwitcher.jsx'

const links = [
  { to: '/', key: 'nav.home', end: true },
  { to: '/cabins', key: 'nav.cabins' },
  { to: '/equipment', key: 'nav.equipment' },
  { to: '/about', key: 'nav.about' },
  { to: '/contact', key: 'nav.contact' },
]

export default function Navbar() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <NavLink to="/" className="brand" onClick={() => setOpen(false)}>
          {t('site.name')}
        </NavLink>

        <button
          type="button"
          className="nav-toggle"
          aria-expanded={open}
          aria-label="Menu"
          onClick={() => setOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>

        <nav className={'nav-links' + (open ? ' is-open' : '')}>
          {links.map(({ to, key, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => 'nav-link' + (isActive ? ' is-active' : '')}
              onClick={() => setOpen(false)}
            >
              {t(key)}
            </NavLink>
          ))}
          <LanguageSwitcher />
        </nav>
      </div>
    </header>
  )
}
