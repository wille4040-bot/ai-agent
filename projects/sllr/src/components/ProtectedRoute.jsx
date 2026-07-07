import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'

// Skyddar sidor som kräver inloggning. Skickar tillbaka till inloggningen om
// ingen är inloggad, och visar inget medan sessionen laddas.
export default function ProtectedRoute({ children }) {
  const { user, laddar } = useAuth()

  if (laddar) {
    return <p className="innehall" style={{ color: 'var(--text-svag)' }}>Laddar…</p>
  }

  if (!user) {
    return <Navigate to="/logga-in" replace />
  }

  return children
}
