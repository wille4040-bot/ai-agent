import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext.jsx'
import { supabase } from '../lib/supabase.js'

const TOM_PROFIL = { foretagsnamn: '', org_nr: '', ort: '', roll: 'bada' }

// Profilsida: företaget fyller i org.nr, företagsnamn, ort och roll.
// Raden skapas eller uppdateras (upsert) i tabellen profiles.
export default function Profile() {
  const { user } = useAuth()
  const [form, setForm] = useState(TOM_PROFIL)
  const [laddar, setLaddar] = useState(true)
  const [sparar, setSparar] = useState(false)
  const [fel, setFel] = useState(null)
  const [sparat, setSparat] = useState(false)

  // Hämta befintlig profil när sidan öppnas.
  useEffect(() => {
    let aktiv = true
    async function hamta() {
      const { data, error } = await supabase
        .from('profiles')
        .select('foretagsnamn, org_nr, ort, roll')
        .eq('id', user.id)
        .maybeSingle()

      if (!aktiv) return
      if (error) {
        setFel('Kunde inte hämta profilen: ' + error.message)
      } else if (data) {
        setForm({
          foretagsnamn: data.foretagsnamn ?? '',
          org_nr: data.org_nr ?? '',
          ort: data.ort ?? '',
          roll: data.roll ?? 'bada',
        })
      }
      setLaddar(false)
    }
    hamta()
    return () => {
      aktiv = false
    }
  }, [user.id])

  function andra(falt, varde) {
    setForm((f) => ({ ...f, [falt]: varde }))
    setSparat(false)
  }

  async function spara(e) {
    e.preventDefault()
    setFel(null)
    setSparat(false)
    setSparar(true)

    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      foretagsnamn: form.foretagsnamn.trim() || null,
      org_nr: form.org_nr.trim() || null,
      ort: form.ort.trim() || null,
      roll: form.roll,
    })

    setSparar(false)
    if (error) setFel('Kunde inte spara: ' + error.message)
    else setSparat(true)
  }

  if (laddar) {
    return (
      <p className="innehall" style={{ color: 'var(--text-svag)' }}>
        Laddar profil…
      </p>
    )
  }

  return (
    <div className="innehall">
      <div className="kort">
        <h2 style={{ marginBottom: '0.4rem' }}>Min profil</h2>
        <p style={{ color: 'var(--text-svag)', marginTop: 0, marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Inloggad som {user.email}
        </p>

        {fel && <div className="notis notis-fel">{fel}</div>}
        {sparat && <div className="notis notis-ok">Profilen är sparad.</div>}

        <form onSubmit={spara}>
          <div className="falt">
            <label htmlFor="foretagsnamn">Företagsnamn</label>
            <input
              id="foretagsnamn"
              type="text"
              value={form.foretagsnamn}
              onChange={(e) => andra('foretagsnamn', e.target.value)}
              placeholder="Ex. Nordic Bygg AB"
            />
          </div>

          <div className="falt">
            <label htmlFor="org_nr">Organisationsnummer</label>
            <input
              id="org_nr"
              type="text"
              value={form.org_nr}
              onChange={(e) => andra('org_nr', e.target.value)}
              placeholder="XXXXXX-XXXX"
            />
          </div>

          <div className="falt">
            <label htmlFor="ort">Ort</label>
            <input
              id="ort"
              type="text"
              value={form.ort}
              onChange={(e) => andra('ort', e.target.value)}
              placeholder="Ex. Stockholm"
            />
          </div>

          <div className="falt">
            <label htmlFor="roll">Roll</label>
            <select
              id="roll"
              value={form.roll}
              onChange={(e) => andra('roll', e.target.value)}
            >
              <option value="bada">Både hyra ut och hyra</option>
              <option value="uthyrare">Bara hyra ut</option>
              <option value="hyrestagare">Bara hyra</option>
            </select>
          </div>

          <button className="btn" type="submit" disabled={sparar} style={{ width: '100%' }}>
            {sparar ? 'Sparar…' : 'Spara profil'}
          </button>
        </form>
      </div>
    </div>
  )
}
