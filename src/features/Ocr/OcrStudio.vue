<script setup lang="ts">
/**
 * OcrStudio — Client-side OCR powered by tesseract.js in a Web Worker.
 *
 * Upload an image or scanned PDF, watch live recognition progress, edit the
 * extracted text, then export to .txt or .docx. No data ever leaves the browser.
 */
import { ref } from 'vue'
import { useOmniProcess } from '@/composables/useOmniProcess'
import { useMemoryManager } from '@/composables/useMemoryManager'
import { detectFormat } from '@/core/formats'
import DragDropZone from '@/shared/DragDropZone.vue'
import ProgressBar from '@/shared/ProgressBar.vue'

const source = ref<{ name: string; buffer: ArrayBuffer; mime: string; isPdf: boolean } | null>(null)
const extractedText = ref('')
const lang = ref('eng')

const { progress, message, isProcessing, error, run } = useOmniProcess()
const { downloadBlob, collectGarbage } = useMemoryManager()

const LANGS = [
  { code: 'eng', name: 'English' },
  { code: 'spa', name: 'Spanish' },
  { code: 'fra', name: 'French' },
  { code: 'deu', name: 'German' },
  { code: 'ita', name: 'Italian' },
  { code: 'por', name: 'Portuguese' },
  { code: 'ind', name: 'Indonesian' },
]

async function handleFiles(files: File[]) {
  const file = files[0]
  if (!file) return
  const buffer = await file.arrayBuffer()
  const fmt = detectFormat(file.name, file.type)
  source.value = {
    name: file.name,
    buffer,
    mime: file.type || 'image/png',
    isPdf: fmt === 'pdf',
  }
  extractedText.value = ''
}

async function runRecognition() {
  if (!source.value) return
  const src = source.value

  const text = await run(async (worker, onProgress) => {
    if (src.isPdf) {
      return worker.ocrPdf(src.buffer, lang.value, onProgress)
    }
    return worker.runOCR(src.buffer, src.mime, lang.value, onProgress)
  })

  if (text !== null) {
    extractedText.value = text
    await collectGarbage()
  }
}

function exportTxt() {
  const blob = new Blob([extractedText.value], { type: 'text/plain' })
  downloadBlob(blob, (source.value?.name.replace(/\.[^.]+$/, '') ?? 'ocr') + '.txt')
}

async function exportDocx() {
  const result = await run(async (worker) => worker.textToDocx(extractedText.value))
  if (result) {
    const blob = new Blob([result.buffer], { type: result.mime })
    downloadBlob(blob, (source.value?.name.replace(/\.[^.]+$/, '') ?? 'ocr') + '.docx')
  }
}

function reset() {
  source.value = null
  extractedText.value = ''
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-2xl font-semibold">OCR Studio</h2>
      <p class="text-sm text-[var(--color-text-muted)] mt-1">
        Extract text from images and scanned PDFs using on-device AI. Edit and export to Word or Text.
      </p>
    </div>

    <DragDropZone
      v-if="!source"
      :multiple="false"
      accept="image/*,application/pdf"
      label="Drop an image or scanned PDF to extract text"
      @files-selected="handleFiles"
    />

    <template v-else>
      <!-- File + language controls -->
      <div class="flex flex-wrap items-center gap-3 p-4 bg-[var(--color-surface-alt)] rounded-xl border border-[var(--color-border)]">
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium truncate">{{ source.name }}</p>
          <p class="text-xs text-[var(--color-text-muted)]">{{ source.isPdf ? 'Scanned PDF' : 'Image' }}</p>
        </div>

        <select
          v-model="lang"
          class="px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-sm outline-none"
        >
          <option v-for="l in LANGS" :key="l.code" :value="l.code">{{ l.name }}</option>
        </select>

        <button
          :disabled="isProcessing"
          class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
          @click="runRecognition"
        >
          {{ isProcessing ? 'Reading...' : 'Run OCR' }}
        </button>

        <button class="text-xs text-red-500 hover:text-red-600 font-medium" @click="reset">Remove</button>
      </div>

      <ProgressBar v-if="isProcessing" :progress="progress" :message="message" />

      <div v-if="error" class="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm p-3 rounded-lg">
        {{ error }}
      </div>

      <!-- Editable result -->
      <div v-if="extractedText" class="space-y-3">
        <div class="flex items-center justify-between">
          <label class="text-sm font-medium">Extracted Text (editable)</label>
          <div class="flex gap-2">
            <button
              class="px-3 py-1.5 text-xs font-medium border border-[var(--color-border)] rounded-md hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
              @click="exportTxt"
            >
              Export .txt
            </button>
            <button
              class="px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
              @click="exportDocx"
            >
              Export .docx
            </button>
          </div>
        </div>
        <textarea
          v-model="extractedText"
          rows="16"
          class="w-full p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-sm font-mono resize-y outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
    </template>
  </div>
</template>
