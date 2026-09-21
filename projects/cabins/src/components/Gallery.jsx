import { useState } from 'react'
import { useTranslation } from 'react-i18next'

// Platshållargalleri: en stor vy + miniatyrer. Byts mot riktiga bilder senare.
// `count` = antal platshållarbilder.
export default function Gallery({ count = 4, name = '' }) {
  const { t } = useTranslation()
  const [active, setActive] = useState(0)
  const images = Array.from({ length: Math.max(1, count) }, (_, i) => i)

  return (
    <div className="gallery">
      <div
        className={`gallery-main tile-${active % 4}`}
        role="img"
        aria-label={t('cabinDetail.imageAlt', { name, n: active + 1 })}
      >
        <span>
          {name ? `${name} · ` : ''}
          {t('cabinDetail.galleryAlt', { n: active + 1 })}
        </span>
      </div>
      {images.length > 1 && (
        <div className="gallery-thumbs" role="tablist">
          {images.map((i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={active === i}
              aria-label={t('cabinDetail.imageAlt', { name, n: i + 1 })}
              className={`gallery-thumb tile-${i % 4}` + (active === i ? ' is-active' : '')}
              onClick={() => setActive(i)}
            >
              <span>{i + 1}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
