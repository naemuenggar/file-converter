/**
 * useMemoryManager Composable
 *
 * Centralized lifecycle control for Blob Object URLs and large buffers.
 * Guarantees the browser never leaks memory during heavy WASM/OCR tasks by:
 *  - Tracking every created Object URL and revoking on demand / unmount
 *  - Exposing shallowRef-based file state (no deep proxying of huge buffers)
 *  - Providing GC "hints" after heavy operations
 */
import { shallowRef, onUnmounted, type ShallowRef } from 'vue'

export interface ManagedFile {
  id: string
  name: string
  size: number
  type: string
  /** Raw bytes — kept out of Vue reactivity via shallowRef container */
  buffer: ArrayBuffer
}

export function useMemoryManager() {
  // shallowRef prevents Vue from recursively proxying massive ArrayBuffers
  const files: ShallowRef<ManagedFile[]> = shallowRef([])
  const trackedUrls = new Set<string>()

  /** Register a File from an <input>/drop and read it into an ArrayBuffer */
  async function ingestFile(file: File): Promise<ManagedFile> {
    const buffer = await file.arrayBuffer()
    const managed: ManagedFile = {
      id: crypto.randomUUID(),
      name: file.name,
      size: file.size,
      type: file.type || inferType(file.name),
      buffer,
    }
    files.value = [...files.value, managed]
    return managed
  }

  /** Remove a managed file and release its buffer reference for GC */
  function releaseFile(id: string) {
    const target = files.value.find((f) => f.id === id)
    if (target) {
      // Drop the reference; replacing array lets the old buffer be collected
      files.value = files.value.filter((f) => f.id !== id)
    }
  }

  /** Create a tracked Object URL from a Blob */
  function createUrl(blob: Blob): string {
    const url = URL.createObjectURL(blob)
    trackedUrls.add(url)
    return url
  }

  /** Revoke a single tracked URL */
  function revokeUrl(url: string) {
    if (trackedUrls.has(url)) {
      URL.revokeObjectURL(url)
      trackedUrls.delete(url)
    }
  }

  /** Revoke every tracked URL */
  function revokeAll() {
    for (const url of trackedUrls) {
      URL.revokeObjectURL(url)
    }
    trackedUrls.clear()
  }

  /** Download a Blob then revoke its URL after the download has started */
  function downloadBlob(blob: Blob, filename: string) {
    const url = createUrl(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    // Delay revocation so the browser can begin the download
    setTimeout(() => revokeUrl(url), 4000)
  }

  /**
   * GC hint — after a heavy task we drop references and, if the engine exposes
   * window.gc (Chrome with --expose-gc), trigger a collection. In normal builds
   * this simply yields the event loop so the allocator can reclaim memory.
   */
  async function collectGarbage() {
    await new Promise((r) => setTimeout(r, 0))
    const maybeGc = (globalThis as unknown as { gc?: () => void }).gc
    if (typeof maybeGc === 'function') maybeGc()
  }

  /** Clear all managed files (releasing buffers) */
  function clearFiles() {
    files.value = []
  }

  onUnmounted(() => {
    revokeAll()
    clearFiles()
  })

  return {
    files,
    ingestFile,
    releaseFile,
    clearFiles,
    createUrl,
    revokeUrl,
    revokeAll,
    downloadBlob,
    collectGarbage,
  }
}

/** Infer a MIME-ish type from a filename extension */
function inferType(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  const map: Record<string, string> = {
    pdf: 'application/pdf',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    doc: 'application/msword',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    csv: 'text/csv',
    txt: 'text/plain',
    html: 'text/html',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
  }
  return map[ext] ?? 'application/octet-stream'
}
