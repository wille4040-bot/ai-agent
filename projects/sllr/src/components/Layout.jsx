import { Link, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import { supabase } from '../lib/supabase.js'

// Gemensamt skal runt alla sidor: sidhuvud med logga och navigering som
// anpassar sig efter om man är inloggad eller inte.
export default function Layout() {
  const { user } = useAuth()
  const navigate = useNavigate()

  async function loggaUt() {
    await supabase.auth.signOut()
    navigate('/')
  }

  return (
    <>
      <header className="sidhuvud">
        <Link to="/" className="logga">
          Sllr
        </Link>
        <nav className="nav">
          <Link to="/annonser">Annonser</Link>
          {user ? (
            <>
              <Link to="/ny-annons">Lägg upp</Link>
              <Link to="/profil">Min profil</Link>
              <button className="btn btn-sekundar" onClick={loggaUt}>
                Logga ut
              </button>
            </>
          ) : (
            <Link to="/logga-in" className="btn">
              Logga in
            </Link>
          )}
        </nav>
      </header>
      <Outlet />
    </>
  )
}
