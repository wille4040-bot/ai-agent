import { useTranslation } from 'react-i18next'

import Seo from '../components/Seo.jsx'
import ContactForm from '../components/ContactForm.jsx'

export default function ContactFaq() {
  const { t } = useTranslation()
  const faq = t('contact.faq', { returnObjects: true })
  const items = Array.isArray(faq) ? faq : []

  const email = t('contact.info.email')
  const phone = t('contact.info.phone')

  return (
    <section className="container section">
      <Seo title={t('seo.contact.title')} description={t('seo.contact.description')} />
      <h1>{t('contact.title')}</h1>
      <p className="lead">{t('contact.intro')}</p>

      <div className="contact-grid">
        <div className="contact-info">
          <h2>{t('contact.info.title')}</h2>
          <dl className="info-list">
            <div>
              <dt>{t('contact.info.emailLabel')}</dt>
              <dd>
                <a href={`mailto:${email}`}>{email}</a>
              </dd>
            </div>
            <div>
              <dt>{t('contact.info.phoneLabel')}</dt>
              <dd>
                <a href={`tel:${phone.replace(/\s+/g, '')}`}>{phone}</a>
              </dd>
            </div>
            <div>
              <dt>{t('contact.info.addressLabel')}</dt>
              <dd>{t('contact.info.address')}</dd>
            </div>
            <div>
              <dt>{t('contact.info.hoursLabel')}</dt>
              <dd>{t('contact.info.hours')}</dd>
            </div>
          </dl>
        </div>

        <ContactForm />
      </div>

      <h2 className="faq-heading">{t('contact.faqTitle')}</h2>
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
