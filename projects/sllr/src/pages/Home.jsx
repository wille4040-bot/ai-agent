import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'

// Enkel startsida. Annonslistan byggs i Pass 3.
export default function Home() {
  const { user } = useAuth()

  return (
    <main
      style={{
        minHeight: 'calc(100vh - 65px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1.5rem',
        padding: '2rem',
        textAlign: 'center',
      }}
    >
      <h1 style={{ maxWidth: '34rem', fontSize: '2.2rem', lineHeight: 1.15 }}>
        Marknadsplatsen där företag hyr ut ledig utrustning till varandra.
      </h1>
      <p style={{ color: 'var(--text-svag)', maxWidth: '30rem', margin: 0 }}>
        Event, bygg, verktyg och transport – hyr av andra företag med org.nr,
        fakturabetalning och digitala hyresavtal.
      </p>

      {user ? (
        <Link to="/profil" className="btn">
          Till min profil
        </Link>
      ) : (
        <Link to="/logga-in" className="btn">
          Kom igång
        </Link>
      )}
    </main>
  )
}
