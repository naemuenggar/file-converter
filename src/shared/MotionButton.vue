<script setup lang="ts">
/**
 * MotionButton — premium button with hover glow, active press, and
 * disabled states. Variants: primary (gradient), secondary (glass), ghost.
 */
import { computed } from 'vue'

interface Props {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  type?: 'button' | 'submit'
  block?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  disabled: false,
  type: 'button',
  block: false,
})

const sizeClass = computed(() => ({
  sm: 'px-3.5 py-2 text-sm gap-1.5',
  md: 'px-5 py-2.5 text-sm gap-2',
  lg: 'px-7 py-3.5 text-base gap-2.5',
}[props.size]))

const variantClass = computed(() => ({
  primary:
    'text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-[0_8px_24px_rgba(99,102,241,0.35)] hover:shadow-[0_12px_32px_rgba(99,102,241,0.45)]',
  secondary:
    'glass text-[var(--color-text)] hover:border-indigo-400/60 hover:shadow-[var(--glow)]',
  ghost:
    'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-alt)]',
}[props.variant]))
</script>

<template>
  <button
    :type="type"
    :disabled="disabled"
    class="inline-flex items-center justify-center font-semibold rounded-2xl transition-all duration-300 ease-out active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]"
    :class="[sizeClass, variantClass, block ? 'w-full' : '']"
  >
    <slot />
  </button>
</template>
