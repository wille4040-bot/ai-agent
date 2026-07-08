import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase, supabaseKonfigurerad } from '../lib/supabase.js'
import {
  tillDatumStrang, langDagText, kortVeckodag, kortDatum,
  klockslag, isoVeckodag, kommandeDagar, prisText,
} from '../lib/datum.js'

// Bokningssidan – det slutkunden ser.
// Flödet: välj tjänst -> välj dag -> välj tid -> fyll i uppgifter -> klart.
// Byggd för att gå att slutföra på under en minut i mobilen.
export default function Bokning() {
  const { slug } = useParams()

  const [laddar, setLaddar] = useState(true)
  const [foretag, setForetag] = useState(null)
  const [tjanster, setTjanster] = useState([])
  const [oppnaVeckodagar, setOppnaVeckodagar] = useState([]) // [1..7]
  const [blockerade, setBlockerade] = useState([])           // ['2026-07-10', ...]

  const [steg, setSteg] = useState(1)
  const [valdTjanst, setValdTjanst] = useState(null)
  const [valdDag, setValdDag] = useState(null)   // 'YYYY-MM-DD'
  const [tider, setTider] = useState([])
  const [laddarTider, setLaddarTider] = useState(false)
  const [valdTid, setValdTid] = useState(null)   // { starttid, sluttid }

  const [namn, setNamn] = useState('')
  const [telefon, setTelefon] = useState('')
  const [epost, setEpost] = useState('')
  const [meddelande, setMeddelande] = useState('')
  const [skickar, setSkickar] = useState(false)
  const [fel, setFel] = useState('')
  const [klarBokning, setKlarBokning] = useState(null)

  // Hämta företagets uppgifter när sidan öppnas
  useEffect(() => {
    if (!supabaseKonfigurerad) { setLaddar(false); return }
    async function hamta() {
      const { data: f } = await supabase
        .from('foretag').select('*').eq('slug', slug).eq('aktiv', true).maybeSingle()
      if (!f) { setLaddar(false); return }
      setForetag(f)

      const [{ data: t }, { data: o }, { data: b }] = await Promise.all([
        supabase.from('tjanster').select('*')
          .eq('foretag_id', f.id).eq('aktiv', true).order('namn'),
        supabase.from('oppettider').select('veckodag').eq('foretag_id', f.id),
        supabase.from('blockerade_datum').select('datum').eq('foretag_id', f.id),
      ])
      setTjanster(t ?? [])
      setOppnaVeckodagar((o ?? []).map((r) => r.veckodag))
      setBlockerade((b ?? []).map((r) => r.datum))
      setLaddar(false)
    }
    hamta()
  }, [slug])

  // De kommande 30 dagarna som valbara knappar
  const dagar = useMemo(() => kommandeDagar(30), [])

  function dagArOppen(datum) {
    return (
      oppnaVeckodagar.includes(isoVeckodag(datum)) &&
      !blockerade.includes(tillDatumStrang(datum))
    )
  }

  async function valjDag(datumStrang) {
    setValdDag(datumStrang)
    setValdTid(null)
    setLaddarTider(true)
    setSteg(3)
    const { data, error } = await supabase.rpc('lediga_tider', {
      p_slug: slug,
      p_tjanst_id: valdTjanst.id,
      p_datum: datumStrang,
    })
    setTider(error ? [] : (data ?? []))
    setLaddarTider(false)
  }

  async function bekrafta(e) {
    e.preventDefault()
    setFel('')
    setSkickar(true)
    const { data, error } = await supabase.rpc('skapa_bokning', {
      p_slug: slug,
      p_tjanst_id: valdTjanst.id,
      p_starttid: valdTid.starttid,
      p_kund_namn: namn,
      p_kund_telefon: telefon,
      p_kund_epost: epost,
      p_meddelande: meddelande,
    })
    setSkickar(false)

    if (error || !data?.ok) {
      setFel(data?.fel ?? 'Något gick fel. Försök igen.')
      // Tiden kan ha hunnit tas – hämta om listan så kunden ser rätt läge
      if (valdDag) {
        const { data: nyaTider } = await supabase.rpc('lediga_tider', {
          p_slug: slug, p_tjanst_id: valdTjanst.id, p_datum: valdDag,
        })
        setTider(nyaTider ?? [])
      }
      return
    }

    setKlarBokning(data)
    setSteg(5)

    // Skicka bekräftelsemail i bakgrunden (bokningen gäller även om
    // mailet inte kan skickas, t.ex. innan Resend är påkopplat)
    supabase.functions
      .invoke('skicka-bekraftelse', { body: { bokning_id: data.bokning_id } })
      .catch(() => {})
  }

  // ---- Olika lägen på sidan ----

  if (!supabaseKonfigurerad) {
    return (
      <Skal>
        <div className="kort info-ruta">
          <h2>Nästan igång!</h2>
          <p>Appen är inte kopplad till databasen ännu. Följ stegen i
            filen <code>KOM-IGANG.md</code> för att fylla i dina
            Supabase-nycklar.</p>
        </div>
      </Skal>
    )
  }

  if (laddar) return <Skal><p className="dampad centrerad">Laddar …</p></Skal>

  if (!foretag) {
    return (
      <Skal>
        <div className="kort info-ruta">
          <h2>Sidan hittades inte</h2>
          <p>Det finns inget företag med adressen <strong>/{slug}</strong>.</p>
        </div>
      </Skal>
    )
  }

  // Steg 5: bekräftelseskärmen
  if (steg === 5 && klarBokning) {
    return (
      <Skal foretag={foretag}>
        <div className="kort bekraftelse">
          <div className="bock" aria-hidden="true">✓</div>
          <h2>Din tid är bokad!</h2>
          <p className="dampad">En bekräftelse skickas till {epost}</p>
          <div className="summering">
            <Rad namn="Tjänst" varde={klarBokning.tjanst_namn} />
            <Rad namn="Dag" varde={langDagText(new Date(klarBokning.starttid))} />
            <Rad namn="Tid" varde={`kl ${klockslag(klarBokning.starttid)}–${klockslag(klarBokning.sluttid)}`} />
            <Rad namn="Pris" varde={prisText(klarBokning.pris_kr)} />
            {foretag.adress && <Rad namn="Adress" varde={foretag.adress} />}
          </div>
          {foretag.telefon && (
            <p className="dampad liten">Behöver du ändra tiden? Ring {foretag.telefon}.</p>
          )}
          <button className="knapp sekundar" onClick={() => window.location.reload()}>
            Boka en tid till
          </button>
        </div>
      </Skal>
    )
  }

  return (
    <Skal foretag={foretag}>
      <Stegvisare steg={steg} />

      {/* STEG 1: välj tjänst */}
      {steg === 1 && (
        <div className="kort">
          <h2>Välj tjänst</h2>
          <div className="lista">
            {tjanster.map((t) => (
              <button
                key={t.id}
                className="tjanst-knapp"
                onClick={() => { setValdTjanst(t); setSteg(2) }}
              >
                <span className="tjanst-info">
                  <strong>{t.namn}</strong>
                  {t.beskrivning && <span className="dampad liten">{t.beskrivning}</span>}
                </span>
                <span className="tjanst-detaljer">
                  <strong>{prisText(t.pris_kr)}</strong>
                  <span className="dampad liten">{t.langd_minuter} min</span>
                </span>
              </button>
            ))}
            {tjanster.length === 0 && (
              <p className="dampad">Inga tjänster upplagda ännu.</p>
            )}
          </div>
        </div>
      )}

      {/* STEG 2: välj dag */}
      {steg === 2 && (
        <div className="kort">
          <Tillbaka onClick={() => setSteg(1)} />
          <h2>Välj dag</h2>
          <p className="dampad liten">{valdTjanst.namn} · {valdTjanst.langd_minuter} min · {prisText(valdTjanst.pris_kr)}</p>
          <div className="dag-rutnat">
            {dagar.map((d) => {
              const ds = tillDatumStrang(d)
              const oppen = dagArOppen(d)
              return (
                <button
                  key={ds}
                  className={`dag-knapp ${valdDag === ds ? 'vald' : ''}`}
                  disabled={!oppen}
                  onClick={() => valjDag(ds)}
                >
                  <span className="dampad liten">{kortVeckodag(d)}</span>
                  <strong>{kortDatum(d)}</strong>
                  {!oppen && <span className="dampad liten">stängt</span>}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* STEG 3: välj tid */}
      {steg === 3 && (
        <div className="kort">
          <Tillbaka onClick={() => { setSteg(2); setValdTid(null) }} />
          <h2>Välj tid</h2>
          <p className="dampad liten">
            {valdTjanst.namn} · {langDagText(new Date(valdDag + 'T12:00:00'))}
          </p>
          {laddarTider && <p className="dampad">Hämtar lediga tider …</p>}
          {!laddarTider && tider.length === 0 && (
            <p className="dampad">Inga lediga tider den här dagen – prova en annan dag.</p>
          )}
          <div className="tid-rutnat">
            {tider.map((t) => (
              <button
                key={t.starttid}
                className={`tid-knapp ${valdTid?.starttid === t.starttid ? 'vald' : ''}`}
                onClick={() => { setValdTid(t); setSteg(4) }}
              >
                {klockslag(t.starttid)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEG 4: uppgifter + summering */}
      {steg === 4 && (
        <div className="kort">
          <Tillbaka onClick={() => { setSteg(3); setFel('') }} />
          <h2>Dina uppgifter</h2>

          <div className="summering">
            <Rad namn="Tjänst" varde={valdTjanst.namn} />
            <Rad namn="Dag" varde={langDagText(new Date(valdTid.starttid))} />
            <Rad namn="Tid" varde={`kl ${klockslag(valdTid.starttid)}–${klockslag(valdTid.sluttid)}`} />
            <Rad namn="Pris" varde={prisText(valdTjanst.pris_kr)} />
          </div>

          <form onSubmit={bekrafta} className="formular">
            <label>
              Namn
              <input required value={namn} onChange={(e) => setNamn(e.target.value)}
                     autoComplete="name" placeholder="Anna Andersson" />
            </label>
            <label>
              Telefon
              <input required type="tel" value={telefon} onChange={(e) => setTelefon(e.target.value)}
                     autoComplete="tel" placeholder="070-123 45 67" />
            </label>
            <label>
              E-post
              <input required type="email" value={epost} onChange={(e) => setEpost(e.target.value)}
                     autoComplete="email" placeholder="anna@exempel.se" />
            </label>
            <label>
              Meddelande (valfritt)
              <textarea rows={2} value={meddelande} onChange={(e) => setMeddelande(e.target.value)}
                        placeholder="Något vi bör veta?" />
            </label>

            {fel && <p className="fel-ruta">{fel}</p>}

            <button className="knapp primar" disabled={skickar}>
              {skickar ? 'Bokar …' : 'Bekräfta bokning'}
            </button>
            <p className="dampad liten centrerad">
              Genom att boka godkänner du att {foretag.namn} sparar dina
              uppgifter för att hantera bokningen.
            </p>
          </form>
        </div>
      )}
    </Skal>
  )
}

// ---- Små byggstenar som används ovan ----

function Skal({ foretag, children }) {
  return (
    <div className="sida">
      <header className="sidhuvud">
        <h1>{foretag ? foretag.namn : 'Boka tid'}</h1>
        {foretag?.adress && <p className="dampad liten">{foretag.adress}</p>}
      </header>
      <main>{children}</main>
      <footer className="sidfot dampad liten">Onlinebokning – öppet dygnet runt</footer>
    </div>
  )
}

function Stegvisare({ steg }) {
  const namn = ['Tjänst', 'Dag', 'Tid', 'Uppgifter']
  return (
    <div className="stegvisare" aria-label={`Steg ${steg} av 4`}>
      {namn.map((n, i) => (
        <span key={n} className={`steg-prick ${steg >= i + 1 ? 'aktiv' : ''}`}>{n}</span>
      ))}
    </div>
  )
}

function Tillbaka({ onClick }) {
  return <button className="tillbaka" onClick={onClick}>‹ Tillbaka</button>
}

function Rad({ namn, varde }) {
  return (
    <div className="summering-rad">
      <span className="dampad">{namn}</span>
      <strong>{varde}</strong>
    </div>
  )
}
