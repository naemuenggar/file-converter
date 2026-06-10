<script setup lang="ts">
/**
 * PdfToImage - Convert PDF pages to high-quality JPG images.
 * 
 * Renders each page via pdfjs-dist inside the Web Worker using OffscreenCanvas.
 * Provides a gallery of downloadable images with virtual scrolling support.
 * 
 * Memory constraints:
 * - Uses URL.createObjectURL() for blobs (no base64)
 * - shallowRef for large collections to prevent Vue deep proxying
 * - Revokes URLs on component unmount
 */
import { ref, shallowRef, onUnmounted } from 'vue'
import { useWorkerProcess } from '@/composables/useWorkerProcess'
import DragDropZone from '@/shared/DragDropZone.vue'
import ProgressBar from '@/shared/ProgressBar.vue'

interface ImageResult {
  pageIndex: number
  url: string
  blob: Blob
}

const sourceFile = ref<{ name: string; buffer: ArrayBuffer } | null>(null)
const images = shallowRef<ImageResult[]>([])
const scale = ref(2.0) // Render quality: 1x, 2x, 3x

const { progress, message, isProcessing, error, execute } = useWorkerProcess()

// Track URLs for cleanup
const objectUrls: string[] = []

// ─── File Handling ───────────────────────────────────────────────────────────

async function handleFilesSelected(files: File[]) {
  const file = files[0]
  if (!file) return

  // Cleanup previous results
  cleanupUrls()
  images.value = []

  const buffer = await file.arrayBuffer()
  sourceFile.value = { name: file.name, buffer }
}

// ─── Convert ─────────────────────────────────────────────────────────────────

async function convertToImages() {
  if (!sourceFile.value) return

  // Clean previous
  cleanupUrls()
  images.value = []

  const result = await execute(async (worker, onProgress) => {
    return worker.generateThumbnails(sourceFile.value!.buffer, scale.value, onProgress)
  })

  if (!result) return

  // Create object URLs from blobs — no base64 encoding
  const newImages: ImageResult[] = []
  for (const thumb of result) {
    const url = URL.createObjectURL(thumb.blob)
    objectUrls.push(url)
    newImages.push({
      pageIndex: thumb.pageIndex,
      url,
      blob: thumb.blob,
    })
  }

  images.value = newImages
}

// ─── Download ────────────────────────────────────────────────────────────────

function downloadImage(img: ImageResult) {
  const a = document.createElement('a')
  a.href = img.url
  a.download = `${sourceFile.value?.name?.replace('.pdf', '') ?? 'page'}-${img.pageIndex + 1}.jpg`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

function downloadAll() {
  for (const img of images.value) {
    downloadImage(img)
  }
}

// ─── Cleanup ─────────────────────────────────────────────────────────────────

function cleanupUrls() {
  for (const url of objectUrls) {
    URL.revokeObjectURL(url)
  }
  objectUrls.length = 0
}

function reset() {
  cleanupUrls()
  images.value = []
  sourceFile.value = null
}

onUnmounted(() => {
  cleanupUrls()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h2 class="text-xl font-semibold">PDF to Image</h2>
      <p class="text-sm text-[var(--color-text-muted)] mt-1">
        Convert PDF pages to high-quality JPG images, entirely in your browser.
      </p>
    </div>

    <!-- Drop Zone -->
    <div v-if="!sourceFile">
      <DragDropZone
        :multiple="false"
        label="Drop a PDF file to convert to images"
        @files-selected="handleFilesSelected"
      />
    </div>

    <!-- File loaded -->
    <div v-else class="space-y-4">
      <div class="flex items-center gap-3 p-3 bg-[var(--color-surface-alt)] rounded-lg border border-[var(--color-border)]">
        <svg class="w-8 h-8 text-red-500 shrink-0" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4zM6 20V4h6v6h6v10H6z" />
        </svg>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium truncate">{{ sourceFile.name }}</p>
          <p class="text-xs text-[var(--color-text-muted)]">
            {{ (sourceFile.buffer.byteLength / 1024 / 1024).toFixed(2) }} MB
          </p>
        </div>
        <button class="text-xs text-red-500 hover:text-red-600 font-medium" @click="reset">
          Remove
        </button>
      </div>

      <!-- Quality Selector -->
      <div class="flex items-center gap-4">
        <label class="text-sm font-medium">Quality:</label>
        <div class="flex gap-2">
          <button
            v-for="s in [1, 1.5, 2, 3]"
            :key="s"
            class="px-3 py-1.5 text-xs rounded-md border transition-colors"
            :class="scale === s
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'border-[var(--color-border)] hover:bg-gray-50 dark:hover:bg-slate-800'"
            @click="scale = s"
          >
            {{ s }}x
          </button>
        </div>
      </div>

      <!-- Convert Button -->
      <button
        :disabled="isProcessing"
        class="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
        @click="convertToImages"
      >
        {{ isProcessing ? 'Converting...' : 'Convert to Images' }}
      </button>
    </div>

    <!-- Progress -->
    <ProgressBar v-if="isProcessing" :progress="progress" :message="message" />

    <!-- Error -->
    <div v-if="error" class="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm p-3 rounded-lg">
      {{ error }}
    </div>

    <!-- Image Gallery -->
    <div v-if="images.length > 0" class="space-y-4">
      <div class="flex items-center justify-between">
        <p class="text-sm font-medium">{{ images.length }} page{{ images.length > 1 ? 's' : '' }} converted</p>
        <button
          class="px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          @click="downloadAll"
        >
          Download All
        </button>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <div
          v-for="img in images"
          :key="img.pageIndex"
          class="group relative rounded-lg overflow-hidden border border-[var(--color-border)] bg-white dark:bg-slate-800"
        >
          <img
            :src="img.url"
            :alt="`Page ${img.pageIndex + 1}`"
            class="w-full aspect-[3/4] object-contain"
            loading="lazy"
          />

          <!-- Overlay -->
          <div class="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
            <button
              class="opacity-0 group-hover:opacity-100 px-3 py-1.5 bg-white text-gray-900 text-xs font-medium rounded-md shadow transition-opacity"
              @click="downloadImage(img)"
            >
              Download
            </button>
          </div>

          <!-- Page number -->
          <div class="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
            Page {{ img.pageIndex + 1 }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
