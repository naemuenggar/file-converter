<script setup lang="ts">
/**
 * PdfStudio - Advanced visual PDF workspace.
 * 
 * Upload multiple PDFs, view all page thumbnails in a virtual grid,
 * drag-and-drop to reorder, rotate, delete, and split pages.
 * All heavy processing delegated to the Web Worker.
 */
import { ref, shallowRef, computed, watch } from 'vue'
import { useWorkerProcess } from '@/composables/useWorkerProcess'
import { useCloudSync } from '@/composables/useCloudSync'
import { checkFileSize } from '@/core/limits'
import { saveWorkspace, type PageEntry, type WorkspaceState } from '@/core/indexedDb'
import DragDropZone from '@/shared/DragDropZone.vue'
import ProgressBar from '@/shared/ProgressBar.vue'
import Sortable from 'sortablejs'

// ─── State ───────────────────────────────────────────────────────────────────

interface SourceFile {
  id: string
  name: string
  buffer: ArrayBuffer
  pageCount: number
}

interface PageItem {
  id: string
  sourceFileId: string
  sourceFileName: string
  pageIndex: number
  rotation: number
  thumbnailUrl: string | null
  selected: boolean
}

const sourceFiles = shallowRef<SourceFile[]>([])
const pages = ref<PageItem[]>([])
const selectedPages = computed(() => pages.value.filter((p) => p.selected))

const { progress, message, isProcessing, error, execute, downloadBuffer, revokeAll } = useWorkerProcess()
const { syncMetadata } = useCloudSync()

const sortableContainer = ref<HTMLElement | null>(null)
let sortableInstance: Sortable | null = null

// ─── File Handling ───────────────────────────────────────────────────────────

async function handleFilesSelected(files: File[]) {
  for (const file of files) {
    const sizeErr = checkFileSize(file)
    if (sizeErr) { error.value = sizeErr; continue }
    const buffer = await file.arrayBuffer()
    const id = crypto.randomUUID()

    // Get page count from worker
    const pageCount = await execute(async (worker) => {
      return worker.getPageCount(buffer)
    })

    if (pageCount === null) continue

    const source: SourceFile = { id, name: file.name, buffer, pageCount }
    sourceFiles.value = [...sourceFiles.value, source]

    // Add page entries
    const newPages: PageItem[] = Array.from({ length: pageCount }, (_, i) => ({
      id: `${id}-page-${i}`,
      sourceFileId: id,
      sourceFileName: file.name,
      pageIndex: i,
      rotation: 0,
      thumbnailUrl: null,
      selected: false,
    }))

    pages.value = [...pages.value, ...newPages]

    // Generate thumbnails in background
    generateThumbnails(id, buffer)
  }
}

async function generateThumbnails(sourceId: string, buffer: ArrayBuffer) {
  const result = await execute(async (worker, onProgress) => {
    return worker.generateThumbnails(buffer, 0.25, onProgress)
  })

  if (!result) return

  // Update page items with thumbnail URLs
  const updated = [...pages.value]
  for (const thumb of result) {
    const pageItem = updated.find(
      (p) => p.sourceFileId === sourceId && p.pageIndex === thumb.pageIndex
    )
    if (pageItem) {
      pageItem.thumbnailUrl = URL.createObjectURL(thumb.blob)
    }
  }
  pages.value = updated
}

// ─── Page Operations ─────────────────────────────────────────────────────────

function toggleSelect(page: PageItem) {
  page.selected = !page.selected
}

function selectAll() {
  pages.value.forEach((p) => (p.selected = true))
}

function deselectAll() {
  pages.value.forEach((p) => (p.selected = false))
}

function deleteSelected() {
  const selectedIds = new Set(selectedPages.value.map((p) => p.id))
  pages.value = pages.value.filter((p) => !selectedIds.has(p.id))
}

function rotateSelected(degrees: number) {
  for (const page of pages.value) {
    if (page.selected) {
      page.rotation = (page.rotation + degrees) % 360
    }
  }
}

// ─── Export Operations ───────────────────────────────────────────────────────

