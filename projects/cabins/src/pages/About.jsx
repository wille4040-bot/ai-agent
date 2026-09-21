import { useTranslation } from 'react-i18next'

import Seo from '../components/Seo.jsx'

export default function About() {
  const { t } = useTranslation()

  return (
    <section className="container section">
      <Seo title={t('seo.about.title')} description={t('seo.about.description')} />
      <h1>{t('about.title')}</h1>
      <p className="lead">{t('about.body')}</p>
    </section>
  )
}
