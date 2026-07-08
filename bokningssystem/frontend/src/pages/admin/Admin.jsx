import { useEffect, useState } from 'react'
import { supabase, supabaseKonfigurerad } from '../../lib/supabase.js'
import { langDagText, klockslag, prisText, tillDatumStrang } from '../../lib/datum.js'

// Adminpanelen (Fas 1) – företagsägaren loggar in och ser
// dagens och kommande bokningar, och kan avboka vid behov.
// I Fas 2 byggs den ut med tjänste- och öppettidshantering.
export default function Admin() {
  const [session, setSession] = useState(null)
  const [kollarSession, setKollarSession] = useState(true)

  useEffect(() => {
    if (!supabaseKonfigurerad) { setKollarSession(false); return }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setKollarSession(false)
    })
    const { data: lyssnare } = supabase.auth.onAuthStateChange((_h, s) => setSession(s))
    return () => lyssnare.subscription.unsubscribe()
  }, [])

  if (!supabaseKonfigurerad) {
    return (
      <div className="sida">
        <div className="kort info-ruta">
          <h2>Nästan igång!</h2>
          <p>Fyll i dina Supabase-nycklar enligt <code>KOM-IGANG.md</code> först.</p>
        </div>
      </div>
    )
  }

  if (kollarSession) return <div className="sida"><p className="dampad centrerad">Laddar …</p></div>

  return session ? <Panel /> : <Inloggning />
}

// ---- Inloggningsformuläret ----
function Inloggning() {
  const [epost, setEpost] = useState('')
  const [losenord, setLosenord] = useState('')
  const [fel, setFel] = useState('')
  const [skickar, setSkickar] = useState(false)

  async function loggaIn(e) {
    e.preventDefault()
    setFel('')
    setSkickar(true)
    const { error } = await supabase.auth.signInWithPassword({
      email: epost,
      password: losenord,
    })
    setSkickar(false)
    if (error) setFel('Fel e-post eller lösenord. Försök igen.')
  }

  return (
    <div className="sida">
      <header className="sidhuvud"><h1>Adminpanel</h1></header>
      <div className="kort">
        <h2>Logga in</h2>
        <form onSubmit={loggaIn} className="formular">
          <label>
            E-post
            <input required type="email" value={epost}
                   onChange={(e) => setEpost(e.target.value)} autoComplete="email" />
          </label>
          <label>
            Lösenord
            <input required type="password" value={losenord}
                   onChange={(e) => setLosenord(e.target.value)} autoComplete="current-password" />
          </label>
          {fel && <p className="fel-ruta">{fel}</p>}
          <button className="knapp primar" disabled={skickar}>
            {skickar ? 'Loggar in …' : 'Logga in'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ---- Själva panelen (visas efter inloggning) ----
function Panel() {
  const [foretag, setForetag] = useState(null)
  const [bokningar, setBokningar] = useState([])
  const [laddar, setLaddar] = useState(true)

  async function hamta() {
    setLaddar(true)
    const { data: { user } } = await supabase.auth.getUser()

    // Hitta företaget som tillhör den inloggade ägaren
    const { data: f } = await supabase
      .from('foretag').select('*').eq('agare_user_id', user.id).maybeSingle()
    setForetag(f ?? null)

    if (f) {
      // Alla bekräftade bokningar från och med i dag.
      // Vi hämtar från igår och filtrerar sedan på svenskt datum,
      // så blir det rätt oavsett sommar- eller vintertid.
      const igar = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      const idag = tillDatumStrang(new Date())
      const { data: b } = await supabase
        .from('bokningar')
        .select('*, tjanster (namn, pris_kr)')
        .eq('foretag_id', f.id)
        .eq('status', 'bekraftad')
        .gte('starttid', igar)
        .order('starttid')
      setBokningar((b ?? []).filter((rad) => tillDatumStrang(new Date(rad.starttid)) >= idag))
    }
    setLaddar(false)
  }

  useEffect(() => { hamta() }, [])

  async function avboka(bokning) {
    const ok = window.confirm(
      `Avboka ${bokning.kund_namn}, ${langDagText(new Date(bokning.starttid))} kl ${klockslag(bokning.starttid)}?\n\nDetta går inte att ångra.`,
    )
    if (!ok) return
    await supabase.from('bokningar').update({ status: 'avbokad' }).eq('id', bokning.id)
    hamta()
  }

  if (laddar) return <div className="sida"><p className="dampad centrerad">Laddar …</p></div>

  if (!foretag) {
    return (
      <div className="sida">
        <div className="kort info-ruta">
          <h2>Inget företag kopplat</h2>
          <p>Din inloggning är inte kopplad till något företag ännu.
            Kör kopplings-raden längst ned i
            <code> 002_testdata_frisor_lisa.sql</code> (se KOM-IGANG.md, steg 4).</p>
          <button className="knapp sekundar" onClick={() => supabase.auth.signOut()}>Logga ut</button>
        </div>
      </div>
    )
  }

  const idagStrang = tillDatumStrang(new Date())
  const dagens = bokningar.filter((b) => tillDatumStrang(new Date(b.starttid)) === idagStrang)
  const kommande = bokningar.filter((b) => tillDatumStrang(new Date(b.starttid)) !== idagStrang)

  return (
    <div className="sida bred">
      <header className="sidhuvud rad-mellan">
        <div>
          <h1>{foretag.namn}</h1>
          <p className="dampad liten">Adminpanel</p>
        </div>
        <button className="knapp sekundar liten-knapp" onClick={() => supabase.auth.signOut()}>
          Logga ut
        </button>
      </header>

      <div className="kort">
        <h2>I dag <span className="dampad">({dagens.length})</span></h2>
        <BokningsLista bokningar={dagens} onAvboka={avboka} tomText="Inga bokningar i dag." />
      </div>

      <div className="kort">
        <h2>Kommande <span className="dampad">({kommande.length})</span></h2>
        <BokningsLista bokningar={kommande} onAvboka={avboka} tomText="Inga kommande bokningar." visaDag />
      </div>
    </div>
  )
}

function BokningsLista({ bokningar, onAvboka, tomText, visaDag = false }) {
  if (bokningar.length === 0) return <p className="dampad">{tomText}</p>
  return (
    <div className="lista">
      {bokningar.map((b) => (
        <div key={b.id} className="boknings-rad">
          <div className="boknings-tid">
            {visaDag && <span className="dampad liten">{langDagText(new Date(b.starttid))}</span>}
            <strong>{klockslag(b.starttid)}–{klockslag(b.sluttid)}</strong>
          </div>
          <div className="boknings-info">
            <strong>{b.kund_namn}</strong>
            <span className="dampad liten">
              {b.tjanster?.namn} · {prisText(b.tjanster?.pris_kr ?? 0)}
            </span>
            <span className="dampad liten">{b.kund_telefon} · {b.kund_epost}</span>
            {b.meddelande && <span className="liten">💬 {b.meddelande}</span>}
          </div>
          <button className="knapp fara liten-knapp" onClick={() => onAvboka(b)}>
            Avboka
          </button>
        </div>
      ))}
    </div>
  )
}
