import { useTranslation } from 'react-i18next'

// Liten markör för innehåll som ännu inte är ifyllt.
export default function Placeholder({ text }) {
  const { t } = useTranslation()
  return <p className="placeholder">{text || t('common.placeholder')}</p>
}
