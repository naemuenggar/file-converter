<script setup lang="ts">
/**
 * AuthPanel - Minimal authentication UI for email/password and OAuth login.
 */
import { ref } from 'vue'
import { useAuth } from '@/composables/useAuth'

const { user, loading, error, isConfigured, isAuthenticated, signIn, signUp, signInWithOAuth, signOut } = useAuth()

const email = ref('')
const password = ref('')
const isLogin = ref(true)

async function handleSubmit() {
  if (isLogin.value) {
    await signIn(email.value, password.value)
  } else {
    await signUp(email.value, password.value)
  }
}
</script>

<template>
  <div class="max-w-sm mx-auto p-6">
    <!-- Not configured warning -->
    <div v-if="!isConfigured" class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-4 text-sm text-amber-800 dark:text-amber-200">
      <p class="font-medium">Cloud features unavailable</p>
      <p class="mt-1 text-xs">Configure Supabase credentials in .env to enable authentication and cloud sync.</p>
    </div>

    <!-- Authenticated state -->
    <div v-else-if="isAuthenticated" class="text-center space-y-4">
      <div class="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center mx-auto">
        <svg class="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </div>
      <p class="text-sm text-[var(--color-text-muted)]">Signed in as</p>
      <p class="font-medium truncate">{{ user?.email }}</p>
      <button
        class="w-full py-2 px-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
        @click="signOut"
      >
        Sign Out
      </button>
    </div>

    <!-- Login/Register form -->
    <form v-else class="space-y-4" @submit.prevent="handleSubmit">
      <h2 class="text-lg font-semibold text-center">
        {{ isLogin ? 'Sign In' : 'Create Account' }}
      </h2>

      <div v-if="error" class="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm p-3 rounded-lg">
        {{ error }}
      </div>

      <div>
        <label for="auth-email" class="block text-sm font-medium mb-1">Email</label>
        <input
          id="auth-email"
          v-model="email"
          type="email"
          required
          autocomplete="email"
          class="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label for="auth-password" class="block text-sm font-medium mb-1">Password</label>
        <input
          id="auth-password"
          v-model="password"
          type="password"
          required
          autocomplete="current-password"
          minlength="6"
          class="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
          placeholder="••••••••"
        />
      </div>

      <button
        type="submit"
        :disabled="loading"
        class="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
      >
        {{ loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up') }}
      </button>

      <!-- OAuth buttons -->
      <div class="flex gap-2">
        <button
          type="button"
          class="flex-1 py-2 px-3 border border-[var(--color-border)] rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
          @click="signInWithOAuth('google')"
        >
          Google
        </button>
        <button
          type="button"
          class="flex-1 py-2 px-3 border border-[var(--color-border)] rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
          @click="signInWithOAuth('github')"
        >
          GitHub
        </button>
      </div>

      <p class="text-center text-xs text-[var(--color-text-muted)]">
        {{ isLogin ? "Don't have an account?" : 'Already have an account?' }}
        <button
          type="button"
          class="text-indigo-500 hover:underline ml-1"
          @click="isLogin = !isLogin"
        >
          {{ isLogin ? 'Sign Up' : 'Sign In' }}
        </button>
      </p>
    </form>
  </div>
</template>
