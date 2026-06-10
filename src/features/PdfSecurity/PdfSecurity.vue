<script setup lang="ts">
/**
 * PdfSecurity - Password protection and dynamic watermarking.
 * 
 * Features:
 * - Encrypt PDF with user/owner passwords
 * - Stamp a diagonal text watermark with adjustable opacity, size, color, rotation
 * All processing in Web Worker via Comlink.
 */
import { ref, reactive } from 'vue'
import { useWorkerProcess } from '@/composables/useWorkerProcess'
import { checkFileSize } from '@/core/limits'
import DragDropZone from '@/shared/DragDropZone.vue'
import ProgressBar from '@/shared/ProgressBar.vue'

// ─── State ───────────────────────────────────────────────────────────────────

const activeTab = ref<'watermark' | 'encrypt'>('watermark')
const sourceFile = ref<{ name: string; buffer: ArrayBuffer } | null>(null)

// Watermark options
const watermarkOptions = reactive({
  text: 'CONFIDENTIAL',
  opacity: 0.3,
  fontSize: 48,
  color: { r: 0.5, g: 0.5, b: 0.5 },
  rotation: -45,
})

// Encryption options
const encryptOptions = reactive({
  userPassword: '',
  ownerPassword: '',
})

const { progress, message, isProcessing, error, execute, downloadBuffer } = useWorkerProcess()

// ─── File Handling ───────────────────────────────────────────────────────────

async function handleFilesSelected(files: File[]) {
  const file = files[0]
  if (!file) return
  const sizeErr = checkFileSize(file)
  if (sizeErr) { error.value = sizeErr; return }
  error.value = null
  const buffer = await file.arrayBuffer()
  sourceFile.value = { name: file.name, buffer }
}

function clearFile() {
  sourceFile.value = null
}

// ─── Watermark ───────────────────────────────────────────────────────────────

async function applyWatermark() {
  if (!sourceFile.value) return

  const result = await execute(async (worker, onProgress) => {
    return worker.applyWatermark(sourceFile.value!.buffer, watermarkOptions, onProgress)
  })

  if (result) {
    const name = sourceFile.value.name.replace('.pdf', '-watermarked.pdf')
    downloadBuffer(result, name)
  }
}

// ─── Encrypt ─────────────────────────────────────────────────────────────────

async function applyEncryption() {
  if (!sourceFile.value) return
  if (!encryptOptions.userPassword) return

  const result = await execute(async (worker, onProgress) => {
    return worker.encryptPdf(sourceFile.value!.buffer, {
      userPassword: encryptOptions.userPassword,
      ownerPassword: encryptOptions.ownerPassword || encryptOptions.userPassword,
    }, onProgress)
  })

  if (result) {
    const name = sourceFile.value.name.replace('.pdf', '-encrypted.pdf')
    downloadBuffer(result, name)
  }
}

// ─── Color helper ────────────────────────────────────────────────────────────

function handleColorChange(e: Event) {
  const hex = (e.target as HTMLInputElement).value
  watermarkOptions.color = {
    r: parseInt(hex.slice(1, 3), 16) / 255,
    g: parseInt(hex.slice(3, 5), 16) / 255,
    b: parseInt(hex.slice(5, 7), 16) / 255,
  }
}

