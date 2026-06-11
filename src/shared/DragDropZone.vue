<script setup lang="ts">
/**
 * DragDropZone — premium file drop zone with visual feedback.
 * Honors the `accept` prop for both click-to-browse and drag-and-drop,
 * so any supported file type (not just PDF) can be dropped.
 */
import { ref, computed } from 'vue'

interface Props {
  accept?: string
  multiple?: boolean
  label?: string
  hint?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  accept: '.pdf,application/pdf',
  multiple: true,
  label: 'Drop your files here',
  hint: '',
  disabled: false,
})

const emit = defineEmits<{
  filesSelected: [files: File[]]
}>()

const isDragging = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
let dragDepth = 0

/** Parse the accept string into extension + mime matchers. "*" = accept all. */
const matchers = computed(() => {
  const raw = props.accept.trim()
  if (!raw || raw === '*' || raw === '*/*') return null
  return raw.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
})

function fileMatches(file: File): boolean {
  const rules = matchers.value
  if (!rules) return true
  const name = file.name.toLowerCase()
  const mime = (file.type || '').toLowerCase()
  return rules.some((rule) => {
    if (rule.startsWith('.')) return name.endsWith(rule)
    if (rule.endsWith('/*')) return mime.startsWith(rule.slice(0, -1))
    return mime === rule
  })
}

function handleDragOver(e: DragEvent) {
  e.preventDefault()
}

function handleDragEnter(e: DragEvent) {
  e.preventDefault()
  if (props.disabled) return
  dragDepth++
  isDragging.value = true
}

function handleDragLeave() {
  dragDepth = Math.max(0, dragDepth - 1)
  if (dragDepth === 0) isDragging.value = false
}

function handleDrop(e: DragEvent) {
  e.preventDefault()
  dragDepth = 0
  isDragging.value = false
  if (props.disabled) return

  const dropped = Array.from(e.dataTransfer?.files ?? [])
  const files = dropped.filter(fileMatches)
  if (files.length > 0) {
    emit('filesSelected', props.multiple ? files : [files[0]])
  }
}

function handleClick() {
  if (!props.disabled) fileInput.value?.click()
}

function handleFileInput(e: Event) {
  const input = e.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  if (files.length > 0) {
    emit('filesSelected', files)
  }
  // Reset so the same file can be re-selected
  input.value = ''
}
</script>

<template>
  <div
    role="button"
    tabindex="0"
    :aria-label="label"
    :aria-disabled="disabled"
    class="group relative rounded-3xl p-10 text-center cursor-pointer transition-all duration-300 ease-out overflow-hidden"
    :class="[
      isDragging
        ? 'scale-[1.01] shadow-[var(--glow)]'
        : 'hover:shadow-[var(--shadow-soft)]',
      disabled ? 'opacity-50 cursor-not-allowed' : '',
    ]"
    @dragenter="handleDragEnter"
    @dragover="handleDragOver"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
    @click="handleClick"
    @keydown.enter="handleClick"
    @keydown.space.prevent="handleClick"
  >
    <!-- Animated dashed border -->
    <span
      class="pointer-events-none absolute inset-0 rounded-3xl border-2 border-dashed transition-colors duration-300"
      :class="isDragging
        ? 'border-indigo-400'
        : 'border-[var(--color-border)] group-hover:border-indigo-300/70'"
    />
    <!-- Glow wash when dragging -->
    <span
      class="pointer-events-none absolute inset-0 rounded-3xl transition-opacity duration-300"
      :class="isDragging ? 'opacity-100' : 'opacity-0'"
      style="background: radial-gradient(circle at center, rgba(99,102,241,0.12), transparent 70%);"
    />

    <input
      ref="fileInput"
      type="file"
      :accept="accept"
      :multiple="multiple"
      class="hidden"
      @change="handleFileInput"
    />

    <div class="relative flex flex-col items-center gap-4">
      <!-- Upload icon in a gradient ring -->
      <div
        class="flex h-16 w-16 items-center justify-center rounded-2xl transition-all duration-300"
        :class="isDragging
          ? 'bg-gradient-to-br from-indigo-500 to-violet-500 scale-110'
          : 'bg-[var(--color-surface-alt)] group-hover:scale-105'"
      >
        <svg
          class="h-8 w-8 transition-colors duration-300"
          :class="isDragging ? 'text-white' : 'text-indigo-500'"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.5"
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
      </div>

      <div class="space-y-1">
        <p class="text-base font-semibold text-[var(--color-text)]">
          {{ isDragging ? 'Drop to upload' : label }}
        </p>
        <p class="text-sm text-[var(--color-text-muted)]">
          or <span class="font-medium text-indigo-500">browse your files</span>
        </p>
      </div>

      <p v-if="hint" class="text-xs text-[var(--color-text-muted)]/70 max-w-sm">
        {{ hint }}
      </p>
    </div>
  </div>
</template>
