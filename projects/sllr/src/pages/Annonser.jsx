import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { KATEGORIER, kr } from '../lib/annonser.js'

// Publik lista över aktiva annonser med fritextsök och kategorifilter.
export default function Annonser() {
  const [annonser, setAnnonser] = useState([])
  const [laddar, setLaddar] = useState(true)
  const [fel, setFel] = useState(null)
  const [sok, setSok] = useState('')
  const [kategori, setKategori] = useState('alla')

  useEffect(() => {
    async function hamta() {
      const { data, error } = await supabase
        .from('listings')
        .select('id, titel, kategori, dagspris, ort, bild_url')
        .eq('aktiv', true)
        .order('created_at', { ascending: false })

      if (error) setFel('Kunde inte hämta annonser: ' + error.message)
      else setAnnonser(data)
      setLaddar(false)
    }
    hamta()
  }, [])

  // Filtrering sker i webbläsaren – enkelt och snabbt för rimliga mängder.
  const synliga = useMemo(() => {
    const q = sok.trim().toLowerCase()
    return annonser.filter((a) => {
      const matchKategori = kategori === 'alla' || a.kategori === kategori
      const matchSok =
        !q ||
        a.titel.toLowerCase().includes(q) ||
        (a.ort ?? '').toLowerCase().includes(q)
      return matchKategori && matchSok
    })
  }, [annonser, sok, kategori])

  return (
    <div className="innehall-bred">
      <h1 className="sidtitel">Annonser</h1>

      <div className="filterrad">
        <input
          type="search"
          placeholder="Sök på titel eller ort…"
          value={sok}
          onChange={(e) => setSok(e.target.value)}
        />
        <select value={kategori} onChange={(e) => setKategori(e.target.value)}>
          <option value="alla">Alla kategorier</option>
          {KATEGORIER.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
      </div>

      {fel && <div className="notis notis-fel">{fel}</div>}

      {laddar ? (
        <p className="textsvag">Laddar annonser…</p>
      ) : synliga.length === 0 ? (
        <p className="tomtillstand">
          {annonser.length === 0
            ? 'Inga annonser ännu. Bli först med att lägga upp utrustning!'
            : 'Inga annonser matchar din sökning.'}
        </p>
      ) : (
        <div className="rutnat">
          {synliga.map((a) => (
            <AnnonsKort key={a.id} annons={a} />
          ))}
        </div>
      )}
    </div>
  )
}

function AnnonsKort({ annons }) {
  return (
    <Link to={'/annonser/' + annons.id} className="annonskort">
      {annons.bild_url ? (
        <img className="annonsbild" src={annons.bild_url} alt={annons.titel} />
      ) : (
        <div className="annonsbild-tom">Sllr</div>
      )}
      <div className="annonskort-kropp">
        <span className="badge">{annons.kategori}</span>
        <span className="annonskort-titel">{annons.titel}</span>
        {annons.ort && <span className="textsvag">{annons.ort}</span>}
        <span className="pris">
          {kr(annons.dagspris)} <span className="pris-enhet">/ dag</span>
        </span>
      </div>
    </Link>
  )
}
