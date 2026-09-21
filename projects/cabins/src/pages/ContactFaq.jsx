import { useTranslation } from 'react-i18next'

import Seo from '../components/Seo.jsx'

export default function ContactFaq() {
  const { t } = useTranslation()
  // returnObjects ger tillbaka arrayen med frågor/svar från översättningsfilen.
  const faq = t('contact.faq', { returnObjects: true })
  const items = Array.isArray(faq) ? faq : []

  return (
    <section className="container section">
      <Seo title={t('seo.contact.title')} description={t('seo.contact.description')} />
      <h1>{t('contact.title')}</h1>

      <h2>{t('contact.contactTitle')}</h2>
      <p className="lead">{t('contact.contactBody')}</p>

      <h2>{t('contact.faqTitle')}</h2>
      <div className="faq">
        {items.map((item, i) => (
          <details key={i} className="faq-item">
            <summary>{item.q}</summary>
            <p>{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  )
}
