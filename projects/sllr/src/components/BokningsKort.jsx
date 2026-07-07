import { Link } from 'react-router-dom'
import { kr } from '../lib/annonser.js'
import { STATUS_ETIKETT, antalDagar } from '../lib/bokning.js'

// Presentationsrad för en bokning – används i både Mina bokningar och Mina
// uthyrningar. Eventuella åtgärdsknappar skickas in som children.
export default function BokningsKort({ bokning, children }) {
  const l = bokning.listings ?? {}
  const dagar = antalDagar(bokning.datum_fran, bokning.datum_till)

  return (
    <div className="bokningsrad">
      {l.bild_url ? (
        <img className="mini-bild" src={l.bild_url} alt={l.titel} />
      ) : (
        <div className="mini-bild annonsbild-tom" style={{ fontSize: '1.2rem' }}>
          Sllr
        </div>
      )}

      <div className="bokningsrad-info">
        {l.id ? (
          <Link to={'/annonser/' + l.id}>{l.titel}</Link>
        ) : (
          <span>{l.titel ?? 'Annons'}</span>
        )}
        <div className="textsvag" style={{ fontSize: '0.9rem', marginTop: '0.2rem' }}>
          {bokning.datum_fran} – {bokning.datum_till} ({dagar}{' '}
          {dagar === 1 ? 'dag' : 'dagar'})
        </div>
        <div style={{ marginTop: '0.35rem' }}>
          <span className={'status status-' + bokning.status}>
            {STATUS_ETIKETT[bokning.status] ?? bokning.status}
          </span>{' '}
          <span className="textsvag" style={{ fontSize: '0.9rem' }}>
            {kr(bokning.totalpris)}
          </span>
        </div>
      </div>

      {children && <div className="bokningsrad-actions">{children}</div>}
    </div>
  )
}
