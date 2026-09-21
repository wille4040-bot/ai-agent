import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { cabins, priceRange, distanceRange } from '../data/cabins.js'
import { formatPrice } from '../lib/format.js'
import CabinCard from '../components/CabinCard.jsx'

const maxBeds = Math.max(...cabins.map((c) => c.beds))
const bedOptions = Array.from({ length: maxBeds - 1 }, (_, i) => i + 2) // 2..maxBeds

const defaults = {
  minBeds: 0,
  maxPrice: priceRange.max,
  maxDistance: distanceRange.max,
}

export default function Cabins() {
  const { t, i18n } = useTranslation()
  const [filters, setFilters] = useState(defaults)

  const set = (patch) => setFilters((f) => ({ ...f, ...patch }))
  const reset = () => setFilters(defaults)

  const results = useMemo(
    () =>
      cabins.filter(
        (c) =>
          c.beds >= filters.minBeds &&
          c.pricePerWeek <= filters.maxPrice &&
          c.distanceToWater <= filters.maxDistance,
      ),
    [filters],
  )

  return (
    <section className="container section">
      <h1>{t('cabins.title')}</h1>
      <p className="lead">{t('cabins.intro')}</p>

      <div className="cabins-layout">
        <aside className="filters" aria-label={t('cabins.filters.title')}>
          <div className="filters-head">
            <h2>{t('cabins.filters.title')}</h2>
            <button type="button" className="link-btn" onClick={reset}>
              {t('cabins.filters.reset')}
            </button>
          </div>

          <label className="filter">
            <span>{t('cabins.filters.beds')}</span>
            <select
              value={filters.minBeds}
              onChange={(e) => set({ minBeds: Number(e.target.value) })}
            >
              <option value={0}>{t('cabins.filters.bedsAny')}</option>
              {bedOptions.map((n) => (
                <option key={n} value={n}>
                  {n}+
                </option>
              ))}
            </select>
          </label>

          <label className="filter">
            <span>
              {t('cabins.filters.maxPrice')}:{' '}
              <strong>{formatPrice(filters.maxPrice, i18n.language)}</strong>
            </span>
            <input
              type="range"
              min={priceRange.min}
              max={priceRange.max}
              step={50}
              value={filters.maxPrice}
              onChange={(e) => set({ maxPrice: Number(e.target.value) })}
            />
          </label>

          <label className="filter">
            <span>
              {t('cabins.filters.maxDistance')}:{' '}
              <strong>{filters.maxDistance} m</strong>
            </span>
            <input
              type="range"
              min={distanceRange.min}
              max={distanceRange.max}
              step={10}
              value={filters.maxDistance}
              onChange={(e) => set({ maxDistance: Number(e.target.value) })}
            />
          </label>
        </aside>

        <div className="cabins-results">
          <p className="results-count">
            {t('cabins.results', { count: results.length })}
          </p>
          {results.length > 0 ? (
            <ul className="cabin-grid">
              {results.map((cabin) => (
                <CabinCard key={cabin.id} cabin={cabin} />
              ))}
            </ul>
          ) : (
            <p className="placeholder">{t('cabins.noResults')}</p>
          )}
        </div>
      </div>
    </section>
  )
}
