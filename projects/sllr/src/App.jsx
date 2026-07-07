import { supabaseConfigured } from './lib/supabase.js'

// Pass 1: en enkel startsida som bekräftar att grunden står – React + Vite
// körs och Supabase-klienten är inläst. Riktiga vyer (inloggning, annonser,
// bokning) byggs i kommande pass.
export default function App() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1.5rem',
        padding: '2rem',
        textAlign: 'center',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-rubrik)',
          fontWeight: 700,
          fontSize: '3.5rem',
          color: 'var(--lime)',
          letterSpacing: '-0.03em',
        }}
      >
        Sllr
      </span>

      <h1 style={{ maxWidth: '32rem', fontSize: '1.6rem', lineHeight: 1.25 }}>
        Marknadsplatsen där företag hyr ut ledig utrustning till varandra.
      </h1>

      <p style={{ color: 'var(--text-svag)', maxWidth: '30rem', margin: 0 }}>
        Grunden är på plats. Inloggning, annonser och bokning byggs i kommande
        pass.
      </p>

      <ConfigStatus />
    </main>
  )
}

function ConfigStatus() {
  const ok = supabaseConfigured
  return (
    <div
      style={{
        marginTop: '1rem',
        padding: '0.6rem 1.1rem',
        borderRadius: '999px',
        border: '1px solid var(--grafit-linje)',
        backgroundColor: 'var(--grafit-ljus)',
        color: ok ? 'var(--lime)' : 'var(--text-svag)',
        fontSize: '0.9rem',
      }}
    >
      {ok
        ? '✓ Supabase-klienten är konfigurerad'
        : '• Supabase väntar på nycklar (kopiera .env.example till .env)'}
    </div>
  )
}
