<script setup lang="ts">
/**
 * SectionReveal — reveals its slot content when scrolled into view.
 * Uses IntersectionObserver (no scroll listeners) and respects
 * prefers-reduced-motion via the .reveal CSS rules in style.css.
 */
import { ref, onMounted, onBeforeUnmount } from 'vue'

interface Props {
  /** Stagger delay in ms before the reveal transition runs */
  delay?: number
  /** Re-trigger every time it enters the viewport (default: once) */
  once?: boolean
  /** Render element tag */
  as?: string
}

const props = withDefaults(defineProps<Props>(), {
  delay: 0,
  once: true,
  as: 'div',
})

const el = ref<HTMLElement | null>(null)
const visible = ref(false)
let observer: IntersectionObserver | null = null

onMounted(() => {
  if (!el.value) return

  // Fallback: if IO is unavailable, just show content.
  if (typeof IntersectionObserver === 'undefined') {
    visible.value = true
    return
  }

  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          visible.value = true
          if (props.once) observer?.disconnect()
        } else if (!props.once) {
          visible.value = false
        }
      }
    },
    { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
  )
  observer.observe(el.value)
})

onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <component
    :is="as"
    ref="el"
    class="reveal"
    :class="{ 'is-visible': visible }"
    :style="{ transitionDelay: `${delay}ms` }"
  >
    <slot />
  </component>
</template>
