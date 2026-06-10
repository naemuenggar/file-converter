/**
 * useAuth Composable
 * 
 * Manages Supabase authentication state.
 * Provides login, register, OAuth, and logout functionality.
 */
import { ref, computed, onMounted } from 'vue'
import { getSupabaseClient, isSupabaseConfigured } from '@/core/supabaseClient'
import type { User, Session } from '@supabase/supabase-js'

export function useAuth() {
  const user = ref<User | null>(null)
  const session = ref<Session | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const isConfigured = computed(() => isSupabaseConfigured())
  const isAuthenticated = computed(() => !!user.value)

  /** Initialize auth state listener */
  onMounted(() => {
    if (!isConfigured.value) return

    const supabase = getSupabaseClient()

    // Get initial session
    supabase.auth.getSession().then(({ data }) => {
      session.value = data.session
      user.value = data.session?.user ?? null
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        session.value = newSession
        user.value = newSession?.user ?? null
      }
    )

    // Cleanup is handled by Supabase internally; subscription persists
    void subscription
  })

  /** Sign in with email and password */
  async function signIn(email: string, password: string) {
    if (!isConfigured.value) {
      error.value = 'Supabase not configured'
      return
    }

    loading.value = true
    error.value = null

    try {
      const supabase = getSupabaseClient()
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (authError) throw authError
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Sign in failed'
    } finally {
      loading.value = false
    }
  }

  /** Register with email and password */
  async function signUp(email: string, password: string) {
    if (!isConfigured.value) {
      error.value = 'Supabase not configured'
      return
    }

    loading.value = true
    error.value = null

    try {
      const supabase = getSupabaseClient()
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
      })
      if (authError) throw authError
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Sign up failed'
    } finally {
      loading.value = false
    }
  }

  /** OAuth login (Google, GitHub, etc.) */
  async function signInWithOAuth(provider: 'google' | 'github') {
    if (!isConfigured.value) {
      error.value = 'Supabase not configured'
      return
    }

    loading.value = true
    error.value = null

    try {
      const supabase = getSupabaseClient()
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider,
      })
      if (authError) throw authError
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'OAuth sign in failed'
    } finally {
      loading.value = false
    }
  }

  /** Sign out */
  async function signOut() {
    if (!isConfigured.value) return

    loading.value = true
    try {
      const supabase = getSupabaseClient()
      await supabase.auth.signOut()
      user.value = null
      session.value = null
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Sign out failed'
    } finally {
      loading.value = false
    }
  }

  return {
    user,
    session,
    loading,
    error,
    isConfigured,
    isAuthenticated,
    signIn,
    signUp,
    signInWithOAuth,
    signOut,
  }
}
