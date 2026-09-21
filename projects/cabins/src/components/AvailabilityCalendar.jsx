import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { intlLocale } from '../lib/format.js'

// Parsa "YYYY-MM-DD" till lokalt midnattsdatum (undviker tidszons-skift).
function toLocalDate(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

// Tillgänglighetskalender (endast visning). Markerar bokade och passerade dagar.
// `booked` = [{ start, end }] med inklusiva ISO-datum.
export default function AvailabilityCalendar({ booked = [] }) {
  const { t, i18n } = useTranslation()
  const locale = intlLocale(i18n.language)

  const today = startOfDay(new Date())
  const [view, setView] = useState({ year: today.getFullYear(), month: today.getMonth() })

  const ranges = useMemo(
    () => booked.map((b) => ({ start: toLocalDate(b.start), end: toLocalDate(b.end) })),
    [booked],
  )

  const isBooked = (date) =>
    ranges.some((r) => date >= r.start && date <= r.end)

  // Måndag-först veckodagsrubriker.
  const weekdays = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(locale, { weekday: 'short' })
    // 2024-01-01 var en måndag.
    return Array.from({ length: 7 }, (_, i) => fmt.format(new Date(2024, 0, 1 + i)))
  }, [locale])

  const monthLabel = new Intl.DateTimeFormat(locale, {
    month: 'long',
    year: 'numeric',
  }).format(new Date(view.year, view.month, 1))

  // Bygg rutnätet med tomma celler före månadens första dag (måndag-först).
  const cells = useMemo(() => {
    const first = new Date(view.year, view.month, 1)
    const daysInMonth = new Date(view.year, view.month + 1, 0).getDate()
    const lead = (first.getDay() + 6) % 7 // 0 = måndag
    const out = []
    for (let i = 0; i < lead; i++) out.push(null)
    for (let d = 1; d <= daysInMonth; d++) out.push(new Date(view.year, view.month, d))
    return out
  }, [view])

  const atCurrentMonth =
    view.year === today.getFullYear() && view.month === today.getMonth()

  const shift = (delta) =>
    setView((v) => {
      const m = new Date(v.year, v.month + delta, 1)
      return { year: m.getFullYear(), month: m.getMonth() }
    })

  return (
    <div className="calendar">
      <div className="calendar-head">
        <button
          type="button"
          className="cal-nav"
          onClick={() => shift(-1)}
          disabled={atCurrentMonth}
          aria-label={t('calendar.prev')}
        >
          ‹
        </button>
        <span className="calendar-title">{monthLabel}</span>
        <button
          type="button"
          className="cal-nav"
          onClick={() => shift(1)}
          aria-label={t('calendar.next')}
        >
          ›
        </button>
      </div>

      <div className="calendar-grid">
        {weekdays.map((w) => (
          <span key={w} className="cal-weekday">
            {w}
          </span>
        ))}
        {cells.map((date, i) => {
          if (!date) return <span key={`e${i}`} className="cal-cell is-empty" />
          const past = date < today
          const booked = !past && isBooked(date)
          const cls = past ? 'is-past' : booked ? 'is-booked' : 'is-free'
          return (
            <span key={date.getTime()} className={`cal-cell ${cls}`}>
              {date.getDate()}
            </span>
          )
        })}
      </div>

      <div className="calendar-legend">
        <span className="legend-item">
          <span className="swatch is-free" /> {t('calendar.available')}
        </span>
        <span className="legend-item">
          <span className="swatch is-booked" /> {t('calendar.booked')}
        </span>
        <span className="legend-item">
          <span className="swatch is-past" /> {t('calendar.past')}
        </span>
      </div>
    </div>
  )
}
