import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import { supabase } from '../lib/supabase.js'
import { kr } from '../lib/annonser.js'
import { beraknaPris, overlappar, idag } from '../lib/bokning.js'

// Bokningsformulär för en annons: välj datum, se prisuppdelning och skicka
// en bokningsförfrågan. Visar även redan bokade perioder.
export default function Bokningsruta({ listing }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [fran, setFran] = useState('')
  const [till, setTill] = useState('')
  const [perioder, setPerioder] = useState([])
  const [skickar, setSkickar] = useState(false)
  const [fel, setFel] = useState(null)
  const [klar, setKlar] = useState(false)

  const agenAnnons = user && user.id === listing.agare_id

  // Hämta upptagna datum för att kunna varna innan man skickar.
  useEffect(() => {
    supabase
      .rpc('bokade_perioder', { p_listing_id: listing.id })
      .then(({ data }) => setPerioder(data ?? []))
  }, [listing.id])

  const { dagar, hyra, provision, total } = beraknaPris(
    listing.dagspris,
    listing.deposition,
    fran,
    till
  )

  const giltigt = fran && till && dagar > 0
  const krockar = giltigt && overlappar(fran, till, perioder)

  async function boka(e) {
    e.preventDefault()
    setFel(null)

    if (!user) {
      // Skicka till inloggning; efter login kan man boka.
      navigate('/logga-in')
      return
    }
    if (!giltigt) {
      setFel('Välj giltiga datum.')
      return
    }
    if (krockar) {
      setFel('Utrustningen är redan bokad under en del av de valda datumen.')
      return
    }

    setSkickar(true)
    const { error } = await supabase.from('bookings').insert({
      listing_id: listing.id,
      hyrestagare_id: user.id,
      datum_fran: fran,
      datum_till: till,
      totalpris: total,
      provision,
      status: 'forfragan',
    })
    setSkickar(false)

    if (error) {
      // 23P01 = uteslutningsvillkoret slog till (någon hann boka före).
      if (error.code === '23P01' || /overlapp|exclusion/i.test(error.message)) {
        setFel('Utrustningen blev precis bokad för de datumen. Välj andra datum.')
        // Uppdatera listan över upptagna datum.
        const { data } = await supabase.rpc('bokade_perioder', {
          p_listing_id: listing.id,
        })
        setPerioder(data ?? [])
      } else {
        setFel('Kunde inte skicka bokningen: ' + error.message)
      }
      return
    }
    setKlar(true)
  }

  if (agenAnnons) {
    return (
      <div className="kort" style={{ marginTop: '1rem' }}>
        <p className="textsvag" style={{ margin: 0 }}>
          Det här är din egen annons. Du hittar inkomna bokningar under{' '}
          <a href="/mina-uthyrningar">Mina uthyrningar</a>.
        </p>
      </div>
    )
  }

  if (klar) {
    return (
      <div className="kort" style={{ marginTop: '1rem' }}>
        <div className="notis notis-ok" style={{ margin: 0 }}>
          Din bokningsförfrågan är skickad! Du ser den under{' '}
          <a href="/mina-bokningar">Mina bokningar</a>.
        </div>
      </div>
    )
  }

  return (
    <form className="kort" style={{ marginTop: '1rem' }} onSubmit={boka}>
      <h3 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1.1rem' }}>
        Boka utrustningen
      </h3>

      {fel && <div className="notis notis-fel">{fel}</div>}

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <div className="falt" style={{ flex: 1 }}>
          <label htmlFor="fran">Från</label>
          <input
            id="fran"
            type="date"
            min={idag()}
            value={fran}
            onChange={(e) => setFran(e.target.value)}
          />
        </div>
        <div className="falt" style={{ flex: 1 }}>
          <label htmlFor="till">Till</label>
          <input
            id="till"
            type="date"
            min={fran || idag()}
            value={till}
            onChange={(e) => setTill(e.target.value)}
          />
        </div>
      </div>

      {giltigt && (
        <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.35rem 1rem', margin: '0.5rem 0 1rem' }}>
          <dt className="textsvag">
            {kr(listing.dagspris)} × {dagar} {dagar === 1 ? 'dag' : 'dagar'}
          </dt>
          <dd style={{ margin: 0, textAlign: 'right' }}>{kr(hyra)}</dd>

          <dt className="textsvag">Deposition (återbetalas)</dt>
          <dd style={{ margin: 0, textAlign: 'right' }}>{kr(listing.deposition)}</dd>

          <dt style={{ fontWeight: 600 }}>Att betala</dt>
          <dd style={{ margin: 0, textAlign: 'right', fontWeight: 700, color: 'var(--lime)' }}>
            {kr(total)}
          </dd>
        </dl>
      )}

      {krockar && (
        <div className="notis notis-fel">
          De valda datumen krockar med en befintlig bokning.
        </div>
      )}

      <button className="btn" type="submit" disabled={skickar} style={{ width: '100%' }}>
        {skickar
          ? 'Skickar…'
          : user
            ? 'Skicka bokningsförfrågan'
            : 'Logga in för att boka'}
      </button>

      {perioder.length > 0 && (
        <p className="textsvag" style={{ fontSize: '0.82rem', marginBottom: 0 }}>
          Redan bokat:{' '}
          {perioder
            .map((p) => `${p.datum_fran} – ${p.datum_till}`)
            .join(', ')}
        </p>
      )}
    </form>
  )
}
