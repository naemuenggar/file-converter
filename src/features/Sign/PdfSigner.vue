<script setup lang="ts">
/**
 * PdfSigner — visual PDF signing workspace.
 *
 * Upload a PDF, render the target page to a canvas preview, draw a signature
 * on a SignaturePad, drag it into position over the page, and stamp it via the
 * Omni-Worker (pdf-lib). Output is a signed PDF downloaded locally.
 */
import { ref, shallowRef, onMounted, onUnmounted, watch, nextTick } from 'vue'
import SignaturePad from 'signature_pad'
import { useOmniProcess } from '@/composables/useOmniProcess'
import { useMemoryManager } from '@/composables/useMemoryManager'
import { getOmniWorker } from '@/core/workerInit'
import { checkFileSize } from '@/core/limits'
import DragDropZone from '@/shared/DragDropZone.vue'

const source = shallowRef<{ name: string; buffer: ArrayBuffer } | null>(null)
const pageImageUrl = ref<string | null>(null)
const pageIndex = ref(0)
const pageCount = ref(0)

// Signature placement (normalized 0..1 within the page preview)
const placement = ref({ x: 0.6, y: 0.8, width: 0.25, height: 0.08 })
const signatureDataUrl = ref<string | null>(null)

const padCanvas = ref<HTMLCanvasElement | null>(null)
const previewWrap = ref<HTMLElement | null>(null)
let pad: SignaturePad | null = null

const { isProcessing, error } = useOmniProcess()
const { createUrl, revokeUrl, downloadBlob } = useMemoryManager()

// ─── Upload + render page preview ─────────────────────────────────────────────

async function handleFiles(files: File[]) {
  const file = files[0]
  if (!file) return
  const sizeErr = checkFileSize(file)
  if (sizeErr) { error.value = sizeErr; return }
  error.value = null
  const buffer = await file.arrayBuffer()
  source.value = { name: file.name, buffer }
  pageIndex.value = 0
  await renderPreview()
}

async function renderPreview() {
  if (!source.value) return
  const worker = getOmniWorker()
  const { images } = await worker.pdfToImages(source.value.buffer, 110)
  if (!images || images.length === 0) {
    error.value = 'This PDF has no renderable pages.'
    return
  }
  pageCount.value = images.length
  const target = images[pageIndex.value] ?? images[0]
  if (pageImageUrl.value) revokeUrl(pageImageUrl.value)
  const blob = new Blob([target.buffer], { type: target.mime })
  pageImageUrl.value = createUrl(blob)
}

watch(pageIndex, () => renderPreview())

// ─── Signature pad ────────────────────────────────────────────────────────────

function initPad() {
  if (padCanvas.value && !pad) {
    pad = new SignaturePad(padCanvas.value, {
      penColor: 'rgb(20, 20, 80)',
      backgroundColor: 'rgba(255,255,255,0)',
    })
  }
}

function clearPad() {
  pad?.clear()
  signatureDataUrl.value = null
}

function captureSignature() {
  if (!pad || pad.isEmpty()) return
  signatureDataUrl.value = pad.toDataURL('image/png')
}

// ─── Drag the signature box over the preview ──────────────────────────────────

let dragging = false

function startDrag(e: PointerEvent) {
  dragging = true
  ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
}

function onDrag(e: PointerEvent) {
  if (!dragging || !previewWrap.value) return
  const rect = previewWrap.value.getBoundingClientRect()
  placement.value = {
    ...placement.value,
    x: Math.min(1 - placement.value.width, Math.max(0, (e.clientX - rect.left) / rect.width)),
    y: Math.min(1 - placement.value.height, Math.max(0, (e.clientY - rect.top) / rect.height)),
  }
}

function endDrag() {
  dragging = false
}

// ─── Apply signature ──────────────────────────────────────────────────────────

async function applySignature() {
  if (!source.value || !signatureDataUrl.value) return

  // Convert signature dataURL → ArrayBuffer (PNG)
  const res = await fetch(signatureDataUrl.value)
  const sigBuffer = await res.arrayBuffer()

  const worker = getOmniWorker()
  const signed = await worker.signPdf(source.value.buffer, sigBuffer, {
    pageIndex: pageIndex.value,
    x: placement.value.x,
    y: placement.value.y,
    width: placement.value.width,
    height: placement.value.height,
  })

  const blob = new Blob([signed], { type: 'application/pdf' })
  downloadBlob(blob, source.value.name.replace('.pdf', '-signed.pdf'))
}

