<script setup lang="ts">
/**
 * UniversalConverter — the "Magic" any-to-any drop zone.
 *
 * Drop ANY supported file. The UI auto-detects format, presents the valid
 * conversion targets, routes the job to the Omni-Worker, and downloads the result.
 * All buffers stay as ArrayBuffers/Blobs — no base64 in the UI layer.
 */
import { ref, shallowRef, computed } from 'vue'
import * as Comlink from 'comlink'
import { useOmniProcess } from '@/composables/useOmniProcess'
import { useMemoryManager } from '@/composables/useMemoryManager'
import { useSaaS } from '@/composables/useSaaS'
import { checkFileSize } from '@/core/limits'
import {
  detectFormat, getTargets, formatLabel,
  type FileFormat, type ConversionTarget,
} from '@/core/formats'
import DragDropZone from '@/shared/DragDropZone.vue'
import ProgressBar from '@/shared/ProgressBar.vue'

interface LoadedFile {
  name: string
  /** Keep the File handle (re-readable) so transferring its buffer is safe. */
  file: File
  format: FileFormat
  size: number
  mime: string
}

const loaded = shallowRef<LoadedFile | null>(null)
const selectedTarget = ref<FileFormat | null>(null)

const { progress, message, isProcessing, error, run } = useOmniProcess()
const { downloadBlob, collectGarbage } = useMemoryManager()
const { saveHistory } = useSaaS()

const targets = computed<ConversionTarget[]>(() =>
  loaded.value ? getTargets(loaded.value.format) : []
)

function handleFiles(files: File[]) {
  const file = files[0]
  if (!file) return
  // Fix #2 — reject oversized files up front with a friendly message.
  const sizeErr = checkFileSize(file)
  if (sizeErr) { error.value = sizeErr; return }

  error.value = null
  const format = detectFormat(file.name, file.type)
  loaded.value = {
    name: file.name,
    file,
    format,
    size: file.size,
    mime: file.type || 'application/octet-stream',
  }
  selectedTarget.value = getTargets(format)[0]?.format ?? null
}

function clear() {
  loaded.value = null
  selectedTarget.value = null
}

async function convert() {
  if (!loaded.value || !selectedTarget.value) return
  const src = loaded.value
  const target = selectedTarget.value

  const result = await run(async (worker, onProgress) => {
    // Read the buffer fresh each run; the File handle stays intact even after
    // we transfer (neuter) the buffer into the worker.
    const buffer = await src.file.arrayBuffer()

    // OCR-based image → text/word paths
    if ((src.format === 'jpg' || src.format === 'png') && (target === 'txt' || target === 'docx')) {
      const text = await worker.runOCR(Comlink.transfer(buffer, [buffer]), src.mime, 'eng', onProgress)
      if (target === 'txt') {
        const encoded = new TextEncoder().encode(text)
        return {
          buffer: encoded.buffer as ArrayBuffer,
          mime: 'text/plain', extension: 'txt',
        }
      }
      return worker.textToDocx(text)
    }

    // PDF → image
    if (src.format === 'pdf' && (target === 'jpg' || target === 'png')) {
      const { images } = await worker.pdfToImages(Comlink.transfer(buffer, [buffer]), 150, onProgress)
      // Fix #3 — guard against an empty/zero-page PDF before indexing.
      if (!images || images.length === 0) {
        throw new Error('This PDF has no pages to export as an image.')
      }
      return { buffer: images[0].buffer, mime: 'image/jpeg', extension: 'jpg' }
    }

    // PDF → other documents
    if (src.format === 'pdf') {
      return worker.convertFromPdf(Comlink.transfer(buffer, [buffer]), target, onProgress)
    }

    // Anything → PDF
    if (target === 'pdf') {
      return worker.convertToPdf(Comlink.transfer(buffer, [buffer]), src.format, onProgress)
    }

    throw new Error(`Conversion ${src.format} → ${target} is not available yet`)
  })

  if (result) {
    const outName = src.name.replace(/\.[^.]+$/, '') + '.' + result.extension
    const blob = new Blob([result.buffer], { type: result.mime })
    downloadBlob(blob, outName)

    saveHistory({
      source_format: src.format,
      target_format: target,
      filename: outName,
      file_size: result.buffer.byteLength,
    })

    await collectGarbage()
  }
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-2xl font-semibold">Universal Converter</h2>
      <p class="text-sm text-[var(--color-text-muted)] mt-1">
        Drop any file — we auto-detect the format and show every conversion you can run, 100% in your browser.
      </p>
    </div>

    <DragDropZone
      v-if="!loaded"
      :multiple="false"
      accept="*"
      label="Drop any document or image (PDF, Word, PPT, Excel, TXT, JPG, PNG)"
      @files-selected="handleFiles"
    />

    <div v-else class="space-y-5">
      <!-- File card -->
      <div class="flex items-center gap-3 p-4 bg-[var(--color-surface-alt)] rounded-xl border border-[var(--color-border)]">
        <div class="w-12 h-12 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center shrink-0">
          <span class="text-indigo-600 dark:text-indigo-300 font-bold text-xs uppercase">
            {{ loaded.format }}
          </span>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium truncate">{{ loaded.name }}</p>
          <p class="text-xs text-[var(--color-text-muted)]">
            {{ formatLabel(loaded.format) }} · {{ formatSize(loaded.size) }}
          </p>
        </div>
        <button class="text-xs text-red-500 hover:text-red-600 font-medium" @click="clear">Remove</button>
      </div>

      <!-- No conversions available -->
      <div v-if="targets.length === 0" class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-3 text-sm text-amber-700 dark:text-amber-300">
        This file format isn't supported for conversion.
      </div>

      <!-- Target selector -->
      <div v-else class="space-y-3">
        <label class="block text-sm font-medium">Convert to:</label>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <button
            v-for="t in targets"
            :key="t.format"
            class="px-4 py-3 rounded-lg border text-sm font-medium text-left transition-colors"
            :class="selectedTarget === t.format
              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300'
              : 'border-[var(--color-border)] hover:bg-gray-50 dark:hover:bg-slate-800'"
            @click="selectedTarget = t.format"
          >
            {{ t.label }}
          </button>
        </div>

        <button
          :disabled="isProcessing || !selectedTarget"
          class="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
          @click="convert"
        >
          {{ isProcessing ? 'Converting...' : 'Convert & Download' }}
        </button>
      </div>
    </div>

    <ProgressBar v-if="isProcessing" :progress="progress" :message="message" />

    <div v-if="error" class="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm p-3 rounded-lg">
      {{ error }}
    </div>
  </div>
</template>
