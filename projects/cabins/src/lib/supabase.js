import { createClient } from '@supabase/supabase-js'

// Supabase-klient. Om miljövariabler saknas (t.ex. lokal utveckling utan
// backend) är klienten null och appen faller tillbaka på statisk data.
const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = url && anonKey ? createClient(url, anonKey) : null

export const isBackendConfigured = Boolean(supabase)

// Hämta bekräftade, bokade perioder för en stuga från databasen.
// Faller tillbaka på `fallback` (statisk data) om backend inte är konfigurerad.
export async function getBookedRanges(cabinId, fallback = []) {
  if (!supabase) return fallback
  try {
    // `availability` är en vy som bara exponerar bekräftade datumintervall
    // (ingen gästinformation).
    const { data, error } = await supabase
      .from('availability')
      .select('start_date, end_date')
      .eq('cabin_id', cabinId)
    if (error) throw error
    return (data || []).map((b) => ({ start: b.start_date, end: b.end_date }))
  } catch {
    return fallback
  }
}
