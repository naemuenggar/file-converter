<script setup lang="ts">
/**
 * VirtualGrid - Virtual windowed grid for rendering thousands of thumbnails
 * without DOM bloat. Only renders items in the visible viewport + buffer.
 */
import { ref, computed, onMounted, onUnmounted } from 'vue'

interface Props {
  itemCount: number
  itemWidth: number
  itemHeight: number
  gap?: number
  bufferRows?: number
}

const props = withDefaults(defineProps<Props>(), {
  gap: 12,
  bufferRows: 2,
})

defineSlots<{
  default(props: { index: number; style: Record<string, string> }): unknown
}>()

const container = ref<HTMLElement | null>(null)
const scrollTop = ref(0)
const containerWidth = ref(800)
const containerHeight = ref(600)

// Calculate grid dimensions
const columnsPerRow = computed(() =>
  Math.max(1, Math.floor((containerWidth.value + props.gap) / (props.itemWidth + props.gap)))
)

const totalRows = computed(() => Math.ceil(props.itemCount / columnsPerRow.value))
const rowHeight = computed(() => props.itemHeight + props.gap)
const totalHeight = computed(() => totalRows.value * rowHeight.value)

// Visible range calculation
const startRow = computed(() =>
  Math.max(0, Math.floor(scrollTop.value / rowHeight.value) - props.bufferRows)
)

const endRow = computed(() =>
  Math.min(
    totalRows.value,
    Math.ceil((scrollTop.value + containerHeight.value) / rowHeight.value) + props.bufferRows
  )
)

const visibleItems = computed(() => {
  const items: Array<{ index: number; style: Record<string, string> }> = []

  for (let row = startRow.value; row < endRow.value; row++) {
    for (let col = 0; col < columnsPerRow.value; col++) {
      const index = row * columnsPerRow.value + col
      if (index >= props.itemCount) break

      items.push({
        index,
        style: {
          position: 'absolute',
          top: `${row * rowHeight.value}px`,
          left: `${col * (props.itemWidth + props.gap)}px`,
          width: `${props.itemWidth}px`,
          height: `${props.itemHeight}px`,
        },
      })
    }
  }

  return items
})

function handleScroll(e: Event) {
  const target = e.target as HTMLElement
  scrollTop.value = target.scrollTop
}

let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  if (container.value) {
    containerWidth.value = container.value.clientWidth
    containerHeight.value = container.value.clientHeight

    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        containerWidth.value = entry.contentRect.width
        containerHeight.value = entry.contentRect.height
      }
    })
    resizeObserver.observe(container.value)
  }
})

onUnmounted(() => {
  resizeObserver?.disconnect()
})
</script>

<template>
  <div
    ref="container"
    class="virtual-grid-container w-full h-full overflow-auto"
    @scroll="handleScroll"
  >
    <div class="relative" :style="{ height: `${totalHeight}px`, width: '100%' }">
      <template v-for="item in visibleItems" :key="item.index">
        <slot :index="item.index" :style="item.style" />
      </template>
    </div>
  </div>
</template>