function reset() {
  if (pageImageUrl.value) revokeUrl(pageImageUrl.value)
  source.value = null
  pageImageUrl.value = null
  signatureDataUrl.value = null
}

onMounted(() => nextTick(initPad))
onUnmounted(() => {
  if (pageImageUrl.value) revokeUrl(pageImageUrl.value)
})

// Re-init pad whenever it mounts (it's behind v-if when file loaded)
watch(padCanvas, () => nextTick(initPad))
</script>

<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-2xl font-semibold">Sign PDF</h2>
      <p class="text-sm text-[var(--color-text-muted)] mt-1">
        Draw your signature, position it on the page, and download the signed document.
      </p>
    </div>

    <DragDropZone
      v-if="!source"
      :multiple="false"
      accept="application/pdf"
      label="Drop a PDF to sign"
      @files-selected="handleFiles"
    />

    <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Page preview with draggable signature -->
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium">Page Preview</span>
          <div class="flex items-center gap-2">
            <button
              :disabled="pageIndex === 0"
              class="px-2 py-1 text-xs border border-[var(--color-border)] rounded disabled:opacity-40"
              @click="pageIndex--"
            >Prev</button>
            <span class="text-xs text-[var(--color-text-muted)]">{{ pageIndex + 1 }} / {{ pageCount }}</span>
            <button
              :disabled="pageIndex >= pageCount - 1"
              class="px-2 py-1 text-xs border border-[var(--color-border)] rounded disabled:opacity-40"
              @click="pageIndex++"
            >Next</button>
          </div>
        </div>

        <div
          ref="previewWrap"
          class="relative border border-[var(--color-border)] rounded-lg overflow-hidden bg-gray-100 dark:bg-slate-800 select-none"
        >
          <img v-if="pageImageUrl" :src="pageImageUrl" alt="PDF page preview" class="w-full block" />

          <!-- Draggable signature overlay -->
          <div
            v-if="signatureDataUrl"
            class="absolute cursor-move border-2 border-dashed border-indigo-500 touch-none"
            :style="{
              left: `${placement.x * 100}%`,
              top: `${placement.y * 100}%`,
              width: `${placement.width * 100}%`,
              height: `${placement.height * 100}%`,
            }"
            @pointerdown="startDrag"
            @pointermove="onDrag"
            @pointerup="endDrag"
          >
            <img :src="signatureDataUrl" alt="signature" class="w-full h-full object-contain pointer-events-none" />
          </div>
        </div>
        <p class="text-xs text-[var(--color-text-muted)]">Drag the dashed box to position your signature.</p>
      </div>

      <!-- Signature pad + controls -->
      <div class="space-y-3">
        <span class="text-sm font-medium">Draw Signature</span>
        <div class="border border-[var(--color-border)] rounded-lg bg-white">
          <canvas ref="padCanvas" width="400" height="180" class="w-full touch-none" />
        </div>

        <div class="flex gap-2">
          <button
            class="flex-1 px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
            @click="clearPad"
          >
            Clear
          </button>
          <button
            class="flex-1 px-3 py-2 text-sm bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors"
            @click="captureSignature"
          >
            Use Signature
          </button>
        </div>

        <!-- Size controls -->
        <div v-if="signatureDataUrl" class="space-y-2 pt-2">
          <label class="block text-xs font-medium">Signature Width: {{ (placement.width * 100).toFixed(0) }}%</label>
          <input v-model.number="placement.width" type="range" min="0.1" max="0.6" step="0.01" class="w-full" />
        </div>

        <button
          :disabled="!signatureDataUrl || isProcessing"
          class="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
          @click="applySignature"
        >
          Apply Signature & Download
        </button>

        <button class="w-full text-xs text-red-500 hover:text-red-600 font-medium" @click="reset">
          Remove File
        </button>

        <div v-if="error" class="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm p-3 rounded-lg">
          {{ error }}
        </div>
      </div>
    </div>
  </div>
</template>
