import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { kr } from '../lib/annonser.js'

// Detaljvy för en annons. Hämtar även uthyrarens företagsnamn via kopplingen
// till profiles. Bokningsknappen aktiveras i Pass 4.
export default function AnnonsDetalj() {
  const { id } = useParams()
  const [annons, setAnnons] = useState(null)
  const [laddar, setLaddar] = useState(true)
  const [fel, setFel] = useState(null)

  useEffect(() => {
    async function hamta() {
      const { data, error } = await supabase
        .from('listings')
        .select('*, profiles(foretagsnamn, ort)')
        .eq('id', id)
        .maybeSingle()

      if (error) setFel('Kunde inte hämta annonsen: ' + error.message)
      else setAnnons(data)
      setLaddar(false)
    }
    hamta()
  }, [id])

  if (laddar) {
    return <p className="innehall-bred textsvag">Laddar…</p>
  }

  if (fel) {
    return <div className="innehall-bred"><div className="notis notis-fel">{fel}</div></div>
  }

  if (!annons) {
    return (
      <div className="innehall-bred tomtillstand">
        <p>Annonsen hittades inte.</p>
        <Link to="/annonser" className="btn-lank">Tillbaka till annonser</Link>
      </div>
    )
  }

  const foretag = annons.profiles?.foretagsnamn

  return (
    <div className="innehall-bred">
      <Link to="/annonser" className="btn-lank">← Alla annonser</Link>

      <div className="detalj" style={{ marginTop: '1rem' }}>
        {annons.bild_url ? (
          <img className="detalj-bild" src={annons.bild_url} alt={annons.titel} />
        ) : (
          <div className="detalj-bild annonsbild-tom">Sllr</div>
        )}

        <div>
          <span className="badge">{annons.kategori}</span>
          <h1 className="sidtitel" style={{ margin: '0.6rem 0' }}>
            {annons.titel}
          </h1>

          <p className="pris" style={{ fontSize: '1.4rem' }}>
            {kr(annons.dagspris)} <span className="pris-enhet">/ dag</span>
          </p>

          <dl>
            <dt>Deposition</dt>
            <dd>{kr(annons.deposition)}</dd>
            {annons.ort && (
              <>
                <dt>Ort</dt>
                <dd>{annons.ort}</dd>
              </>
            )}
            {foretag && (
              <>
                <dt>Uthyrare</dt>
                <dd>{foretag}</dd>
              </>
            )}
          </dl>

          {annons.beskrivning && (
            <p style={{ lineHeight: 1.5 }}>{annons.beskrivning}</p>
          )}

          <button className="btn" disabled style={{ marginTop: '1rem' }}>
            Boka (kommer i Pass 4)
          </button>
        </div>
      </div>
    </div>
  )
}
