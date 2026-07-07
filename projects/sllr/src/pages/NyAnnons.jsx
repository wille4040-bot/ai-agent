import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import { supabase } from '../lib/supabase.js'
import { KATEGORIER } from '../lib/annonser.js'

const TOM = {
  titel: '',
  kategori: KATEGORIER[0],
  beskrivning: '',
  dagspris: '',
  deposition: '',
  ort: '',
}

// Formulär för att lägga upp utrustning. Bilden laddas upp till Supabase
// Storage och annonsen sparas i tabellen listings.
export default function NyAnnons() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState(TOM)
  const [bild, setBild] = useState(null)
  const [sparar, setSparar] = useState(false)
  const [fel, setFel] = useState(null)

  function andra(falt, varde) {
    setForm((f) => ({ ...f, [falt]: varde }))
  }

  async function spara(e) {
    e.preventDefault()
    setFel(null)
    setSparar(true)

    try {
      let bild_url = null

      // 1. Ladda upp bilden (om någon valts) till användarens egen mapp.
      if (bild) {
        const rent = bild.name.replace(/[^a-zA-Z0-9.-]/g, '_')
        const sokvag = `${user.id}/${Date.now()}-${rent}`
        const { error: uppladdningsfel } = await supabase.storage
          .from('listing-bilder')
          .upload(sokvag, bild)
        if (uppladdningsfel) throw uppladdningsfel

        const { data } = supabase.storage
          .from('listing-bilder')
          .getPublicUrl(sokvag)
        bild_url = data.publicUrl
      }

      // 2. Spara annonsen.
      const { data, error } = await supabase
        .from('listings')
        .insert({
          agare_id: user.id,
          titel: form.titel.trim(),
          kategori: form.kategori,
          beskrivning: form.beskrivning.trim() || null,
          dagspris: Number(form.dagspris),
          deposition: Number(form.deposition) || 0,
          ort: form.ort.trim() || null,
          bild_url,
          aktiv: true,
        })
        .select('id')
        .single()

      if (error) throw error
      navigate('/annonser/' + data.id)
    } catch (err) {
      setFel('Kunde inte spara annonsen: ' + err.message)
      setSparar(false)
    }
  }

  return (
    <div className="innehall">
      <div className="kort">
        <h2 style={{ marginBottom: '1.25rem' }}>Lägg upp utrustning</h2>

        {fel && <div className="notis notis-fel">{fel}</div>}

        <form onSubmit={spara}>
          <div className="falt">
            <label htmlFor="titel">Titel</label>
            <input
              id="titel"
              type="text"
              required
              value={form.titel}
              onChange={(e) => andra('titel', e.target.value)}
              placeholder="Ex. Partytält 6x12 m"
            />
          </div>

          <div className="falt">
            <label htmlFor="kategori">Kategori</label>
            <select
              id="kategori"
              value={form.kategori}
              onChange={(e) => andra('kategori', e.target.value)}
            >
              {KATEGORIER.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>

          <div className="falt">
            <label htmlFor="beskrivning">Beskrivning</label>
            <textarea
              id="beskrivning"
              rows={4}
              value={form.beskrivning}
              onChange={(e) => andra('beskrivning', e.target.value)}
              placeholder="Skick, mått, vad som ingår…"
              style={{
                fontFamily: 'var(--font-brod)',
                fontSize: '1rem',
                padding: '0.65rem 0.8rem',
                borderRadius: '0.6rem',
                border: '1px solid var(--grafit-linje)',
                backgroundColor: 'var(--grafit)',
                color: 'var(--text)',
                resize: 'vertical',
              }}
            />
          </div>

          <div className="falt">
            <label htmlFor="dagspris">Dagspris (kr)</label>
            <input
              id="dagspris"
              type="number"
              min="0"
              required
              value={form.dagspris}
              onChange={(e) => andra('dagspris', e.target.value)}
              placeholder="1200"
            />
          </div>

          <div className="falt">
            <label htmlFor="deposition">Deposition (kr)</label>
            <input
              id="deposition"
              type="number"
              min="0"
              value={form.deposition}
              onChange={(e) => andra('deposition', e.target.value)}
              placeholder="0"
            />
          </div>

          <div className="falt">
            <label htmlFor="ort">Ort</label>
            <input
              id="ort"
              type="text"
              value={form.ort}
              onChange={(e) => andra('ort', e.target.value)}
              placeholder="Ex. Göteborg"
            />
          </div>

          <div className="falt">
            <label htmlFor="bild">Bild</label>
            <input
              id="bild"
              type="file"
              accept="image/*"
              onChange={(e) => setBild(e.target.files?.[0] ?? null)}
            />
          </div>

          <button className="btn" type="submit" disabled={sparar} style={{ width: '100%' }}>
            {sparar ? 'Sparar…' : 'Publicera annons'}
          </button>
        </form>
      </div>
    </div>
  )
}
