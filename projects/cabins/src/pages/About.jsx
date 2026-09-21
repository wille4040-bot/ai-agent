import { useTranslation } from 'react-i18next'

import Seo from '../components/Seo.jsx'

export default function About() {
  const { t } = useTranslation()
  const sections = t('about.sections', { returnObjects: true })

  return (
    <section className="container section prose">
      <Seo title={t('seo.about.title')} description={t('seo.about.description')} />
      <h1>{t('about.title')}</h1>
      <p className="lead">{t('about.lead')}</p>

      {(Array.isArray(sections) ? sections : []).map((s, i) => (
        <div key={i}>
          <h2>{s.heading}</h2>
          <p>{s.body}</p>
        </div>
      ))}
    </section>
  )
}
