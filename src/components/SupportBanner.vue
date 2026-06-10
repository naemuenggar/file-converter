<script setup lang="ts">
/**
 * SupportBanner — a warm, non-intrusive nudge inviting users to support the
 * free project. Dismissible and remembered via localStorage so it never nags.
 *
 * Swap SUPPORT_URL for your BuyMeACoffee / Ko-fi / GitHub Sponsors link.
 */
import { useStorage } from '@vueuse/core'

const SUPPORT_URL = 'https://www.buymeacoffee.com/omnidocos'

// Persisted dismissal — once closed, it stays closed.
const dismissed = useStorage('omnidoc-support-dismissed', false)
</script>

<template>
  <Transition name="support">
    <div
      v-if="!dismissed"
      class="relative overflow-hidden rounded-2xl border border-amber-200/70 dark:border-amber-700/40 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 p-5 sm:p-6"
    >
      <!-- Soft decorative glow -->
      <div class="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-amber-300/30 blur-2xl" />

      <div class="relative flex flex-col sm:flex-row sm:items-center gap-4">
        <!-- Icon -->
        <div class="shrink-0 w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-2xl">
          ☕
        </div>

        <!-- Copy -->
        <div class="flex-1">
          <h3 class="text-sm font-semibold text-amber-900 dark:text-amber-100">
            Saved you some time? Buy the dev a coffee!
          </h3>
          <p class="text-xs text-amber-800/80 dark:text-amber-200/70 mt-0.5 leading-relaxed">
            OmniDoc OS is free, ad-free, and runs entirely in your browser. If it helped,
            a small tip keeps it alive and growing — no pressure, ever.
          </p>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-2 shrink-0">
          <a
            :href="SUPPORT_URL"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium transition-colors shadow-sm"
          >
            Support the project
          </a>
          <button
            class="p-2 rounded-lg text-amber-700/70 dark:text-amber-300/60 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
            aria-label="Dismiss"
            @click="dismissed = true"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.support-enter-active,
.support-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.support-enter-from,
.support-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
