/**
 * useSaaS Composable
 *
 * Full Supabase SaaS integration for OmniDoc OS:
 *  - Authentication (email/password + OAuth)
 *  - Conversion history persisted to PostgreSQL (RLS-protected)
 *  - "Generate Public Link" → uploads a processed Blob to Storage and
 *    returns a signed, shareable URL.
 *
 * Gracefully no-ops when Supabase credentials are not configured.
 */
import { ref, computed } from 'vue'
import { getSupabaseClient, isSupabaseConfigured } from '@/core/supabaseClient'
import type { User } from '@supabase/supabase-js'

export interface ConversionHistoryEntry {
  id?: string
  user_id?: string
  source_format: string
  target_format: string
  filename: string
  file_size: number
  created_at?: string
}

// Module-level singleton state so auth is shared across all consumers
const user = ref<User | null>(null)
const authReady = ref(false)
let listenerBound = false

export function useSaaS() {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const uploadProgress = ref(0)
  const publicLink = ref<string | null>(null)

  const isConfigured = computed(() => isSupabaseConfigured())
  const isAuthenticated = computed(() => !!user.value)

  /** Bind auth listener once */
  function init() {
    if (!isConfigured.value || listenerBound) {
      authReady.value = true
      return
    }
    const supabase = getSupabaseClient()
    supabase.auth.getSession().then(({ data }) => {
      user.value = data.session?.user ?? null
      authReady.value = true
    })
    supabase.auth.onAuthStateChange((_e, session) => {
      user.value = session?.user ?? null
    })
    listenerBound = true
  }

  async function signIn(email: string, password: string) {
    if (!isConfigured.value) { error.value = 'Supabase not configured'; return }
    loading.value = true; error.value = null
    try {
      const { error: e } = await getSupabaseClient().auth.signInWithPassword({ email, password })
      if (e) throw e
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Sign in failed'
    } finally { loading.value = false }
  }

  async function signUp(email: string, password: string) {
    if (!isConfigured.value) { error.value = 'Supabase not configured'; return }
    loading.value = true; error.value = null
    try {
      const { error: e } = await getSupabaseClient().auth.signUp({ email, password })
      if (e) throw e
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Sign up failed'
    } finally { loading.value = false }
  }

  async function signInWithOAuth(provider: 'google' | 'github') {
    if (!isConfigured.value) { error.value = 'Supabase not configured'; return }
    try {
      const { error: e } = await getSupabaseClient().auth.signInWithOAuth({ provider })
      if (e) throw e
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'OAuth failed'
    }
  }

  async function signOut() {
    if (!isConfigured.value) return
    await getSupabaseClient().auth.signOut()
    user.value = null
  }

  /** Save a conversion record to the history table */
  async function saveHistory(entry: ConversionHistoryEntry): Promise<boolean> {
    if (!isConfigured.value || !user.value) return false
    try {
      const { error: e } = await getSupabaseClient()
        .from('conversion_history')
        .insert({ ...entry, user_id: user.value.id })
      if (e) throw e
      return true
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to save history'
      return false
    }
  }

  /** Fetch the current user's conversion history */
  async function fetchHistory(): Promise<ConversionHistoryEntry[]> {
    if (!isConfigured.value || !user.value) return []
    try {
      const { data, error: e } = await getSupabaseClient()
        .from('conversion_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)
      if (e) throw e
      return data ?? []
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch history'
      return []
    }
  }

  /**
   * Upload a processed Blob to Storage and return a signed public link.
   */
  async function generatePublicLink(
    blob: Blob,
    filename: string,
    bucket = 'omnidoc-files'
  ): Promise<string | null> {
    if (!isConfigured.value) { error.value = 'Supabase not configured'; return null }
    if (!user.value) { error.value = 'Sign in to generate links'; return null }

    loading.value = true
    uploadProgress.value = 0
    publicLink.value = null
    error.value = null

    try {
      const supabase = getSupabaseClient()
      const path = `${user.value.id}/${Date.now()}_${filename}`

      const { error: upErr } = await supabase.storage
        .from(bucket)
        .upload(path, blob, { upsert: false })
      if (upErr) throw upErr
      uploadProgress.value = 100

      const { data, error: signErr } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, 60 * 60 * 24) // 24h
      if (signErr) throw signErr

      publicLink.value = data.signedUrl
      return data.signedUrl
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Upload failed'
      return null
    } finally {
      loading.value = false
    }
  }

  return {
    user, authReady, isConfigured, isAuthenticated,
    loading, error, uploadProgress, publicLink,
    init, signIn, signUp, signInWithOAuth, signOut,
    saveHistory, fetchHistory, generatePublicLink,
  }
}
