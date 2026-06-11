<script setup lang="ts">
/**
 * FormatChip — small pill representing a supported file format (PDF, DOCX…).
 * Used in the hero mockup and the Supported Formats section.
 */
interface Props {
  label: string
  active?: boolean
}
withDefaults(defineProps<Props>(), { active: false })
</script>

<template>
  <span
    class="inline-flex items-center rounded-xl border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-all duration-300"
    :class="active
      ? 'border-indigo-400/60 bg-indigo-500/10 text-indigo-500 dark:text-indigo-300 shadow-[var(--glow)]'
      : 'border-[var(--color-border)] bg-[var(--color-surface-alt)] text-[var(--color-text-muted)] hover:border-indigo-300/60 hover:text-[var(--color-text)]'"
  >
    {{ label }}
  </span>
</template>
