<script setup lang="ts">
/**
 * SupportBanner — a warm, non-intrusive nudge inviting users to support the
 * free project via QRIS.
 *
 * Dismissal is in-memory only (not persisted): clicking ✕ hides it for the
 * current view, but it reappears on refresh or whenever the dashboard remounts
 * (e.g. after navigating into a tool and back).
 *
 * The QRIS barcode lives in the public/ directory and is served at the root.
 * Drop your actual barcode image at public/qris-barcode.png.
 */
import { ref } from 'vue'

// Path is resolved from the Vite public/ directory.
const QRIS_IMAGE = '/qris-barcode.png'

// In-memory dismissal — resets on refresh / remount so the nudge comes back.
const dismissed = ref(false)
</script>

<template>
  <Transition name="support">
    <div
      v-if="!dismissed"
      class="relative overflow-hidden rounded-2xl border border-amber-200/70 dark:border-amber-700/40 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 p-5 sm:p-6"
    >
      <!-- Soft decorative glow -->
      <div class="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-amber-300/30 blur-2xl" />

      <!-- Dismiss -->
      <button
        class="absolute top-3 right-3 p-2 rounded-lg text-amber-700/70 dark:text-amber-300/60 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
        aria-label="Dismiss"
        @click="dismissed = true"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div class="relative flex flex-col sm:flex-row sm:items-center gap-5">
        <!-- Copy -->
        <div class="flex-1">
          <div class="flex items-center gap-2">
            <span class="text-2xl">💜</span>
            <h3 class="text-sm font-semibold text-amber-900 dark:text-amber-100">
              Saved you some time? Support me via QRIS!
            </h3>
          </div>
          <p class="text-xs text-amber-800/80 dark:text-amber-200/70 mt-1.5 leading-relaxed">
            OmniDoc OS is free, ad-free, and runs entirely in your browser. If it helped,
            scan the QRIS code with any Indonesian e-wallet or mobile banking app to send
            a small tip — no pressure, ever.
          </p>
        </div>

        <!-- QRIS barcode -->
        <div class="shrink-0 flex flex-col items-center gap-2">
          <div class="rounded-xl bg-white p-3 shadow-sm border border-amber-200/70 dark:border-amber-700/40">
            <img
              :src="QRIS_IMAGE"
              alt="QRIS payment barcode to support the developer"
              width="220"
              height="220"
              class="block w-[220px] h-[220px] object-contain"
              loading="lazy"
            />
          </div>
          <span class="text-[11px] font-medium text-amber-700/80 dark:text-amber-300/70">
            Scan to pay with any QRIS app
          </span>
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
