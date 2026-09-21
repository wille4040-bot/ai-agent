import { useTranslation } from 'react-i18next'

const itemKeys = ['kitchen', 'wifi', 'heating', 'parking', 'sauna', 'pets']

export default function Equipment() {
  const { t } = useTranslation()

  return (
    <section className="container section">
      <h1>{t('equipment.title')}</h1>
      <p className="lead">{t('equipment.intro')}</p>

      <ul className="equipment-list">
        {itemKeys.map((key) => (
          <li key={key} className="equipment-item">
            {t(`equipment.items.${key}`)}
          </li>
        ))}
      </ul>
    </section>
  )
}
