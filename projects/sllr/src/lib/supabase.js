import { createClient } from '@supabase/supabase-js'

// Läses från .env (se .env.example). Vite exponerar bara variabler som
// börjar med VITE_ till frontend-koden.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Flagga som resten av appen kan använda för att visa ett tydligt felmeddelande
// om nycklarna saknas, istället för att krascha på ett obegripligt sätt.
export const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

if (!supabaseConfigured) {
  console.warn(
    'Supabase är inte konfigurerat. Kopiera .env.example till .env och fyll i ' +
      'VITE_SUPABASE_URL och VITE_SUPABASE_ANON_KEY.'
  )
}

// Skapa klienten även om nycklar saknas (med tomma strängar) så att importer
// inte kraschar under utveckling – anrop kommer då att misslyckas tydligt.
export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '')
