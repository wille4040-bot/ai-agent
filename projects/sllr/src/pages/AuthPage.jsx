import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { supabaseConfigured } from '../lib/supabase.js'

// Kombinerad sida för att logga in eller registrera ett företag med
// e-post + lösenord via Supabase Auth.
export default function AuthPage() {
  const [lage, setLage] = useState('logga-in') // 'logga-in' | 'registrera'
  const [epost, setEpost] = useState('')
  const [losenord, setLosenord] = useState('')
  const [fel, setFel] = useState(null)
  const [meddelande, setMeddelande] = useState(null)
  const [skickar, setSkickar] = useState(false)
  const navigate = useNavigate()

  const registrerar = lage === 'registrera'

  async function skicka(e) {
    e.preventDefault()
    setFel(null)
    setMeddelande(null)

    if (!supabaseConfigured) {
      setFel('Supabase är inte konfigurerat. Kontrollera .env-filen.')
      return
    }

    setSkickar(true)
    try {
      if (registrerar) {
        const { data, error } = await supabase.auth.signUp({
          email: epost,
          password: losenord,
        })
        if (error) throw error
        // Om e-postbekräftelse är påslagen i Supabase finns ingen session än.
        if (!data.session) {
          setMeddelande(
            'Konto skapat! Kolla din e-post och bekräfta adressen innan du loggar in.'
          )
        } else {
          navigate('/profil')
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: epost,
          password: losenord,
        })
        if (error) throw error
        navigate('/profil')
      }
    } catch (err) {
      setFel(oversattFel(err.message))
    } finally {
      setSkickar(false)
    }
  }

  return (
    <div className="innehall">
      <div className="kort">
        <h2 style={{ marginBottom: '0.4rem' }}>
          {registrerar ? 'Skapa företagskonto' : 'Logga in'}
        </h2>
        <p style={{ color: 'var(--text-svag)', marginTop: 0, marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          {registrerar
            ? 'Registrera ditt företag med e-post och lösenord.'
            : 'Välkommen tillbaka.'}
        </p>

        {fel && <div className="notis notis-fel">{fel}</div>}
        {meddelande && <div className="notis notis-ok">{meddelande}</div>}

        <form onSubmit={skicka}>
          <div className="falt">
            <label htmlFor="epost">E-post</label>
            <input
              id="epost"
              type="email"
              autoComplete="email"
              required
              value={epost}
              onChange={(e) => setEpost(e.target.value)}
            />
          </div>
          <div className="falt">
            <label htmlFor="losenord">Lösenord</label>
            <input
              id="losenord"
              type="password"
              autoComplete={registrerar ? 'new-password' : 'current-password'}
              required
              minLength={6}
              value={losenord}
              onChange={(e) => setLosenord(e.target.value)}
            />
          </div>
          <button className="btn" type="submit" disabled={skickar} style={{ width: '100%' }}>
            {skickar ? 'Vänta…' : registrerar ? 'Skapa konto' : 'Logga in'}
          </button>
        </form>

        <p style={{ marginTop: '1.25rem', marginBottom: 0, fontSize: '0.9rem', color: 'var(--text-svag)' }}>
          {registrerar ? 'Har du redan ett konto? ' : 'Inget konto än? '}
          <button
            className="btn-lank"
            onClick={() => {
              setLage(registrerar ? 'logga-in' : 'registrera')
              setFel(null)
              setMeddelande(null)
            }}
          >
            {registrerar ? 'Logga in' : 'Skapa företagskonto'}
          </button>
        </p>
      </div>
    </div>
  )
}

// Översätter de vanligaste felmeddelandena från Supabase till svenska.
function oversattFel(msg) {
  if (!msg) return 'Något gick fel. Försök igen.'
  if (msg.includes('Invalid login credentials')) return 'Fel e-post eller lösenord.'
  if (msg.includes('already registered')) return 'E-postadressen är redan registrerad.'
  if (msg.includes('Password should be')) return 'Lösenordet måste vara minst 6 tecken.'
  if (msg.includes('Email not confirmed')) return 'Bekräfta din e-post innan du loggar in.'
  return msg
}
