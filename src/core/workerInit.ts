/**
 * Worker Initialization Utilities
 * Provides lazy Comlink proxy creation for PDF workers.
 */
import { wrap, type Remote } from 'comlink'
import type { PdfWorkerApi } from '@/workers/pdfWorker'
import type { OmniWorkerApi } from '@/workers/omniWorker'

let workerProxy: Remote<PdfWorkerApi> | null = null
let omniProxy: Remote<OmniWorkerApi> | null = null

/**
 * Returns a Comlink-wrapped proxy to the Omni conversion Web Worker.
 */
export function getOmniWorker(): Remote<OmniWorkerApi> {
  if (!omniProxy) {
    const worker = new Worker(
      new URL('../workers/omniWorker.ts', import.meta.url),
      { type: 'module' }
    )
    omniProxy = wrap<OmniWorkerApi>(worker)
  }
  return omniProxy
}

/**
 * Returns a Comlink-wrapped proxy to the PDF processing Web Worker.
 * The worker is created lazily on first use and reused thereafter.
 */
export function getPdfWorker(): Remote<PdfWorkerApi> {
  if (!workerProxy) {
    const worker = new Worker(
      new URL('../workers/pdfWorker.ts', import.meta.url),
      { type: 'module' }
    )
    workerProxy = wrap<PdfWorkerApi>(worker)
  }
  return workerProxy
}

/**
 * Terminate the worker (for cleanup on logout or page unload).
 */
export function terminatePdfWorker(): void {
  if (workerProxy) {
    workerProxy = null
  }
}