function colorToHex(): string {
  const r = Math.round(watermarkOptions.color.r * 255).toString(16).padStart(2, '0')
  const g = Math.round(watermarkOptions.color.g * 255).toString(16).padStart(2, '0')
  const b = Math.round(watermarkOptions.color.b * 255).toString(16).padStart(2, '0')
  return `#${r}${g}${b}`
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h2 class="text-xl font-semibold">PDF Security & Watermark</h2>
      <p class="text-sm text-[var(--color-text-muted)] mt-1">
        Protect your documents with passwords or stamp custom watermarks
      </p>
    </div>

    <!-- Tab Switcher -->
    <div class="flex gap-1 p-1 bg-[var(--color-surface-alt)] rounded-lg border border-[var(--color-border)] w-fit">
      <button
        class="px-4 py-2 text-sm font-medium rounded-md transition-colors"
        :class="activeTab === 'watermark' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'"
        @click="activeTab = 'watermark'"
      >
        Watermark
      </button>
      <button
        class="px-4 py-2 text-sm font-medium rounded-md transition-colors"
        :class="activeTab === 'encrypt' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'"
        @click="activeTab = 'encrypt'"
      >
        Encrypt
      </button>
    </div>

    <!-- File Upload -->
    <div v-if="!sourceFile">
      <DragDropZone
        :multiple="false"
        label="Drop a PDF file to protect"
        @files-selected="handleFilesSelected"
      />
    </div>

    <!-- File loaded -->
    <div v-else class="flex items-center gap-3 p-3 bg-[var(--color-surface-alt)] rounded-lg border border-[var(--color-border)]">
      <svg class="w-8 h-8 text-red-500 shrink-0" fill="currentColor" viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4zM6 20V4h6v6h6v10H6z" />
      </svg>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium truncate">{{ sourceFile.name }}</p>
        <p class="text-xs text-[var(--color-text-muted)]">
          {{ (sourceFile.buffer.byteLength / 1024 / 1024).toFixed(2) }} MB
        </p>
      </div>
      <button
        class="text-xs text-red-500 hover:text-red-600 font-medium"
        @click="clearFile"
      >
        Remove
      </button>
    </div>

    <!-- Progress -->
    <ProgressBar v-if="isProcessing" :progress="progress" :message="message" />

    <!-- Error -->
    <div v-if="error" class="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm p-3 rounded-lg">
      {{ error }}
    </div>

    <!-- Watermark Panel -->
    <div v-if="activeTab === 'watermark' && sourceFile" class="space-y-4 p-4 bg-[var(--color-surface-alt)] rounded-lg border border-[var(--color-border)]">
      <h3 class="text-sm font-semibold">Watermark Settings</h3>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-medium mb-1">Text</label>
          <input
            v-model="watermarkOptions.text"
            type="text"
            class="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="CONFIDENTIAL"
          />
        </div>

        <div>
          <label class="block text-xs font-medium mb-1">Font Size: {{ watermarkOptions.fontSize }}px</label>
          <input
            v-model.number="watermarkOptions.fontSize"
            type="range"
            min="12"
            max="120"
            class="w-full"
          />
        </div>

        <div>
          <label class="block text-xs font-medium mb-1">Opacity: {{ (watermarkOptions.opacity * 100).toFixed(0) }}%</label>
          <input
            v-model.number="watermarkOptions.opacity"
            type="range"
            min="0.05"
            max="1"
            step="0.05"
            class="w-full"
          />
        </div>

        <div>
          <label class="block text-xs font-medium mb-1">Rotation: {{ watermarkOptions.rotation }}°</label>
          <input
            v-model.number="watermarkOptions.rotation"
            type="range"
            min="-90"
            max="90"
            class="w-full"
          />
        </div>

        <div>
          <label class="block text-xs font-medium mb-1">Color</label>
          <input
            type="color"
            :value="colorToHex()"
            class="w-12 h-8 rounded cursor-pointer"
            @input="handleColorChange"
          />
        </div>
      </div>

      <button
        :disabled="isProcessing || !watermarkOptions.text"
        class="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
        @click="applyWatermark"
      >
        Apply Watermark & Download
      </button>
    </div>

    <!-- Encrypt Panel -->
    <div v-if="activeTab === 'encrypt' && sourceFile" class="space-y-4 p-4 bg-[var(--color-surface-alt)] rounded-lg border border-[var(--color-border)]">
      <h3 class="text-sm font-semibold">Encryption Settings</h3>

      <div class="space-y-3">
        <div>
          <label class="block text-xs font-medium mb-1">User Password (required to open)</label>
          <input
            v-model="encryptOptions.userPassword"
            type="password"
            class="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Enter password"
          />
        </div>

        <div>
          <label class="block text-xs font-medium mb-1">Owner Password (optional, for permissions)</label>
          <input
            v-model="encryptOptions.ownerPassword"
            type="password"
            class="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Leave empty to use user password"
          />
        </div>
      </div>

      <div class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-3 text-xs text-amber-700 dark:text-amber-300">
        <strong>Note:</strong> pdf-lib has limited native encryption support.
        For production AES-256 encryption, integrate a dedicated WASM library like mupdf or qpdf.
      </div>

      <button
        :disabled="isProcessing || !encryptOptions.userPassword"
        class="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
        @click="applyEncryption"
      >
        Encrypt & Download
      </button>
    </div>
  </div>
</template>
