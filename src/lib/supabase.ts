import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// เช็คการเชื่อมต่อ
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Supabase auth event:', event)
  console.log('Session:', session)
}) 