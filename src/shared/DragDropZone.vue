<script setup lang="ts">
/**
 * DragDropZone - Universal file drop zone with visual feedback.
 * Accepts PDF files via click or drag-and-drop.
 */
import { ref } from 'vue'

interface Props {
  accept?: string
  multiple?: boolean
  label?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  accept: '.pdf,application/pdf',
  multiple: true,
  label: 'Drop PDF files here or click to browse',
  disabled: false,
})

const emit = defineEmits<{
  filesSelected: [files: File[]]
}>()

const isDragging = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

function handleDragOver(e: DragEvent) {
  e.preventDefault()
  if (!props.disabled) isDragging.value = true
}

function handleDragLeave() {
  isDragging.value = false
}

function handleDrop(e: DragEvent) {
  e.preventDefault()
  isDragging.value = false
  if (props.disabled) return

  const files = Array.from(e.dataTransfer?.files ?? []).filter((f) =>
    f.type === 'application/pdf' || f.name.endsWith('.pdf')
  )
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
  // Reset input so same file can be re-selected
  input.value = ''
}
</script>

<template>
  <div
    role="button"
    tabindex="0"
    :aria-label="label"
    :aria-disabled="disabled"
    class="relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200"
    :class="{
      'border-indigo-400 bg-indigo-50 dark:bg-indigo-950/30': isDragging,
      'border-[var(--color-border)] hover:border-indigo-300 hover:bg-gray-50 dark:hover:bg-slate-800/50': !isDragging && !disabled,
      'opacity-50 cursor-not-allowed': disabled,
    }"
    @dragover="handleDragOver"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
    @click="handleClick"
    @keydown.enter="handleClick"
    @keydown.space.prevent="handleClick"
  >
    <input
      ref="fileInput"
      type="file"
      :accept="accept"
      :multiple="multiple"
      class="hidden"
      @change="handleFileInput"
    />

    <div class="flex flex-col items-center gap-3">
      <!-- Upload icon -->
      <svg
        class="w-12 h-12 transition-colors"
        :class="isDragging ? 'text-indigo-500' : 'text-[var(--color-text-muted)]'"
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

      <p class="text-sm text-[var(--color-text-muted)] font-medium">
        {{ label }}
      </p>
      <p class="text-xs text-[var(--color-text-muted)]/60">
        PDF files only • Max 500MB per file
      </p>
    </div>
  </div>
</template>