async function exportMerged() {
  if (pages.value.length === 0) return

  // Build page map for the worker
  const fileIndexMap = new Map<string, number>()
  const buffers: ArrayBuffer[] = []

  for (const source of sourceFiles.value) {
    fileIndexMap.set(source.id, buffers.length)
    buffers.push(source.buffer)
  }

  const pageMap = pages.value.map((p) => ({
    sourceIndex: fileIndexMap.get(p.sourceFileId) ?? 0,
    pageIndex: p.pageIndex,
    rotation: p.rotation,
  }))

  const result = await execute(async (worker, onProgress) => {
    return worker.reorderPages(buffers, pageMap, onProgress)
  })

  if (result) {
    downloadBuffer(result, 'pdfcraft-studio-output.pdf')

    // Sync metadata to cloud
    syncMetadata({
      filename: 'pdfcraft-studio-output.pdf',
      page_count: pages.value.length,
      file_size: result.byteLength,
      operation: 'studio-reorder',
    })
  }
}

async function splitSelected() {
  if (selectedPages.value.length === 0) return

  // Group selected pages by source
  const grouped = new Map<string, number[]>()
  for (const page of selectedPages.value) {
    const existing = grouped.get(page.sourceFileId) ?? []
    existing.push(page.pageIndex)
    grouped.set(page.sourceFileId, existing)
  }

  // For simplicity, create one document with all selected pages
  const fileIndexMap = new Map<string, number>()
  const buffers: ArrayBuffer[] = []

  for (const source of sourceFiles.value) {
    fileIndexMap.set(source.id, buffers.length)
    buffers.push(source.buffer)
  }

  const pageMap = selectedPages.value.map((p) => ({
    sourceIndex: fileIndexMap.get(p.sourceFileId) ?? 0,
    pageIndex: p.pageIndex,
    rotation: p.rotation,
  }))

  const result = await execute(async (worker, onProgress) => {
    return worker.reorderPages(buffers, pageMap, onProgress)
  })

  if (result) {
    downloadBuffer(result, 'pdfcraft-split-selection.pdf')
  }
}

// ─── Persistence ─────────────────────────────────────────────────────────────

