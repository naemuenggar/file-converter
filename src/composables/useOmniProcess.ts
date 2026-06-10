/**
 * useOmniProcess Composable
 *
 * Bridges Vue components to the Omni-Worker via Comlink.
 * Tracks granular progress and exposes typed helpers for each conversion path.
 */
import { ref } from 'vue'
import * as Comlink from 'comlink'
import { getOmniWorker } from '@/core/workerInit'
import { friendlyError } from '@/core/errors'
import type { ProgressFn } from '@/workers/omniWorker'

export function useOmniProcess() {
  const progress = ref(0)
  const message = ref('')
  const isProcessing = ref(false)
  const error = ref<string | null>(null)

  function reset() {
    progress.value = 0
    message.value = ''
    error.value = null
  }

  /** Comlink-proxied progress callback so the worker can report back */
  function progressProxy(): ProgressFn {
    return Comlink.proxy((p: number, msg?: string) => {
      progress.value = p
      if (msg) message.value = msg
    })
  }

  /**
   * Generic runner with full state + error management.
   *
   * Fix #7 — Concurrent-run guard: if a job is already running we refuse to
   * start another, preventing the shared progress/error state from being
   * corrupted by overlapping jobs.
   */
  async function run<T>(
    op: (worker: ReturnType<typeof getOmniWorker>, onProgress: ProgressFn) => Promise<T>
  ): Promise<T | null> {
    if (isProcessing.value) {
      console.warn('[useOmniProcess] A job is already running; ignoring concurrent request.')
      return null
    }

    reset()
    isProcessing.value = true
    try {
      const worker = getOmniWorker()
      const result = await op(worker, progressProxy())
      progress.value = 100
      message.value = 'Done'
      return result
    } catch (err) {
      // Fix #3 — surface a clean, human-readable message instead of raw stack text.
      error.value = friendlyError(err)
      console.error('[useOmniProcess]', err)
      return null
    } finally {
      isProcessing.value = false
    }
  }

  return { progress, message, isProcessing, error, reset, run, progressProxy }
}
