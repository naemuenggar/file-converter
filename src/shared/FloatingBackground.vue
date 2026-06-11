<script setup lang="ts">
/**
 * FloatingBackground — ambient gradient field that fills its positioned parent
 * edge to edge. Drifting blobs (top-left cyan/blue, bottom-right purple/violet,
 * a subtle center glow behind the headline) plus a soft base wash so light mode
 * has real depth instead of flat white. Purely decorative (aria-hidden),
 * GPU-friendly transforms only, frozen by prefers-reduced-motion.
 */
interface Props {
  /** Lower = more subtle. 0–1 */
  intensity?: number
}
withDefaults(defineProps<Props>(), { intensity: 1 })
</script>

<template>
  <div aria-hidden="true" class="pointer-events-none absolute inset-0 overflow-hidden z-0" :style="{ opacity: intensity }">
    <!-- Base wash: soft tint so light mode isn't flat white; near-invisible in dark -->
    <div
      class="absolute inset-0 bg-gradient-to-br from-cyan-100/50 via-blue-50/30 to-violet-100/50 dark:from-transparent dark:via-transparent dark:to-transparent"
    />

    <!-- Top-left: cyan / blue soft glow -->
    <div
      class="absolute -top-32 -left-24 h-[28rem] w-[28rem] rounded-full blur-3xl animate-float-blob
             bg-cyan-300/40 dark:bg-cyan-500/20"
    />
    <!-- Bottom-right: purple / violet soft glow -->
    <div
      class="absolute -bottom-32 -right-24 h-[30rem] w-[30rem] rounded-full blur-3xl animate-float-blob
             bg-violet-300/45 dark:bg-violet-600/25"
      style="animation-delay: -6s;"
    />
    <!-- Center, behind headline: subtle blue/purple glow -->
    <div
      class="absolute left-1/2 top-1/3 h-80 w-[34rem] -translate-x-1/2 rounded-full blur-3xl animate-float-blob
             bg-blue-200/40 dark:bg-blue-600/18"
      style="animation-delay: -12s;"
    />
    <!-- Extra mid-right accent for richer dark-mode depth -->
    <div
      class="absolute top-1/4 right-1/4 h-72 w-72 rounded-full blur-3xl animate-float-blob
             bg-purple-200/30 dark:bg-purple-700/20"
      style="animation-delay: -3s;"
    />
  </div>
</template>