watch(pages, () => {
  const state: WorkspaceState = {
    id: 'default',
    pages: pages.value.map((p): PageEntry => ({
      id: p.id,
      sourceFileId: p.sourceFileId,
      sourceFileName: p.sourceFileName,
      pageIndex: p.pageIndex,
      rotation: p.rotation,
    })),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
  saveWorkspace(state)
}, { deep: true })

// ─── Drag & Drop Sorting ─────────────────────────────────────────────────────

watch(sortableContainer, (el) => {
  if (el && !sortableInstance) {
    sortableInstance = Sortable.create(el, {
      animation: 150,
      ghostClass: 'opacity-30',
      onEnd(evt) {
        if (evt.oldIndex !== undefined && evt.newIndex !== undefined) {
          const moved = pages.value.splice(evt.oldIndex, 1)[0]
          pages.value.splice(evt.newIndex, 0, moved)
        }
      },
    })
  }
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-semibold">PDF Studio</h2>
        <p class="text-sm text-[var(--color-text-muted)] mt-1">
          Visual page editor — reorder, rotate, split, and merge across multiple documents
        </p>
      </div>
      <div class="flex gap-2">
        <span class="text-xs text-[var(--color-text-muted)] bg-[var(--color-surface-alt)] px-2 py-1 rounded">
          {{ pages.length }} pages
        </span>
        <span class="text-xs text-[var(--color-text-muted)] bg-[var(--color-surface-alt)] px-2 py-1 rounded">
          {{ sourceFiles.length }} files
        </span>
      </div>
    </div>

    <!-- Drop Zone -->
    <DragDropZone
      :disabled="isProcessing"
      label="Drop PDF files to add pages to your workspace"
      @files-selected="handleFilesSelected"
    />

    <!-- Progress -->
    <ProgressBar v-if="isProcessing" :progress="progress" :message="message" />

    <!-- Error -->
    <div v-if="error" class="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm p-3 rounded-lg">
      {{ error }}
    </div>

    <!-- Toolbar -->
    <div v-if="pages.length > 0" class="flex flex-wrap gap-2 p-3 bg-[var(--color-surface-alt)] rounded-lg border border-[var(--color-border)]">
      <button
        class="px-3 py-1.5 text-xs font-medium bg-white dark:bg-slate-700 border border-[var(--color-border)] rounded-md hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors"
        @click="selectAll"
      >
        Select All
      </button>
      <button
        class="px-3 py-1.5 text-xs font-medium bg-white dark:bg-slate-700 border border-[var(--color-border)] rounded-md hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors"
        @click="deselectAll"
      >
        Deselect
      </button>
      <button
        :disabled="selectedPages.length === 0"
        class="px-3 py-1.5 text-xs font-medium bg-white dark:bg-slate-700 border border-[var(--color-border)] rounded-md hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors disabled:opacity-40"
        @click="rotateSelected(90)"
      >
        Rotate 90°
      </button>
      <button
        :disabled="selectedPages.length === 0"
        class="px-3 py-1.5 text-xs font-medium bg-white dark:bg-slate-700 border border-[var(--color-border)] rounded-md hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors disabled:opacity-40"
        @click="rotateSelected(180)"
      >
        Rotate 180°
      </button>
      <button
        :disabled="selectedPages.length === 0"
        class="px-3 py-1.5 text-xs font-medium bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-md hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors disabled:opacity-40"
        @click="deleteSelected"
      >
        Delete ({{ selectedPages.length }})
      </button>

      <div class="flex-1" />

      <button
        :disabled="selectedPages.length === 0 || isProcessing"
        class="px-3 py-1.5 text-xs font-medium bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800 rounded-md hover:bg-purple-100 transition-colors disabled:opacity-40"
        @click="splitSelected"
      >
        Split Selection
      </button>
      <button
        :disabled="pages.length === 0 || isProcessing"
        class="px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-40"
        @click="exportMerged"
      >
        Export All
      </button>
    </div>

    <!-- Page Grid (Drag-sortable) -->
    <div
      v-if="pages.length > 0"
      ref="sortableContainer"
      class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3"
    >
      <div
        v-for="(page, idx) in pages"
        :key="page.id"
        class="relative group cursor-grab rounded-lg border-2 overflow-hidden transition-all duration-150"
        :class="{
          'border-indigo-500 ring-2 ring-indigo-200 dark:ring-indigo-800': page.selected,
          'border-[var(--color-border)] hover:border-gray-300 dark:hover:border-slate-500': !page.selected,
        }"
        @click="toggleSelect(page)"
      >
        <!-- Thumbnail -->
        <div class="aspect-[3/4] bg-gray-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
          <img
            v-if="page.thumbnailUrl"
            :src="page.thumbnailUrl"
            :alt="`Page ${page.pageIndex + 1} of ${page.sourceFileName}`"
            class="w-full h-full object-contain"
            :style="{ transform: `rotate(${page.rotation}deg)` }"
            loading="lazy"
          />
          <div v-else class="text-xs text-[var(--color-text-muted)] animate-pulse">
            Loading...
          </div>
        </div>

        <!-- Page info badge -->
        <div class="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1">
          <p class="text-[10px] text-white truncate">{{ page.sourceFileName }}</p>
          <p class="text-[10px] text-white/70">Page {{ page.pageIndex + 1 }}</p>
        </div>

        <!-- Index badge -->
        <div class="absolute top-1 left-1 bg-black/50 text-white text-[9px] px-1.5 py-0.5 rounded">
          {{ idx + 1 }}
        </div>

        <!-- Rotation indicator -->
        <div v-if="page.rotation !== 0" class="absolute top-1 right-1 bg-indigo-500 text-white text-[9px] px-1.5 py-0.5 rounded">
          {{ page.rotation }}°
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="pages.length === 0 && !isProcessing" class="text-center py-12 text-[var(--color-text-muted)]">
      <p class="text-sm">No pages in workspace. Upload PDF files to get started.</p>
    </div>
  </div>
</template>
