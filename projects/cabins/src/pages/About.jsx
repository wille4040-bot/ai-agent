import { useTranslation } from 'react-i18next'

export default function About() {
  const { t } = useTranslation()

  return (
    <section className="container section">
      <h1>{t('about.title')}</h1>
      <p className="lead">{t('about.body')}</p>
    </section>
  )
}
