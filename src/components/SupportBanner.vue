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
      class="relative overflow-hidden rounded-2xl border border-amber-400/40 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 sm:p-8 shadow-lg"
    >
      <!-- Soft directional glow highlighting the metallic frame -->
      <div class="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 h-32 w-64 rounded-full bg-amber-300/10 blur-3xl" />

      <!-- Dismiss -->
      <button
        class="absolute top-3 right-3 p-2 rounded-lg text-amber-300/50 hover:text-amber-200 hover:bg-amber-900/30 transition-colors"
        aria-label="Dismiss"
        @click="dismissed = true"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <!-- Centered QRIS -->
      <div class="relative flex flex-col items-center gap-3">
        <div class="rounded-xl bg-white p-3 shadow-md border border-amber-400/40">
          <img
            :src="QRIS_IMAGE"
            alt="QRIS payment barcode to support the developer"
            width="220"
            height="220"
            class="block w-[220px] h-[220px] object-contain"
            loading="lazy"
          />
        </div>
        <span class="text-sm font-semibold tracking-wide text-amber-400">
          Scan to pay with any QRIS app
        </span>
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
