<script setup lang="ts">
/**
 * TrustBadges — communicates the core privacy & trust guarantees of OmniDoc OS.
 * Designed to sit in the footer or on the dashboard.
 */
interface Badge {
  title: string
  subtitle: string
  icon: string
  color: string
}

const badges: Badge[] = [
  {
    title: '100% Free, No Login',
    subtitle: 'Every tool, unlimited use — no account required',
    color: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30',
    // Gift / free tag
    icon: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4',
  },
  {
    title: 'Total Privacy',
    subtitle: 'Your files never leave your device',
    color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/30',
    // Shield check
    icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  },
  {
    title: 'Powered by Browser WASM',
    subtitle: 'Native-speed processing, right in your tab',
    color: 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30',
    // Lightning / chip
    icon: 'M13 10V3L4 14h7v7l9-11h-7z',
  },
]
</script>

<template>
  <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
    <div
      v-for="badge in badges"
      :key="badge.title"
      class="flex items-start gap-3 p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)]"
    >
      <div class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" :class="badge.color">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" :d="badge.icon" />
        </svg>
      </div>
      <div>
        <h4 class="text-sm font-semibold">{{ badge.title }}</h4>
        <p class="text-xs text-[var(--color-text-muted)] mt-0.5">{{ badge.subtitle }}</p>
      </div>
    </div>
  </div>
</template>
