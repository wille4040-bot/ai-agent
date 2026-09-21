import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { cabins } from '../data/cabins.js'
import { formatPrice } from '../lib/format.js'

// Stiliserad, interaktiv karta över Sommen med klickbara stugpins.
// Ren SVG (lätt på mobil). Pins positioneras från stugornas koordinater.
const VIEW = { w: 400, h: 300 }
const INNER = { x0: 60, x1: 340, y0: 70, y1: 230 }

function projectPins(list) {
  const lats = list.map((c) => c.coords.lat)
  const lngs = list.map((c) => c.coords.lng)
  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const minLng = Math.min(...lngs)
  const maxLng = Math.max(...lngs)
  const spanLat = maxLat - minLat || 1
  const spanLng = maxLng - minLng || 1

  return list.map((c) => ({
    ...c,
    x: INNER.x0 + ((c.coords.lng - minLng) / spanLng) * (INNER.x1 - INNER.x0),
    // Nord (högre lat) uppåt → mindre y.
    y: INNER.y0 + ((maxLat - c.coords.lat) / spanLat) * (INNER.y1 - INNER.y0),
  }))
}

export default function InteractiveMap() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const pins = projectPins(cabins)

  const go = (id) => navigate(`/cabins/${id}`)

  return (
    <div className="sommen-map">
      <svg
        viewBox={`0 0 ${VIEW.w} ${VIEW.h}`}
        className="sommen-map-svg"
        role="group"
        aria-label={t('home.map.title')}
      >
        <defs>
          <linearGradient id="lakeGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8fc7c0" />
            <stop offset="100%" stopColor="#4f9c93" />
          </linearGradient>
        </defs>

        {/* Sjön */}
        <path
          className="lake"
          d="M40,120 C60,60 140,40 200,60 C260,80 330,50 360,110 C390,160 360,240 300,260 C240,280 160,270 110,250 C60,230 20,180 40,120 Z"
          fill="url(#lakeGrad)"
        />
        {/* Öar */}
        <ellipse className="island" cx="170" cy="150" rx="16" ry="9" />
        <ellipse className="island" cx="250" cy="185" rx="12" ry="7" />
        <ellipse className="island" cx="120" cy="195" rx="10" ry="6" />

        {/* Pins */}
        {pins.map((p) => (
          <g
            key={p.id}
            className="map-pin"
            role="link"
            tabIndex={0}
            aria-label={`${p.name}, ${formatPrice(p.pricePerWeek, i18n.language)} ${t('cabins.perWeek')}`}
            transform={`translate(${p.x} ${p.y})`}
            onClick={() => go(p.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                go(p.id)
              }
            }}
          >
            <circle className="pin-halo" r="16" />
            <circle className="pin-dot" r="8" />
            <circle className="pin-core" r="3" />
            <text className="pin-name" y="-20" textAnchor="middle">
              {p.name}
            </text>
            <text className="pin-price" y="30" textAnchor="middle">
              {formatPrice(p.pricePerWeek, i18n.language)} {t('cabins.perWeek')}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}
