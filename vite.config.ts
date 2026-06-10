import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

// OmniDoc OS — Vite configuration tuned for client-side WASM, Web Workers,
// top-level await, and aggressive chunk splitting of heavy engines.
export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  // ES-module workers so Comlink + dynamic imports work inside workers
  worker: {
    format: 'es',
  },
  optimizeDeps: {
    // pdfjs-dist and tesseract.js ship their own workers/wasm; let them resolve
    // at runtime instead of being pre-bundled (avoids broken worker URLs).
    exclude: ['pdfjs-dist', 'tesseract.js'],
  },
  build: {
    // esnext enables top-level await used by the worker engines
    target: 'esnext',
    chunkSizeWarningLimit: 2000,
  },
  // Required so tesseract.js worker (which uses SharedArrayBuffer in some modes)
  // and cross-origin isolation behave during local dev.
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'credentialless',
    },
  },
})
