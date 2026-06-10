<script setup lang="ts">
/**
 * AppShell — top-level layout with a sticky header, theme toggle, and the
 * router outlet. Navigation is driven by Vue Router.
 */
import { useRouter, useRoute } from 'vue-router'
import { useDarkMode } from '@/composables/useDarkMode'
import { useSaaS } from '@/composables/useSaaS'
import { onMounted } from 'vue'

const router = useRouter()
const route = useRoute()
const { isDark, toggle } = useDarkMode()
const { isAuthenticated, user, init } = useSaaS()

onMounted(() => init())
</script>

<template>
  <div class="min-h-screen flex flex-col bg-[var(--color-surface)] text-[var(--color-text)]">
    <!-- Header -->
    <header class="sticky top-0 z-20 border-b border-[var(--color-border)] bg-[var(--color-surface)]/80 backdrop-blur">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <!-- Logo -->
        <button class="flex items-center gap-2" @click="router.push('/')">
          <div class="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span class="text-white font-bold text-sm">O</span>
          </div>
          <span class="font-semibold">OmniDoc OS</span>
        </button>

        <!-- Right controls -->
        <div class="flex items-center gap-2">
          <button
            v-if="route.path !== '/'"
            class="px-3 py-1.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
            @click="router.push('/')"
          >
            All Tools
          </button>

          <button
            class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            :title="isDark ? 'Light mode' : 'Dark mode'"
            @click="toggle"
          >
            <svg v-if="isDark" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          </button>

          <button
            class="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-sm hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
            @click="router.push('/account')"
          >
            <span class="w-2 h-2 rounded-full" :class="isAuthenticated ? 'bg-green-500' : 'bg-gray-400'" />
            {{ isAuthenticated ? (user?.email?.split('@')[0] ?? 'Account') : 'Sign In' }}
          </button>
        </div>
      </div>
    </header>

    <!-- Router outlet -->
    <main class="flex-1">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <RouterView v-slot="{ Component }">
          <Transition name="fade" mode="out-in">
            <component :is="Component" />
          </Transition>
        </RouterView>
      </div>
    </main>

    <!-- Footer -->
    <footer class="border-t border-[var(--color-border)] py-4">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 text-center text-xs text-[var(--color-text-muted)]">
        OmniDoc OS · All processing happens locally in your browser · Zero server uploads
      </div>
    </footer>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
