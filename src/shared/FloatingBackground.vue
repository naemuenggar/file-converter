<script setup lang="ts">
/**
 * FloatingBackground — ambient gradient blobs that drift slowly behind hero
 * sections. Purely decorative (aria-hidden), GPU-friendly transforms only,
 * and frozen by prefers-reduced-motion via the keyframes in style.css.
 */
interface Props {
  /** Lower = more subtle. 0–1 */
  intensity?: number
}
withDefaults(defineProps<Props>(), { intensity: 1 })
</script>

<template>
  <div aria-hidden="true" class="pointer-events-none absolute inset-0 overflow-hidden" :style="{ opacity: intensity }">
    <div
      class="absolute -top-24 -left-16 h-72 w-72 rounded-full blur-3xl animate-float-blob"
      style="background: radial-gradient(circle at center, rgba(6,182,212,0.35), transparent 70%);"
    />
    <div
      class="absolute top-1/3 -right-20 h-80 w-80 rounded-full blur-3xl animate-float-blob"
      style="background: radial-gradient(circle at center, rgba(139,92,246,0.32), transparent 70%); animation-delay: -6s;"
    />
    <div
      class="absolute -bottom-24 left-1/3 h-64 w-64 rounded-full blur-3xl animate-float-blob"
      style="background: radial-gradient(circle at center, rgba(59,130,246,0.28), transparent 70%); animation-delay: -12s;"
    />
  </div>
</template>
