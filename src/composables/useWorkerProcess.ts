/**
 * useWorkerProcess Composable
 * 
 * Manages communication with the Comlink PDF Worker.
 * Tracks progress, processing state, errors, and handles
 * Blob URL lifecycle (creation + revocation) for memory safety.
 */
import { ref, shallowRef, onUnmounted } from 'vue'
import { getPdfWorker } from '@/core/workerInit'
import { friendlyError } from '@/core/errors'
import * as Comlink from 'comlink'
import type { ProgressCallback } from '@/workers/pdfWorker'

export interface ProcessState {
  progress: number
  message: string
  isProcessing: boolean
  error: string | null
}

/**
 * Generic composable for calling worker methods with progress tracking.
 */
export function useWorkerProcess() {
  const progress = ref(0)
  const message = ref('')
  const isProcessing = ref(false)
  const error = ref<string | null>(null)

  // Track all created object URLs for guaranteed cleanup
  const objectUrls = shallowRef<string[]>([])

  /** Reset state before a new operation */
  function reset() {
    progress.value = 0
    message.value = ''
    isProcessing.value = false
    error.value = null
  }

  /**
   * Create a Comlink-compatible progress callback proxy.
   * This lets the worker call back to the main thread with progress updates.
   */
  function createProgressProxy(): ProgressCallback {
    return Comlink.proxy((p: number, msg?: string) => {
      progress.value = p
      if (msg) message.value = msg
    })
  }

  /**
   * Execute a worker operation with full state management.
   * T is the return type of the worker method.
   */
  async function execute<T>(
    operation: (
      worker: ReturnType<typeof getPdfWorker>,
      onProgress: ProgressCallback
    ) => Promise<T>
  ): Promise<T | null> {
    // Fix #7 — refuse overlapping jobs that would corrupt shared state.
    if (isProcessing.value) {
      console.warn('[useWorkerProcess] A job is already running; ignoring concurrent request.')
      return null
    }

    reset()
    isProcessing.value = true

    try {
      const worker = getPdfWorker()
      const progressProxy = createProgressProxy()
      const result = await operation(worker, progressProxy)
      progress.value = 100
      message.value = 'Complete'
      return result
    } catch (err) {
      // Fix #3 — clean, user-friendly error text.
      error.value = friendlyError(err)
      console.error('[useWorkerProcess]', err)
      return null
    } finally {
      isProcessing.value = false
    }
  }

  /**
   * Create a safe Object URL from an ArrayBuffer.
   * Tracks the URL for automatic cleanup.
   */
  function createObjectUrl(buffer: ArrayBuffer, mimeType: string = 'application/pdf'): string {
    const blob = new Blob([buffer], { type: mimeType })
    const url = URL.createObjectURL(blob)
    objectUrls.value = [...objectUrls.value, url]
    return url
  }

  /**
   * Create a safe Object URL from a Blob.
   */
  function createBlobUrl(blob: Blob): string {
    const url = URL.createObjectURL(blob)
    objectUrls.value = [...objectUrls.value, url]
    return url
  }

  /**
   * Revoke a specific Object URL.
   */
  function revokeUrl(url: string) {
    URL.revokeObjectURL(url)
    objectUrls.value = objectUrls.value.filter((u) => u !== url)
  }

  /**
   * Revoke all tracked Object URLs (full cleanup).
   */
  function revokeAll() {
    for (const url of objectUrls.value) {
      URL.revokeObjectURL(url)
    }
    objectUrls.value = []
  }

  /**
   * Trigger a browser download from an ArrayBuffer.
   */
  function downloadBuffer(buffer: ArrayBuffer, filename: string) {
    const url = createObjectUrl(buffer)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)

    // Revoke after a short delay to ensure download starts
    setTimeout(() => revokeUrl(url), 5000)
  }

  /**
   * Trigger download from a Blob.
   */
  function downloadBlob(blob: Blob, filename: string) {
    const url = createBlobUrl(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => revokeUrl(url), 5000)
  }

  // Auto-cleanup on component unmount
  onUnmounted(() => {
    revokeAll()
  })

  return {
    // State
    progress,
    message,
    isProcessing,
    error,
    objectUrls,

    // Methods
    execute,
    reset,
    createObjectUrl,
    createBlobUrl,
    revokeUrl,
    revokeAll,
    downloadBuffer,
    downloadBlob,
  }
}
