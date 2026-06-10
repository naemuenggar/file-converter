/**
 * Supabase Client Initialization
 * Provides a singleton client for authentication, database, and storage operations.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

let client: SupabaseClient | null = null

/**
 * Returns the initialized Supabase client.
 * Lazy initialization to avoid errors when env vars are missing during dev.
 */
export function getSupabaseClient(): SupabaseClient {
  if (!client) {
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn(
        '[PDFCraft] Supabase credentials not configured. Cloud features disabled.'
      )
    }
    client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  }
  return client
}

/** Check if Supabase is properly configured */
export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey)
}
