import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'

const AuthContext = createContext({ session: null, user: null, laddar: true })

// Provider som lyssnar på Supabase-sessionen och gör den tillgänglig i hela
// appen. Uppdateras automatiskt vid inloggning/utloggning.
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [laddar, setLaddar] = useState(true)

  useEffect(() => {
    // Hämta ev. befintlig session vid start (t.ex. efter omladdning).
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLaddar(false)
    })

    // Lyssna på framtida förändringar (login, logout, token-refresh).
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess)
    })

    return () => sub.subscription.unsubscribe()
  }, [])

  const varde = { session, user: session?.user ?? null, laddar }
  return <AuthContext.Provider value={varde}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
