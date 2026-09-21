import { useTranslation } from 'react-i18next'

import Seo from '../components/Seo.jsx'

export default function PrivacyPolicy() {
  const { t } = useTranslation()
  const sections = t('privacyPage.sections', { returnObjects: true })

  return (
    <section className="container section prose">
      <Seo title={t('seo.privacy.title')} description={t('seo.privacy.description')} />
      <h1>{t('privacyPage.title')}</h1>
      <p className="lead">{t('privacyPage.intro')}</p>

      {(Array.isArray(sections) ? sections : []).map((s, i) => (
        <div key={i}>
          <h2>{s.heading}</h2>
          <p>{s.body}</p>
        </div>
      ))}

      <p className="prose-note">{t('privacyPage.note')}</p>
    </section>
  )
}
