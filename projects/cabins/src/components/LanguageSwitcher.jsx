import { useTranslation } from 'react-i18next'

import { LANGUAGES } from '../i18n.js'

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation()
  const current = i18n.resolvedLanguage || i18n.language

  return (
    <div className="lang-switcher" role="group" aria-label={t('common.language')}>
      {LANGUAGES.map(({ code, label }) => (
        <button
          key={code}
          type="button"
          className={'lang-btn' + (current === code ? ' is-active' : '')}
          aria-pressed={current === code}
          onClick={() => i18n.changeLanguage(code)}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
