import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { getCabin } from '../data/cabins.js'
import { formatPrice } from '../lib/format.js'
import { getBookedRanges } from '../lib/supabase.js'
import Gallery from '../components/Gallery.jsx'
import CabinMap from '../components/CabinMap.jsx'
import AvailabilityCalendar from '../components/AvailabilityCalendar.jsx'

export default function CabinDetail() {
  const { id } = useParams()
  const { t, i18n } = useTranslation()
  const cabin = getCabin(id)

  // Live tillgänglighet från databasen när backend är konfigurerad,
  // annars faller vi tillbaka på den statiska datan.
  const [booked, setBooked] = useState(cabin?.booked || [])
  useEffect(() => {
    if (!cabin) return
    let active = true
    getBookedRanges(cabin.id, cabin.booked).then((ranges) => {
      if (active) setBooked(ranges)
    })
    return () => {
      active = false
    }
  }, [cabin])

  if (!cabin) {
    return (
      <section className="container section">
        <h1>{t('cabinDetail.notFoundTitle')}</h1>
        <p className="lead">{t('cabinDetail.notFound')}</p>
        <Link to="/cabins" className="btn btn-outline">
          ← {t('nav.cabins')}
        </Link>
      </section>
    )
  }

  const description = t(`cabinDescriptions.${cabin.id}`)

  return (
    <section className="container section">
      <Link to="/cabins" className="back-link">
        ← {t('common.back')}
      </Link>

      <div className="detail-header">
        <h1>{cabin.name}</h1>
        <ul className="cabin-meta">
          <li>{t('cabins.beds', { count: cabin.beds })}</li>
          <li>{t('cabins.distanceLabel', { meters: cabin.distanceToWater })}</li>
        </ul>
      </div>

      <Gallery count={cabin.images} name={cabin.name} />

      <div className="detail-grid">
        <div className="detail-main">
          <h2>{t('cabinDetail.descriptionTitle')}</h2>
          <p className="lead">{description}</p>

          <h2>{t('cabinDetail.includedTitle')}</h2>
          <ul className="included-list">
            {cabin.included.map((key) => (
              <li key={key} className="included-item">
                {t(`features.${key}`)}
              </li>
            ))}
          </ul>

          <h2>{t('cabinDetail.mapTitle')}</h2>
          <CabinMap coords={cabin.coords} title={cabin.name} />

          <h2>{t('cabinDetail.availabilityTitle')}</h2>
          <AvailabilityCalendar booked={booked} />
        </div>

        <aside className="booking-box">
          <p className="booking-price">
            <strong>{formatPrice(cabin.pricePerWeek, i18n.language)}</strong>
            <span className="muted"> {t('cabins.perWeek')}</span>
          </p>
          <ul className="booking-facts">
            <li>{t('cabins.beds', { count: cabin.beds })}</li>
            <li>{t('cabins.distanceLabel', { meters: cabin.distanceToWater })}</li>
          </ul>
          <Link
            to={`/booking?cabin=${cabin.id}`}
            className="btn btn-primary btn-block"
          >
            {t('cabinDetail.bookCta')}
          </Link>
        </aside>
      </div>
    </section>
  )
}
