<script setup lang="ts">
/**
 * AppShell — top-level layout with a sticky header, theme toggle, and the
 * router outlet. Navigation is driven by Vue Router.
 *
 * Zero-friction: no authentication, no account prompts. The UI flows directly
 * into the tools — every feature is open and free.
 */
import { useRouter, useRoute } from 'vue-router'
import { useDarkMode } from '@/composables/useDarkMode'

const router = useRouter()
const route = useRoute()
const { isDark, toggle } = useDarkMode()
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

        <!-- Right controls — tools + theme only, no auth -->
        <div class="flex items-center gap-2">
          <button
            v-if="route.path !== '/'"
            class="px-3 py-1.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
            @click="router.push('/')"
          >
            All Tools
          </button>

          <a
            href="https://github.com/naemuenggar/file-converter"
            target="_blank"
            rel="noopener noreferrer"
            class="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
          >
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56v-2c-3.2.7-3.88-1.54-3.88-1.54-.53-1.34-1.3-1.7-1.3-1.7-1.06-.72.08-.71.08-.71 1.17.08 1.79 1.2 1.79 1.2 1.04 1.79 2.73 1.27 3.4.97.11-.75.41-1.27.74-1.56-2.55-.29-5.23-1.28-5.23-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 015.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.69 5.39-5.25 5.68.42.36.79 1.07.79 2.16v3.2c0 .31.21.68.8.56C20.71 21.39 24 17.08 24 12c0-6.27-5.23-11.5-12-11.5z" />
            </svg>
            Star on GitHub
          </a>

          <button
            class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            :title="isDark ? 'Light mode' : 'Dark mode'"
            :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
            @click="toggle"
          >
            <svg v-if="isDark" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
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
        OmniDoc OS · All processing happens locally in your browser · Zero server uploads · No login ever
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
