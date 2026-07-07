import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext.jsx'
import { supabase } from '../lib/supabase.js'
import BokningsKort from '../components/BokningsKort.jsx'

// De bokningar där man själv är hyrestagare.
export default function MinaBokningar() {
  const { user } = useAuth()
  const [bokningar, setBokningar] = useState([])
  const [laddar, setLaddar] = useState(true)
  const [fel, setFel] = useState(null)

  async function hamta() {
    const { data, error } = await supabase
      .from('bookings')
      .select('id, datum_fran, datum_till, totalpris, status, listings(id, titel, bild_url)')
      .eq('hyrestagare_id', user.id)
      .order('datum_fran', { ascending: false })

    if (error) setFel('Kunde inte hämta bokningar: ' + error.message)
    else setBokningar(data)
    setLaddar(false)
  }

  useEffect(() => {
    hamta()
  }, [user.id])

  async function avboka(id) {
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'avbruten' })
      .eq('id', id)
    if (error) setFel('Kunde inte avboka: ' + error.message)
    else hamta()
  }

  return (
    <div className="innehall-bred">
      <h1 className="sidtitel">Mina bokningar</h1>
      {fel && <div className="notis notis-fel">{fel}</div>}

      {laddar ? (
        <p className="textsvag">Laddar…</p>
      ) : bokningar.length === 0 ? (
        <p className="tomtillstand">Du har inga bokningar ännu.</p>
      ) : (
        <div className="lista">
          {bokningar.map((b) => (
            <BokningsKort key={b.id} bokning={b}>
              {(b.status === 'forfragan' || b.status === 'bekraftad') && (
                <button
                  className="btn btn-sekundar btn-liten"
                  onClick={() => avboka(b.id)}
                >
                  Avboka
                </button>
              )}
            </BokningsKort>
          ))}
        </div>
      )}
    </div>
  )
}
