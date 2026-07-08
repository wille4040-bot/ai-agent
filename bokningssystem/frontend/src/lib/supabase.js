import { createClient } from '@supabase/supabase-js'

// Kopplingen till Supabase. Värdena hämtas från .env-filen
// (lokalt) eller från miljövariabler (på Netlify/Vercel).
const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Är nycklarna inte ifyllda ännu visar appen ett hjälpsamt
// meddelande i stället för att krascha.
export const supabaseKonfigurerad = Boolean(url && anonKey && !url.includes('DITT-PROJEKT'))

export const supabase = supabaseKonfigurerad ? createClient(url, anonKey) : null
