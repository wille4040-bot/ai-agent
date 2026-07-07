import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext.jsx'
import { supabase } from '../lib/supabase.js'
import BokningsKort from '../components/BokningsKort.jsx'

// Inkomna bokningar på de annonser man själv äger.
export default function MinaUthyrningar() {
  const { user } = useAuth()
  const [bokningar, setBokningar] = useState([])
  const [laddar, setLaddar] = useState(true)
  const [fel, setFel] = useState(null)

  async function hamta() {
    const { data, error } = await supabase
      .from('bookings')
      .select(
        'id, datum_fran, datum_till, totalpris, provision, status, listings!inner(id, titel, bild_url, agare_id)'
      )
      .eq('listings.agare_id', user.id)
      .order('datum_fran', { ascending: false })

    if (error) setFel('Kunde inte hämta uthyrningar: ' + error.message)
    else setBokningar(data)
    setLaddar(false)
  }

  useEffect(() => {
    hamta()
  }, [user.id])

  async function sattStatus(id, status) {
    const { error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', id)
    if (error) setFel('Kunde inte uppdatera: ' + error.message)
    else hamta()
  }

  return (
    <div className="innehall-bred">
      <h1 className="sidtitel">Mina uthyrningar</h1>
      {fel && <div className="notis notis-fel">{fel}</div>}

      {laddar ? (
        <p className="textsvag">Laddar…</p>
      ) : bokningar.length === 0 ? (
        <p className="tomtillstand">Inga inkomna bokningar ännu.</p>
      ) : (
        <div className="lista">
          {bokningar.map((b) => (
            <BokningsKort key={b.id} bokning={b}>
              {b.status === 'forfragan' && (
                <>
                  <button
                    className="btn btn-liten"
                    onClick={() => sattStatus(b.id, 'bekraftad')}
                  >
                    Bekräfta
                  </button>
                  <button
                    className="btn btn-sekundar btn-liten"
                    onClick={() => sattStatus(b.id, 'avbruten')}
                  >
                    Avböj
                  </button>
                </>
              )}
              {b.status === 'bekraftad' && (
                <button
                  className="btn btn-sekundar btn-liten"
                  onClick={() => sattStatus(b.id, 'avslutad')}
                >
                  Markera avslutad
                </button>
              )}
            </BokningsKort>
          ))}
        </div>
      )}
    </div>
  )
}
